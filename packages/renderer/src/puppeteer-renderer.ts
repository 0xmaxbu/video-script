/**
 * Playwright-based frame renderer that bypasses the broken @remotion/bundler.
 *
 * The @remotion/bundler has a bug where its webpack config aliases
 * `@remotion/studio` to `dist/index.js`. When webpack resolves
 * `@remotion/studio/renderEntry`, it incorrectly looks for
 * `dist/index.js/renderEntry` which doesn't exist.
 *
 * This module uses Playwright to launch Chrome, load the Remotion bundle,
 * and render frames directly using CDP (Chrome DevTools Protocol) calls.
 */

import { createServer, type Server } from "http";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "fs";
import { join, extname, isAbsolute, resolve } from "path";
import { spawn } from "child_process";
import {
  chromium,
  type Browser,
  type Page,
  type BrowserContext,
} from "playwright";
import { z } from "zod";
import * as esbuild from "esbuild";
import { ScriptOutput, SceneScriptSchema } from "./types.js";
import {
  generateRemotionProject,
  type GenerateProjectInput,
} from "./remotion-project-generator.js";
import { cleanupRemotionTempDir } from "./cleanup.js";

export const PuppeteerRenderInputSchema = z.object({
  script: z.object({
    title: z.string(),
    totalDuration: z.number().positive(),
    scenes: z.array(SceneScriptSchema),
  }),
  screenshotResources: z.record(z.string(), z.string()),
  outputDir: z.string().min(1),
  videoFileName: z.string().optional(),
  compositionId: z.string().default("Video"),
  fps: z.number().int().positive().default(30),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  onProgress: z.function().optional(),
});

export interface PuppeteerRenderInput {
  script: ScriptOutput;
  screenshotResources: Record<string, string>;
  outputDir: string;
  videoFileName?: string;
  compositionId?: string;
  fps?: number;
  width?: number;
  height?: number;
  onProgress?: (progress: number, message?: string) => void;
}

export const PuppeteerRenderOutputSchema = z.object({
  videoPath: z.string(),
  duration: z.number(),
  fps: z.number(),
  resolution: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
  framesRendered: z.number().optional(),
});

export interface PuppeteerRenderOutput {
  videoPath: string;
  duration: number;
  fps: number;
  resolution: string;
  success: boolean;
  error?: string;
  framesRendered?: number;
}

/**
 * Calculate total duration from scenes
 */
export function calculateTotalDuration(
  scenes: z.infer<typeof SceneScriptSchema>[],
): number {
  return scenes.reduce((sum, scene) => sum + scene.duration, 0);
}

/**
 * MIME types for static file serving
 */
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

/**
 * Create a simple HTTP server to serve the Remotion bundle
 */
function createBundleServer(bundleDir: string, port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      let filePath = join(
        bundleDir,
        req.url === "/" ? "index.html" : req.url || "index.html",
      );

      // Security: prevent directory traversal
      if (!filePath.startsWith(bundleDir)) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }

      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      if (!existsSync(filePath)) {
        // For SPA, serve index.html for any non-file routes
        if (!ext || ext === ".html") {
          filePath = join(bundleDir, "index.html");
          if (!existsSync(filePath)) {
            res.statusCode = 404;
            res.end("Not Found");
            return;
          }
        } else {
          res.statusCode = 404;
          res.end("Not Found");
          return;
        }
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");

      const stream = createReadStream(filePath);
      stream.on("error", (err) => {
        console.error(`Error serving ${filePath}:`, err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      });
      stream.pipe(res);
    });

    server.listen(port, () => {
      resolve(server);
    });

    server.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Bundle the Remotion project using esbuild
 */
async function bundleRemotionProjectWithEsbuild(
  projectPath: string,
  outputDir: string,
): Promise<{ success: boolean; bundlePath: string; error?: string }> {
  try {
    const entryPoint = join(projectPath, "src", "index.tsx");

    const esbuildOptions: any = {
      entryPoints: [entryPoint],
      bundle: true,
      outfile: join(outputDir, "index.js"),
      platform: "browser",
      format: "esm",
      splitting: false,
      sourcemap: false,
      minify: false,
      absWorkingDir: projectPath,
      loader: {
        ".tsx": "tsx",
        ".ts": "ts",
        ".jsx": "jsx",
        ".js": "js",
        ".png": "file",
        ".jpg": "file",
        ".jpeg": "file",
        ".gif": "file",
        ".svg": "file",
        ".woff": "file",
        ".woff2": "file",
        ".ttf": "file",
      },
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs"],
    };

    await esbuild.build(esbuildOptions);

    return { success: true, bundlePath: outputDir };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, bundlePath: "", error: errorMessage };
  }
}

/**
 * Render frames using Playwright and CDP
 */
async function renderFrames(
  page: Page,
  options: {
    compositionId: string;
    totalFrames: number;
    width: number;
    height: number;
    framesDir: string;
    onProgress?: (progress: number, message?: string) => void;
  },
): Promise<{ success: boolean; framesRendered: number; error?: string }> {
  const { compositionId, totalFrames, width, height, framesDir, onProgress } =
    options;

  // Create frames directory
  mkdirSync(framesDir, { recursive: true });

  try {
    // Wait for Remotion to be ready
    await page.waitForFunction(
      () => {
        return typeof (window as any).remotion_setFrame === "function";
      },
      { timeout: 30000 },
    );

    onProgress?.(5, "Remotion runtime ready");

    // Render each frame
    for (let frame = 0; frame < totalFrames; frame++) {
      // Set the current frame
      await page.evaluate(
        ({ frameNum, compId }) => {
          (window as any).remotion_setFrame(frameNum, compId);
        },
        { frameNum: frame, compId: compositionId },
      );

      // Wait for the frame to render
      await page.waitForTimeout(50); // Small delay to ensure frame is rendered

      // Capture screenshot
      const screenshot = await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width, height },
      });

      // Save frame
      const framePath = join(
        framesDir,
        `frame-${String(frame).padStart(6, "0")}.png`,
      );
      writeFileSync(framePath, screenshot);

      // Report progress (50-90% range for frame rendering)
      const progress = 50 + (frame / totalFrames) * 40;
      onProgress?.(progress, `Rendering frame ${frame + 1}/${totalFrames}`);
    }

    return { success: true, framesRendered: totalFrames };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, framesRendered: 0, error: errorMessage };
  }
}

/**
 * Stitch frames into video using FFmpeg
 */
async function stitchFramesWithFFmpeg(
  framesDir: string,
  outputPath: string,
  fps: number,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const args = [
      "-y", // Overwrite output
      "-framerate",
      String(fps),
      "-i",
      join(framesDir, "frame-%06d.png"),
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath,
    ];

    const ffmpeg = spawn("ffmpeg", args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stderr = "";

    ffmpeg.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    ffmpeg.on("close", (code: number) => {
      if (code === 0 && existsSync(outputPath)) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: `FFmpeg failed (exit code ${code}): ${stderr}`,
        });
      }
    });

    ffmpeg.on("error", (err: Error) => {
      resolve({
        success: false,
        error: `FFmpeg process error: ${err.message}`,
      });
    });
  });
}

/**
 * Clean up temporary frames directory
 */
function cleanupFrames(framesDir: string): void {
  try {
    if (existsSync(framesDir)) {
      rmSync(framesDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn(`Failed to clean up frames directory: ${framesDir}`, error);
  }
}

/**
 * Main render function using Playwright-based frame rendering
 *
 * This bypasses the broken @remotion/bundler by:
 * 1. Bundling the Remotion project
 * 2. Serving it via HTTP
 * 3. Using Playwright to render each frame via CDP
 * 4. Stitching frames with FFmpeg
 */
export async function renderVideoWithPuppeteer(
  input: PuppeteerRenderInput,
): Promise<PuppeteerRenderOutput> {
  const {
    script,
    screenshotResources,
    outputDir,
    videoFileName = `${script.title.toLowerCase().replace(/\s+/g, "-")}.mp4`,
    compositionId = "Video",
    fps = 30,
    width = 1920,
    height = 1080,
    onProgress,
  } = input;

  const absoluteOutputDir = isAbsolute(outputDir)
    ? outputDir
    : resolve(process.cwd(), outputDir);

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  let server: Server | null = null;
  let framesDir: string | null = null;

  try {
    onProgress?.(0, "Starting Playwright renderer");

    // Calculate total frames
    const duration = calculateTotalDuration(script.scenes);
    const totalFrames = Math.ceil(duration * fps);

    onProgress?.(5, "Generating Remotion project");

    // Generate Remotion project
    const projectInput: GenerateProjectInput = {
      script,
      screenshotResources,
      outputPath: join(absoluteOutputDir, ".remotion-project"),
    };

    const projectResult = await generateRemotionProject(projectInput);

    if (!projectResult.success) {
      return {
        videoPath: "",
        duration: 0,
        fps,
        resolution: `${width}x${height}`,
        success: false,
        error: projectResult.error || "Failed to generate Remotion project",
      };
    }

    onProgress?.(15, "Bundling Remotion project");

    // Bundle the project
    const bundleDir = join(absoluteOutputDir, ".remotion-bundle");
    const bundleResult = await bundleRemotionProjectWithEsbuild(
      projectResult.projectPath,
      bundleDir,
    );

    if (!bundleResult.success) {
      return {
        videoPath: "",
        duration: 0,
        fps,
        resolution: `${width}x${height}`,
        success: false,
        error: bundleResult.error || "Failed to bundle Remotion project",
      };
    }

    onProgress?.(25, "Starting local server");

    // Start HTTP server for the bundle
    const port = 3456 + Math.floor(Math.random() * 1000); // Random port to avoid conflicts
    server = await createBundleServer(bundleDir, port);
    const bundleUrl = `http://localhost:${port}`;

    onProgress?.(30, "Launching browser");

    // Launch Playwright browser
    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--disable-web-security",
      ],
    });

    context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2,
    });

    page = await context.newPage();

    onProgress?.(35, "Loading Remotion bundle");

    // Navigate to the bundle
    await page.goto(bundleUrl, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    onProgress?.(40, "Preparing frame rendering");

    // Prepare frames directory
    framesDir = join(absoluteOutputDir, ".frames");
    if (existsSync(framesDir)) {
      rmSync(framesDir, { recursive: true, force: true });
    }

    // Render frames
    const renderResult = await renderFrames(page, {
      compositionId,
      totalFrames,
      width,
      height,
      framesDir,
      ...(onProgress ? { onProgress } : {}),
    });

    if (!renderResult.success) {
      return {
        videoPath: "",
        duration: 0,
        fps,
        resolution: `${width}x${height}`,
        success: false,
        error: renderResult.error || "Frame rendering failed",
      };
    }

    onProgress?.(90, "Stitching frames with FFmpeg");

    // Stitch frames into video
    const videoOutputPath = join(absoluteOutputDir, videoFileName);
    const stitchResult = await stitchFramesWithFFmpeg(
      framesDir,
      videoOutputPath,
      fps,
    );

    if (!stitchResult.success) {
      return {
        videoPath: "",
        duration: 0,
        fps,
        resolution: `${width}x${height}`,
        success: false,
        error: stitchResult.error || "FFmpeg stitching failed",
      };
    }

    onProgress?.(95, "Cleaning up temporary files");

    // Cleanup
    cleanupFrames(framesDir!);
    framesDir = null;

    try {
      await cleanupRemotionTempDir(projectResult.projectPath, {
        preservePatterns: ["*.mp4", "*.srt", "*.json"],
      });
    } catch (cleanupError) {
      console.warn("Failed to clean up Remotion project:", cleanupError);
    }

    onProgress?.(100, "Video rendering complete");

    return {
      videoPath: videoOutputPath,
      duration,
      fps,
      resolution: `${width}x${height}`,
      success: true,
      framesRendered: renderResult.framesRendered,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      videoPath: "",
      duration: 0,
      fps,
      resolution: `${width}x${height}`,
      success: false,
      error: `Playwright rendering error: ${errorMessage}`,
    };
  } finally {
    // Cleanup resources
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    if (server) server.close();

    if (framesDir && existsSync(framesDir)) {
      cleanupFrames(framesDir);
    }
  }
}
