import { z } from "zod";
import { ScriptOutput, SceneScriptSchema } from "./types.js";
import { renderWithNodeRenderer } from "./utils/remotion-renderer.js";

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
  outputDir: z.string(),
  images: z.record(z.string(), z.string()).optional(),
  showSubtitles: z.boolean().default(false),
  onProgress: z.function().optional(),
});

export interface RenderVideoInput {
  script: ScriptOutput;
  outputDir: string;
  images?: Record<string, string>;
  showSubtitles?: boolean;
  onProgress?: (progress: number) => void;
}

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
 * Render video using Remotion's official Node.js API.
 *
 * This delegates to `renderWithNodeRenderer()` which:
 * 1. Generates a permanent per-video Remotion project at outputDir
 * 2. Bundles it via @remotion/bundler (webpack-based)
 * 3. Selects the composition via @remotion/renderer
 * 4. Renders to MP4 via @remotion/renderer renderMedia()
 *
 * The generated project remains at outputDir for Remotion Studio preview.
 */
export async function renderVideo(
  input: RenderVideoInput,
): Promise<RenderVideoOutput> {
  const renderInput = {
    script: input.script,
    outputDir: input.outputDir,
    ...(input.images !== undefined && { images: input.images }),
    ...(input.showSubtitles !== undefined && {
      showSubtitles: input.showSubtitles,
    }),
    ...(input.onProgress !== undefined && { onProgress: input.onProgress }),
  };
  const result = await renderWithNodeRenderer(renderInput);

  return {
    videoPath: result.videoPath,
    duration: result.duration,
    fps: result.fps,
    resolution: result.resolution,
    success: result.success,
    framesRendered: result.framesRendered,
  };
}
