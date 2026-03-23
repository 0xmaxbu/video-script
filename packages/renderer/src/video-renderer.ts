import { join, resolve } from "path";
import { homedir } from "os";
import { spawn } from "child_process";
import { z } from "zod";
import { ScriptOutput, SceneScriptSchema } from "./types.js";
import { generateOutputDirectory } from "./output-directory.js";

interface RenderResult {
  videoPath: string;
  duration: number;
  success: boolean;
  error?: string;
}

async function spawnRenderProcess(
  videoOutputPath: string,
  fps: number,
  props: { script: ScriptOutput; images?: Record<string, string> },
  compositionId: string = "Video",
): Promise<RenderResult> {
  const { existsSync } = await import("fs");
  const { writeFile, unlink } = await import("fs/promises");
  const { randomBytes } = await import("crypto");
  const { tmpdir } = await import("os");

  // Write props to temp JSON file
  const propsFile = join(
    tmpdir(),
    `remotion-props-${randomBytes(8).toString("hex")}.json`,
  );
  await writeFile(propsFile, JSON.stringify(props), "utf-8");

  // Remotion CLI path from packages/renderer directory
  const remotionCli = join(
    process.cwd(),
    "node_modules",
    "@remotion",
    "cli",
    "remotion-cli.js",
  );

  const args = [
    remotionCli,
    "render",
    "src/remotion/Root.tsx", // Entry point is packages/renderer
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

  // Run from packages/renderer directory (cwd = process.cwd())
  const renderProcess = spawn(process.execPath, args, {
    stdio: ["pipe", "pipe", "pipe"],
    cwd: process.cwd(),
  });

  let stderrParts: string[] = [];

  renderProcess.stderr?.on("data", (data: Buffer) => {
    stderrParts.push(data.toString());
  });

  // Helper to clean up temp props file
  const cleanupPropsFile = async () => {
    try {
      await unlink(propsFile);
    } catch {
      // Ignore cleanup errors
    }
  };

  return new Promise((resolve) => {
    renderProcess.on("close", async (code: number) => {
      // Clean up temp props file
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
    } = input;

    const baseOutputDir = outputDir || join(homedir(), "simple-videos");
    const finalOutputDir = outputDir
      ? outputDir
      : await generateOutputDirectory(baseOutputDir, script.title);

    onProgress?.(10);

    // Create output directory
    const videoOutputPath = resolve(join(finalOutputDir, videoFileName));
    const { existsSync, mkdirSync } = await import("fs");
    const { dirname } = await import("path");

    const outputDirPath = dirname(videoOutputPath);
    if (!existsSync(outputDirPath)) {
      mkdirSync(outputDirPath, { recursive: true });
    }

    onProgress?.(40);

    // Pass script and images directly to spawnRenderProcess (no project generation)
    const renderResult = await spawnRenderProcess(
      videoOutputPath,
      30, // fps - hardcoded since no project generation
      { script, images: screenshotResources }, // props object
      input.compositionId ?? "Video",
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
      fps: 30, // hardcoded since no project generation
      resolution: "1920x1080", // hardcoded since no project generation
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
