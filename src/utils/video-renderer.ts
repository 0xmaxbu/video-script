/**
 * Root-level video rendering orchestrator.
 *
 * Delegates all rendering to @video-script/renderer which uses:
 * - esbuild for bundling (bypasses broken Remotion webpack bundler)
 * - Playwright/Chrome headless for frame rendering via CDP
 * - FFmpeg for stitching frames into MP4
 *
 * Requires: ffmpeg installed on the system.
 */
import { z } from "zod/v4";
import { ScriptOutput, SceneScript } from "../types/script.js";
import {
  renderVideo as rendererRenderVideo,
  calculateTotalDuration as rendererCalculateTotalDuration,
} from "@video-script/renderer";

export function calculateTotalDuration(scenes: SceneScript[]): number {
  return rendererCalculateTotalDuration(scenes as Parameters<typeof rendererCalculateTotalDuration>[0]);
}

/**
 * Input schema for video rendering - matches new ScriptOutputSchema format
 */
export const RenderVideoInputSchema = z.object({
  script: z.object({
    title: z.string(),
    totalDuration: z.number().check(z.positive()).optional(),
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
 * Orchestrates the complete video rendering process by delegating
 * to @video-script/renderer's Playwright-based renderer.
 */
export async function renderVideo(
  input: RenderVideoInput,
): Promise<RenderVideoOutput> {
  const args: Parameters<typeof rendererRenderVideo>[0] = {
    script: input.script as Parameters<typeof rendererRenderVideo>[0]["script"],
    screenshotResources: input.screenshotResources,
    outputDir: input.outputDir,
  };
  
  if (input.videoFileName !== undefined) args.videoFileName = input.videoFileName;
  if (input.onProgress !== undefined) args.onProgress = input.onProgress;
  
  // Delegate to @video-script/renderer which uses Playwright + FFmpeg
  return rendererRenderVideo(args);
}
