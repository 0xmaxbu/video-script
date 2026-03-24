import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { z } from "zod";
import { ScriptOutput, SceneScriptSchema } from "./types.js";
import { generateOutputDirectory } from "./output-directory.js";

// ESM-compatible way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    const finalOutputDir = outputDir
      ? outputDir
      : await generateOutputDirectory(baseOutputDir, script.title);

    // Create output directory if it doesn't exist
    if (!existsSync(finalOutputDir)) {
      mkdirSync(finalOutputDir, { recursive: true });
    }

    onProgress?.(10);

    // Use packages/renderer/src/remotion/ directly instead of generating a separate project
    // This ensures the full animation system (Ken Burns, parallax, KineticSubtitle) is used
    const videoOutputPath = join(finalOutputDir, videoFileName);

    // Resolve the path to packages/renderer/src - this is where the Remotion project lives
    // The remotion/index.ts registers RemotionRoot with VideoComposition
    // __dirname is packages/renderer/src (or dist), so ../src gives us packages/renderer/src
    const rendererSrcPath = join(__dirname, "..", "src");

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

    // Run npx remotion render using packages/renderer/src/remotion/ directly
    // The --props flag passes data through Remotion's props system (calculateMetadata/defaultProps)
    await new Promise<void>((resolve, reject) => {
      const propsJson = JSON.stringify(remotionProps);
      const args = [
        "remotion",
        "render",
        "remotion/index.ts",
        compositionId,
        videoOutputPath,
        "--codec",
        "h264",
        "--fps",
        "30",
        "--crf",
        "20",
        "--quiet",
        "--props",
        propsJson,
      ];

      const child = spawn("npx", args, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: rendererSrcPath,
      });

      let stderr = "";

      child.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("close", (code: number | null) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npx remotion failed (exit ${code}): ${stderr}`));
        }
      });

      child.on("error", (err) => {
        reject(err);
      });
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
