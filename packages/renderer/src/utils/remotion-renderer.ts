import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import type { Configuration as WebpackConfig } from "webpack";
import type { ScriptOutput } from "../types.js";
import { generateProject } from "./project-generator.js";

export interface NodeRenderInput {
  script: ScriptOutput;
  outputDir: string;
  images?: Record<string, string>;
  showSubtitles?: boolean;
  onProgress?: (progress: number) => void;
}

export interface NodeRenderOutput {
  videoPath: string;
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
  framesRendered: number;
  success: boolean;
}

/**
 * Renders a video using Remotion's official Node.js API.
 *
 * Replaces the previous esbuild + Puppeteer frame-by-frame approach.
 * The generated project is kept permanently at outputDir so the user
 * can run `npx remotion studio` to preview or tweak the video.
 */
export async function renderWithNodeRenderer(
  input: NodeRenderInput,
): Promise<NodeRenderOutput> {
  const {
    script,
    outputDir,
    images = {},
    showSubtitles = false,
    onProgress,
  } = input;

  const fps = 30;
  const resolution = { width: 1920, height: 1080 };
  const videoPath = path.join(outputDir, "out", "video.mp4");

  // Step 1: Generate per-video Remotion project
  const project = await generateProject({
    script,
    outputDir,
    images,
    showSubtitles,
  });

  // Step 2: Bundle with webpack override to fix @remotion/studio alias bug
  const bundleLocation = await bundle({
    entryPoint: project.entryPoint,
    webpackOverride: removeStudioAlias,
    onProgress: (progress) => onProgress?.(progress * 30), // 0–30% for bundling
  });

  // Step 3: Select composition
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: project.compositionId,
    inputProps: {},
  });

  // Step 4: Render media
  const totalFrames = composition.durationInFrames;
  let framesRendered = 0;

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: videoPath,
    onProgress: ({ renderedFrames }) => {
      framesRendered = renderedFrames;
      onProgress?.(30 + (renderedFrames / totalFrames) * 70); // 30–100%
    },
  });

  return {
    videoPath,
    duration: script.totalDuration,
    fps,
    resolution,
    framesRendered,
    success: true,
  };
}

/**
 * Removes the @remotion/studio webpack alias to fix subpath import bug.
 *
 * @remotion/bundler aliases @remotion/studio → dist/index.js, which breaks
 * the @remotion/studio/renderEntry subpath import used internally by Remotion.
 * Deleting the alias lets Node's module resolution find the correct subpath export.
 */
function removeStudioAlias(config: WebpackConfig): WebpackConfig {
  const alias = config.resolve?.alias as Record<string, string> | undefined;
  if (alias?.["@remotion/studio"]) {
    delete alias["@remotion/studio"];
  }
  return config;
}
