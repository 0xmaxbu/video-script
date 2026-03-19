import { join } from "path";
import { homedir } from "os";
import { spawn } from "child_process";
import { z } from "zod";
import { ScriptOutput, SceneScriptSchema } from "./types.js";
import {
  generateRemotionProject,
  type GenerateProjectInput,
} from "./remotion-project-generator.js";
import { generateOutputDirectory } from "./output-directory.js";

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
  onProgress: z.function().optional(),
});

export interface RenderVideoInput {
  script: ScriptOutput;
  screenshotResources: Record<string, string>;
  outputDir?: string;
  videoFileName?: string;
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
    } = input;

    const baseOutputDir = outputDir || join(homedir(), "simple-videos");
    const finalOutputDir = await generateOutputDirectory(
      baseOutputDir,
      script.title,
    );

    onProgress?.(10);

    const projectInput: GenerateProjectInput = {
      script,
      screenshotResources,
      outputPath: join(finalOutputDir, ".remotion-project"),
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

    const videoOutputPath = join(finalOutputDir, videoFileName);
    const { existsSync, mkdirSync } = await import("fs");
    const { dirname } = await import("path");

    const outputDirPath = dirname(videoOutputPath);
    if (!existsSync(outputDirPath)) {
      mkdirSync(outputDirPath, { recursive: true });
    }

    onProgress?.(40);

    const renderResult = await new Promise<{
      videoPath: string;
      duration: number;
      success: boolean;
      error?: string;
    }>((resolve) => {
      if (!existsSync(projectResult.projectPath)) {
        return resolve({
          videoPath: "",
          duration: 0,
          success: false,
          error: `Project path not found: ${projectResult.projectPath}`,
        });
      }

      const remotionScript = join(
        projectResult.projectPath,
        "node_modules",
        "@remotion",
        "cli",
        "remotion-cli.js",
      );

      const args = [
        remotionScript,
        "render",
        "src/index.tsx",
        "Video",
        videoOutputPath,
        "--codec",
        "h264",
        "--fps",
        projectResult.videoConfig.fps.toString(),
        "--quiet",
      ];

      const renderProcess = spawn(process.execPath, args, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: projectResult.projectPath,
      });

      let stderr = "";

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
          error: `Rendering failed (Exit code: ${code}): ${stderr}`,
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

    onProgress?.(90);

    onProgress?.(100);

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
