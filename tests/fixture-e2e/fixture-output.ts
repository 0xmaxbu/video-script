/**
 * fixture-output.ts
 *
 * Runs the fixture pipeline for TEST-01 compose-structure assertions.
 *
 * Pipeline:
 *   sample-script.json
 *     → adaptScriptForRenderer()   (pure, no I/O)
 *     → augmentScreenshotLayers()  (reads real images via sharp; layers without
 *                                   real files are left untouched)
 *     → generateProject()          (scaffolds renderer project, skips npm install)
 *
 * This helper is the single source of truth for TEST-01 input and output.
 * No test-specific Root.tsx, MockComposition, or simplified renderer path
 * may be introduced here or in compose-structure.test.ts.
 *
 * Usage:
 *   const { adaptedScript, images, projectOutput } = await runFixturePipeline(outputDir);
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { adaptScriptForRenderer } from "../../src/utils/scene-adapter.js";
import { augmentScreenshotLayers } from "../../src/utils/augment-screenshot-layers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = join(
  __dirname,
  "../../src/mastra/agents/__tests__/fixtures",
);

export interface FixturePipelineResult {
  /** Raw parsed script fixture */
  rawScript: ReturnType<typeof JSON.parse>;
  /** After adaptScriptForRenderer — merges visual.json */
  adaptedScript: ReturnType<typeof adaptScriptForRenderer>;
  /** Images map passed to augmentScreenshotLayers (empty — no real captures in fixture) */
  images: Record<string, string>;
  /** After augmentScreenshotLayers — layers may have kenBurnsWaypoints if real images provided */
  augmentedScenes: Awaited<ReturnType<typeof augmentScreenshotLayers>>;
}

/**
 * Run the fixture pipeline without npm install.
 * Returns intermediate and final results for assertions.
 */
export async function runFixturePipeline(): Promise<FixturePipelineResult> {
  const rawScript = JSON.parse(
    readFileSync(join(FIXTURE_DIR, "sample-script.json"), "utf-8"),
  ) as ReturnType<typeof JSON.parse>;

  const rawVisual = JSON.parse(
    readFileSync(join(FIXTURE_DIR, "sample-visual.json"), "utf-8"),
  ) as ReturnType<typeof JSON.parse>;

  // Step 1: Adapt script for renderer (pure transformation, no I/O)
  const adaptedScript = adaptScriptForRenderer(rawScript, rawVisual);

  // Step 2: Build images map — for fixture tests this is always empty
  // (no real screenshots; augmentation will silently leave layers untouched)
  const images: Record<string, string> = {};

  // Step 3: Augment screenshot layers (sharp-based; no-op when images map is empty)
  const augmentedScenes = await augmentScreenshotLayers(
    adaptedScript.scenes,
    images,
    30,
  );

  return {
    rawScript,
    adaptedScript,
    images,
    augmentedScenes,
  };
}
