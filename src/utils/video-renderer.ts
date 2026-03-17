import { extname, join } from "path";
import { z } from "zod";
import { ScriptOutput, SceneScript } from "../types/script";
import {
  generateRemotionProject,
  type GenerateProjectInput,
} from "./remotion-project-generator";
import { cleanupRemotionTempDir } from "./cleanup";

/**
 * Calculate total duration from scenes
 * Default: 10 seconds per scene
 */
export function calculateTotalDuration(scenes: SceneScript[]): number {
  return scenes.length * 10;
}

/**
 * Input schema for video rendering - matches new ScriptOutputSchema format
 */
export const RenderVideoInputSchema = z.object({
  script: z.object({
    title: z.string(),
    scenes: z.array(
      z.object({
        order: z.number().int().positive(),
        segmentOrder: z.number().int().positive(),
        type: z.enum(["url", "text"]),
        content: z.string(),
        screenshot: z
          .object({
            background: z.string().default("#1E1E1E"),
            maxLines: z.number().int().positive().optional(),
            width: z.number().int().positive().default(1920),
            fontSize: z.number().int().positive().default(14),
            fontFamily: z.string().default("Fira Code"),
            padding: z.number().int().optional(),
            theme: z.string().optional(),
          })
          .optional(),
        effects: z.array(z.any()).optional(),
      }),
    ),
    transitions: z.array(z.any()).optional(),
  }),
  screenshotResources: z.record(z.string(), z.string()),
  outputDir: z.string().min(1),
  videoFileName: z.string().optional(),
  onProgress: z.function().optional(),
});

/**
 * Input interface for video rendering
 */
export interface RenderVideoInput {
  script: ScriptOutput;
  screenshotResources: Record<string, string>;
  outputDir: string;
  videoFileName?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Output schema for video rendering
 */
export const RenderVideoOutputSchema = z.object({
  videoPath: z.string(),
  duration: z.number(),
  fps: z.number(),
  resolution: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
});

/**
 * Output interface for video rendering
 */
export interface RenderVideoOutput {
  videoPath: string;
  duration: number;
  fps: number;
  resolution: string;
  success: boolean;
  error?: string;
}

/**
 * Orchestrates the complete video rendering process
 *
 * @param input - Rendering input including script, resources, and output path
 * @returns Rendering result with video path and metadata
 */
export async function renderVideo(
  input: RenderVideoInput,
): Promise<RenderVideoOutput> {
  try {
    // Validate input
    RenderVideoInputSchema.omit({ onProgress: true }).parse(input);

    const {
      script,
      screenshotResources,
      outputDir,
      videoFileName = `${script.title.toLowerCase().replace(/\s+/g, "-")}.mp4`,
      onProgress,
    } = input;

    // Step 1: Generate Remotion project
    onProgress?.(10);

    const projectInput: GenerateProjectInput = {
      script,
      screenshotResources,
      outputPath: join(outputDir, ".remotion-project"),
    };

    const projectResult = await generateRemotionProject(projectInput);

    if (!projectResult.success) {
      return {
        videoPath: "",
        duration: 0,
        fps: 30,
        resolution: "1920x1080",
        success: false,
        error: projectResult.error || "Failed to generate Remotion project",
      };
    }

    onProgress?.(30);

    // Step 2: Prepare video output path
    const videoOutputPath = join(outputDir, videoFileName);

    // Step 3: Execute remotion-render tool
    onProgress?.(50);

    const { spawn } = await import("child_process");
    const { existsSync, mkdirSync } = await import("fs");
    const { dirname } = await import("path");

    const renderResult = await new Promise<{
      videoPath: string;
      duration: number;
      success: boolean;
      error?: string;
    }>((resolve) => {
      try {
        if (!existsSync(projectResult.projectPath)) {
          return resolve({
            videoPath: "",
            duration: 0,
            success: false,
            error: `Project path not found: ${projectResult.projectPath}`,
          });
        }

        const outputDirPath = dirname(videoOutputPath);
        if (!existsSync(outputDirPath)) {
          mkdirSync(outputDirPath, { recursive: true });
        }

        const format =
          extname(videoFileName).toLowerCase() === ".webm" ? "webm" : "mp4";
        const args = [
          "remotion",
          "render",
          projectResult.mainComponentPath,
          videoOutputPath,
          "--codec",
          "h264",
          "--fps",
          projectResult.videoConfig.fps.toString(),
        ];

        if (format === "webm") {
          args.push("--webm");
        }

        const renderProcess = spawn("npx", args, {
          stdio: ["pipe", "pipe", "pipe"],
          cwd: process.cwd(),
        });

        let stdout = "";
        let stderr = "";

        renderProcess.stdout?.on("data", (data: Buffer) => {
          stdout += data.toString();
        });

        renderProcess.stderr?.on("data", (data: Buffer) => {
          stderr += data.toString();
        });

        renderProcess.on("close", (code: number) => {
          if (code === 0 && existsSync(videoOutputPath)) {
            return resolve({
              videoPath: videoOutputPath,
              duration: calculateTotalDuration(script.scenes),
              success: true,
            });
          }

          return resolve({
            videoPath: "",
            duration: 0,
            success: false,
            error: `Rendering failed (Exit code: ${code}): ${stderr || stdout}`,
          });
        });

        renderProcess.on("error", (error: Error) => {
          return resolve({
            videoPath: "",
            duration: 0,
            success: false,
            error: `Process error: ${error.message}`,
          });
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        return resolve({
          videoPath: "",
          duration: 0,
          success: false,
          error: `Render exception: ${errorMessage}`,
        });
      }
    });

    onProgress?.(80);

    if (!renderResult.success) {
      return {
        videoPath: "",
        duration: 0,
        fps: projectResult.videoConfig.fps,
        resolution: projectResult.videoConfig.resolution,
        success: false,
        error: renderResult.error || "Video rendering failed",
      };
    }

    // Step 4: Clean up temporary project files (optional)
    onProgress?.(90);

    try {
      await cleanupRemotionTempDir(projectResult.projectPath, {
        preservePatterns: ["*.mp4", "*.srt", "*.json"],
      });
    } catch (cleanupError) {
      console.warn("Failed to clean up temporary project files:", cleanupError);
    }

    onProgress?.(100);

    // Return success result
    const result: RenderVideoOutput = {
      videoPath: renderResult.videoPath,
      duration: calculateTotalDuration(script.scenes),
      fps: projectResult.videoConfig.fps,
      resolution: projectResult.videoConfig.resolution,
      success: true,
    };

    return result;
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
