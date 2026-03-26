import { z } from "zod";
import { ScriptOutput, SceneScriptSchema } from "./types.js";
import { renderVideoWithPuppeteer } from "./puppeteer-renderer.js";
import type { PuppeteerRenderInput, PuppeteerRenderOutput } from "./puppeteer-renderer.js";


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

/**
 * Render video using Playwright-based frame renderer + FFmpeg.
 *
 * This delegates to `renderVideoWithPuppeteer()` which:
 * 1. Generates a Remotion React project from the script
 * 2. Bundles it with esbuild (bypasses the broken @remotion/bundler webpack)
 * 3. Serves the bundle via local HTTP server
 * 4. Renders each frame with Playwright/Chrome headless via CDP
 * 5. Stitches frames into MP4 with FFmpeg
 *
 * Requires: ffmpeg installed on the system.
 */
export async function renderVideo(
  input: RenderVideoInput,
): Promise<RenderVideoOutput> {
  const puppeteerInput: PuppeteerRenderInput = {
    script: input.script,
    screenshotResources: input.screenshotResources,
    outputDir: input.outputDir || "",
  };
  if (input.videoFileName !== undefined) {
    puppeteerInput.videoFileName = input.videoFileName;
  }
  if (input.compositionId !== undefined) {
    puppeteerInput.compositionId = input.compositionId;
  }
  if (input.onProgress) {
    puppeteerInput.onProgress = (pct: number) => input.onProgress!(pct);
  }

  const result: PuppeteerRenderOutput = await renderVideoWithPuppeteer(
    puppeteerInput,
  );

  // Map PuppeteerRenderOutput → RenderVideoOutput (drop framesRendered)
  const output: RenderVideoOutput = {
    videoPath: result.videoPath,
    duration: result.duration,
    fps: result.fps,
    resolution: result.resolution,
    success: result.success,
  };
  if (result.error !== undefined) {
    output.error = result.error;
  }
  return output;
}
