import { join, isAbsolute, resolve } from "path";
import { homedir } from "os";
import { existsSync, mkdirSync } from "fs";
import { z } from "zod";
import { bundle, type WebpackOverrideFn } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import type { VideoConfig } from "remotion/no-react";
import { ScriptOutput, SceneScriptSchema } from "./types.js";
import { generateOutputDirectory } from "./output-directory.js";

// Webpack override function to handle Node.js polyfills
// This fixes pnpm monorepo issues where path, fs, stream are not available
const webpackOverride: WebpackOverrideFn = (config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    fallback: {
      ...config.resolve?.fallback,
      path: require.resolve("path-browserify"),
      fs: require.resolve("path-browserify"),
      stream: false,
    },
  },
});

// Bundle location cache to avoid re-bundling on every render
let cachedBundleLocation: string | null = null;

async function getBundleLocation(entryPoint: string): Promise<string> {
  if (cachedBundleLocation) {
    return cachedBundleLocation;
  }

  // Use legacy tuple format: bundle(entryPoint, onProgress?, options?)
  const bundleLocation = await bundle(entryPoint, (progress) => {
    // Log bundle progress at 10% intervals
    if (Math.round(progress * 100) % 10 === 0) {
      console.log(`Bundling: ${Math.round(progress * 100)}%`);
    }
  }, {
    webpackOverride,
    outDir: "/tmp/video-script-bundles",
    enableCaching: true,
    publicPath: "",
    rootDir: null,
    publicDir: null,
    onPublicDirCopyProgress: () => undefined,
    onSymlinkDetected: () => undefined,
    keyboardShortcutsEnabled: true,
    askAIEnabled: false,
    rspack: false,
  });

  cachedBundleLocation = bundleLocation;
  return bundleLocation;
}


export function calculateTotalDuration(
  scenes: z.infer<typeof SceneScriptSchema>[],
): number {
  return scenes.reduce((sum, scene) => sum + scene.duration, 0);
}

export const RenderVideoInputSchema = z.object({
  script: z.object({
    title: z.string(),
    totalDuration: z.number().positive(),
    scenes: z.array(SceneScriptSchema),
  }),
  screenshotResources: z.record(z.string(), z.string()),
  outputDir: z.string().optional(),
  videoFileName: z.string().optional(),
  compositionId: z.string().default("Video"),
  onProgress: z.function().optional(),
});

export interface RenderVideoInput {
  script: ScriptOutput;
  screenshotResources: Record<string, string>;
  outputDir?: string;
  videoFileName?: string;
  compositionId?: string;
  onProgress?: (progress: number) => void;
}

export const RenderVideoOutputSchema = z.object({
  videoPath: z.string(),
  duration: z.number(),
  fps: z.number(),
  resolution: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
});

export interface RenderVideoOutput {
  videoPath: string;
  duration: number;
  fps: number;
  resolution: string;
  success: boolean;
  error?: string;
}

export async function renderVideo(
  input: RenderVideoInput,
): Promise<RenderVideoOutput> {
  try {
    RenderVideoInputSchema.omit({ onProgress: true }).parse(input);

    const {
      script,
      screenshotResources,
      outputDir,
      videoFileName = `${script.title.toLowerCase().replace(/\s+/g, "-")}.mp4`,
      onProgress,
      compositionId = "Video",
    } = input;

    const baseOutputDir = outputDir || join(homedir(), "simple-videos");
    // Ensure finalOutputDir is always absolute to avoid path resolution issues
    const finalOutputDir = outputDir
      ? (isAbsolute(outputDir) ? outputDir : resolve(process.cwd(), outputDir))
      : await generateOutputDirectory(baseOutputDir, script.title);

    // Create output directory if it doesn't exist
    if (!existsSync(finalOutputDir)) {
      mkdirSync(finalOutputDir, { recursive: true });
    }

    onProgress?.(10);

    // Use packages/renderer/src/remotion/ directly instead of generating a separate project
    // This ensures the full animation system (Ken Burns, parallax, KineticSubtitle) is used
    const videoOutputPath = join(finalOutputDir, videoFileName);

    // Use renderer package directory as cwd
    const rendererRoot = "/Volumes/SN350-1T/dev/video-script/packages/renderer";

    // Process screenshot resources: convert file paths to base64 data URIs
    const processedImages: Record<string, string> = {};
    if (screenshotResources) {
      const { readFileSync } = await import("fs");
      for (const [key, srcPath] of Object.entries(screenshotResources)) {
        if (existsSync(srcPath)) {
          try {
            const buffer = readFileSync(srcPath);
            const base64 = buffer.toString("base64");
            const filename = srcPath.split("/").pop() || `${key}.png`;
            const ext = filename.split(".").pop()?.toLowerCase() || "png";
            const mimeType =
              ext === "png"
                ? "image/png"
                : ext === "jpg" || ext === "jpeg"
                  ? "image/jpeg"
                  : "image/png";
            processedImages[key] = `data:${mimeType};base64,${base64}`;
          } catch {
            console.warn(`Failed to read screenshot: ${srcPath}`);
          }
        }
      }
    }

    // Pass script and images via Remotion props system
    const remotionProps = {
      script,
      images: processedImages,
    };

    onProgress?.(30);

    // Step 1: Bundle the Remotion project using programmatic API
    // This avoids CLI spawn issues with pnpm monorepo and path-with-spaces
    const remotionEntryPoint = join(rendererRoot, "src/remotion/index.ts");
    const bundleLocation = await getBundleLocation(remotionEntryPoint);

    onProgress?.(40);

    // Step 2: Select the composition to render
    const composition: VideoConfig = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps: remotionProps,
    });

    onProgress?.(50);

    // Step 3: Render the video using programmatic API
    await renderMedia({
      serveUrl: bundleLocation,
      composition,
      inputProps: remotionProps,
      outputLocation: videoOutputPath,
      codec: "h264",
      crf: 20,
      onProgress: (progress) => {
        // Map render progress (0-1) to our overall progress (50-90)
        const overallProgress = 50 + progress.progress * 40;
        onProgress?.(overallProgress);
      },
    });

    onProgress?.(90);

    // Verify output file exists
    if (!existsSync(videoOutputPath)) {
      return {
        videoPath: "",
        duration: 0,
        fps: 30,
        resolution: "1920x1080",
        success: false,
        error: "Video file was not created",
      };
    }

    onProgress?.(100);

    return {
      videoPath: videoOutputPath,
      duration: calculateTotalDuration(script.scenes),
      fps: 30,
      resolution: "1920x1080",
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      videoPath: "",
      duration: 0,
      fps: 30,
      resolution: "1920x1080",
      success: false,
      error: `Video rendering error: ${errorMessage}`,
    };
  }
}
