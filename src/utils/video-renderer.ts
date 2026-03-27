/**
 * Root-level video rendering orchestrator.
 *
 * Delegates all rendering to @video-script/renderer which uses:
 * - Remotion's Node.js API (@remotion/bundler + @remotion/renderer)
 * - Chrome headless for frame rendering
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
  return rendererCalculateTotalDuration(
    scenes as Parameters<typeof rendererCalculateTotalDuration>[0],
  );
}

/**
 * Input schema for video rendering - matches renderer's RenderVideoInputSchema
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
  images: z.record(z.string(), z.string()).optional(),
  outputDir: z.string().min(1),
  showSubtitles: z.boolean().optional(),
  onProgress: z.function().optional(),
});

/**
 * Input interface for video rendering
 */
export interface RenderVideoInput {
  script: ScriptOutput;
  images?: Record<string, string>;
  outputDir: string;
  showSubtitles?: boolean;
  onProgress?: (progress: number) => void;
}

/**
 * Output schema for video rendering
 */
export const RenderVideoOutputSchema = z.object({
  videoPath: z.string(),
  duration: z.number(),
  fps: z.number(),
  resolution: z.object({
    width: z.number(),
    height: z.number(),
  }),
  success: z.boolean(),
  framesRendered: z.number(),
  error: z.string().optional(),
});

/**
 * Output interface for video rendering
 */
export interface RenderVideoOutput {
  videoPath: string;
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
  success: boolean;
  framesRendered: number;
  error?: string;
}

/**
 * Orchestrates the complete video rendering process by delegating
 * to @video-script/renderer's Remotion-based renderer.
 */
export async function renderVideo(
  input: RenderVideoInput,
): Promise<RenderVideoOutput> {
  const args: Parameters<typeof rendererRenderVideo>[0] = {
    script: input.script as Parameters<typeof rendererRenderVideo>[0]["script"],
    outputDir: input.outputDir,
  };

  if (input.images !== undefined) args.images = input.images;
  if (input.showSubtitles !== undefined)
    args.showSubtitles = input.showSubtitles;
  if (input.onProgress !== undefined) args.onProgress = input.onProgress;

  // Delegate to @video-script/renderer which uses Remotion Node.js API
  return rendererRenderVideo(args);
}
