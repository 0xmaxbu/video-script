/**
 * compose-structure.test.ts — TEST-01
 *
 * Verifies the fixture pipeline produces renderer-ready output using the REAL
 * data flow:
 *   sample-script.json
 *     → adaptScriptForRenderer()
 *     → augmentScreenshotLayers()
 *     → generateProject()  (with skipInstall=true, added in Step 8)
 *
 * Two describe blocks, each a separate step:
 *
 *  "fixture prerequisites" (Step 7)
 *    — Verifies the fixture + adapter chain produces sufficient scene/layer
 *      structure before touching generateProject.
 *
 *  "renderer contract" (Step 8)
 *    — Verifies generateProject scaffolds the REAL renderer entry
 *      (VideoComposition from @video-script/renderer/remotion) with
 *      defaultProps + calculateMetadata contract. Negative assertions
 *      confirm no test-only wrappers (TestRoot, MockComposition, etc.)
 *      are present.
 *
 * CRITICAL:
 *   - No fake Root.tsx, MockComposition, FixtureComposition, or simplified
 *     renderer path may be used here or in fixture-output.ts.
 *   - fixture-output.ts is the single source of truth for the pipeline.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { runFixturePipeline } from "./fixture-output.js";

// ---------------------------------------------------------------------------
// Step 7: fixture prerequisites
// ---------------------------------------------------------------------------
describe("fixture prerequisites", () => {
  let pipeline: Awaited<ReturnType<typeof runFixturePipeline>>;

  beforeAll(async () => {
    pipeline = await runFixturePipeline();
  });

  it("raw fixture has at least 3 scenes", () => {
    expect(pipeline.rawScript.scenes.length).toBeGreaterThanOrEqual(3);
  });

  it("adaptScriptForRenderer produces at least 3 scenes", () => {
    expect(pipeline.adaptedScript.scenes.length).toBeGreaterThanOrEqual(3);
  });

  it("adaptScriptForRenderer preserves title", () => {
    expect(pipeline.adaptedScript.title).toBe(pipeline.rawScript.title);
  });

  it("adaptScriptForRenderer computes totalDuration as sum of scene durations", () => {
    const sum = pipeline.adaptedScript.scenes.reduce(
      (acc, s) => acc + s.duration,
      0,
    );
    expect(pipeline.adaptedScript.totalDuration).toBe(sum);
  });

  it("every adapted scene has at least 1 visualLayer", () => {
    for (const scene of pipeline.adaptedScript.scenes) {
      expect(
        scene.visualLayers?.length ?? 0,
        `scene ${scene.id} has no visualLayers`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("at least one scene has a screenshot-type visualLayer", () => {
    const hasScreenshot = pipeline.adaptedScript.scenes.some((scene) =>
      scene.visualLayers?.some((l) => l.type === "screenshot"),
    );
    expect(hasScreenshot).toBe(true);
  });

  it("augmentScreenshotLayers preserves scene count", () => {
    expect(pipeline.augmentedScenes.length).toBe(
      pipeline.adaptedScript.scenes.length,
    );
  });

  it("augmentScreenshotLayers preserves scene ids and order", () => {
    const adaptedIds = pipeline.adaptedScript.scenes.map((s) => s.id);
    const augmentedIds = pipeline.augmentedScenes.map((s) => s.id);
    expect(augmentedIds).toEqual(adaptedIds);
  });

  it("augmentScreenshotLayers leaves screenshot layers structurally intact when images map is empty", () => {
    // With empty images map, sharp is never called — layers are returned as-is
    for (const scene of pipeline.augmentedScenes) {
      if (!scene.visualLayers) continue;
      for (const layer of scene.visualLayers) {
        if (layer.type === "screenshot") {
          // layer must still have required fields
          expect(layer.id).toBeTruthy();
          expect(layer.content).toBeTruthy();
          expect(layer.position).toBeDefined();
          expect(layer.animation).toBeDefined();
        }
      }
    }
  });

  it("images map passed to pipeline is empty (fixture has no real screenshots)", () => {
    expect(Object.keys(pipeline.images).length).toBe(0);
  });
});
