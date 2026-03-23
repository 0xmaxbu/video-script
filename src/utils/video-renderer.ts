import { join, resolve } from "path";
import { homedir } from "os";
import { spawn } from "child_process";
import { z } from "zod";
import { ScriptOutput, SceneScript } from "../types/script.js";
import { generateOutputDirectory } from "./output-directory.js";

export function calculateTotalDuration(scenes: SceneScript[]): number {
  return scenes.reduce((sum, s) => sum + s.duration, 0);
}

export const RenderVideoInputSchema = z.object({
  script: z.object({
    title: z.string(),
    totalDuration: z.number().positive().optional(),
    scenes: z.array(
      z.object({
        id: z.string(),
        type: z.enum(["intro", "feature", "code", "outro"]),
        title: z.string(),
        narration: z.string(),
        duration: z.number().positive(),
        visualLayers: z.array(z.any()).optional(),
      }),
    ),
  }),
  screenshotResources: z.record(z.string(), z.string()),
  outputDir: z.string().min(1),
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

async function spawnRenderProcess(
  videoOutputPath: string,
  fps: number,
  props: { script: ScriptOutput; images?: Record<string, string> },
  compositionId: string = "Video",
): Promise<{
  videoPath: string;
  duration: number;
  success: boolean;
  error?: string;
}> {
  const { existsSync } = await import("fs");
  const { writeFile, unlink } = await import("fs/promises");
  const { randomBytes } = await import("crypto");
  const { tmpdir } = await import("os");

  const propsFile = join(
    tmpdir(),
    `remotion-props-${randomBytes(8).toString("hex")}.json`,
  );
  await writeFile(propsFile, JSON.stringify(props), "utf-8");

  const remotionCli = join(
    process.cwd(),
    "packages/renderer",
    "node_modules",
    "@remotion",
    "cli",
    "remotion-cli.js",
  );

  const entryPoint = join(
    process.cwd(),
    "packages/renderer",
    "src/remotion/Root.tsx",
  );

  const args = [
    remotionCli,
    "render",
    entryPoint,
    compositionId,
    videoOutputPath,
    "--props",
    propsFile,
    "--codec",
    "h264",
    "--fps",
    fps.toString(),
    "--crf",
    "20",
    "--quiet",
  ];

  const renderProcess = spawn(process.execPath, args, {
    stdio: ["pipe", "pipe", "pipe"],
    cwd: join(process.cwd(), "packages/renderer"),
  });

  let stderrParts: string[] = [];

  renderProcess.stderr?.on("data", (data: Buffer) => {
    stderrParts.push(data.toString());
  });

  const cleanupPropsFile = async () => {
    try {
      await unlink(propsFile);
    } catch {
      // Ignore cleanup errors
    }
  };

  return new Promise((resolve) => {
    renderProcess.on("close", async (code: number) => {
      await cleanupPropsFile();

      if (code === 0 && existsSync(videoOutputPath)) {
        return resolve({
          videoPath: videoOutputPath,
          duration: calculateTotalDuration(props.script.scenes),
          success: true,
        });
      }

      return resolve({
        videoPath: "",
        duration: 0,
        success: false,
        error: `Rendering failed (Exit code: ${code}): ${stderrParts.join("")}`,
      });
    });

    renderProcess.on("error", async (error: Error) => {
      await cleanupPropsFile();
      return resolve({
        videoPath: "",
        duration: 0,
        success: false,
        error: `Process error: ${error.message}`,
      });
    });
  });
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
    const finalOutputDir = outputDir
      ? outputDir
      : await generateOutputDirectory(baseOutputDir, script.title);

    onProgress?.(10);

    const videoOutputPath = resolve(join(finalOutputDir, videoFileName));
    const { existsSync, mkdirSync } = await import("fs");
    const { dirname } = await import("path");

    const outputDirPath = dirname(videoOutputPath);
    if (!existsSync(outputDirPath)) {
      mkdirSync(outputDirPath, { recursive: true });
    }

    onProgress?.(40);

    const renderResult = await spawnRenderProcess(
      videoOutputPath,
      30,
      { script, images: screenshotResources },
      "Video",
    );

    onProgress?.(80);

    if (!renderResult.success) {
      return {
        videoPath: "",
        duration: 0,
        fps: 30,
        resolution: "1920x1080",
        success: false,
        error: renderResult.error || "Video rendering failed",
      };
    }

    onProgress?.(90);

    onProgress?.(100);

    const result: RenderVideoOutput = {
      videoPath: renderResult.videoPath,
      duration: calculateTotalDuration(script.scenes),
      fps: 30,
      resolution: "1920x1080",
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
