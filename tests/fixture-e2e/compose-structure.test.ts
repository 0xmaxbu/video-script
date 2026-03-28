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

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
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

// ---------------------------------------------------------------------------
// Step 8: renderer contract
// ---------------------------------------------------------------------------
describe("renderer contract", () => {
  let pipeline: Awaited<ReturnType<typeof runFixturePipeline>>;
  let projectDir: string;

  beforeAll(async () => {
    pipeline = await runFixturePipeline();

    // Use a temp dir — generateProject writes scaffold files here
    projectDir = mkdtempSync(join(tmpdir(), "fixture-e2e-"));

    // Dynamic import to avoid circular resolution issues at module load time
    const { generateProject } =
      await import("../../packages/renderer/src/utils/project-generator.js");

    // Cast to renderer ScriptOutput — the structures are compatible at runtime;
    // the only TS-level mismatch is layoutTemplate (string vs union literal),
    // which is safe because generateProject only embeds it as JSON.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await generateProject({
      script: pipeline.adaptedScript as any,
      outputDir: projectDir,
      images: pipeline.images,
      skipInstall: true, // skip npm install for speed; does NOT change renderer path
    });
  });

  afterAll(() => {
    try {
      rmSync(projectDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors in CI
    }
  });

  // --- Positive: real renderer entry ---

  it("generated Root.tsx imports VideoComposition from @video-script/renderer/remotion", () => {
    const root = readFileSync(join(projectDir, "src", "Root.tsx"), "utf-8");
    expect(root).toContain(
      "import { VideoComposition } from '@video-script/renderer/remotion'",
    );
  });

  it("generated Root.tsx imports VideoCompositionProps type from @video-script/renderer/remotion", () => {
    const root = readFileSync(join(projectDir, "src", "Root.tsx"), "utf-8");
    expect(root).toContain("VideoCompositionProps");
  });

  it("generated Root.tsx declares defaultProps typed as VideoCompositionProps", () => {
    const root = readFileSync(join(projectDir, "src", "Root.tsx"), "utf-8");
    expect(root).toContain("const defaultProps: VideoCompositionProps");
  });

  it("generated Root.tsx passes defaultProps to <Composition>", () => {
    const root = readFileSync(join(projectDir, "src", "Root.tsx"), "utf-8");
    expect(root).toContain("defaultProps={defaultProps}");
  });

  it("generated Root.tsx passes component={VideoComposition} to <Composition>", () => {
    const root = readFileSync(join(projectDir, "src", "Root.tsx"), "utf-8");
    expect(root).toContain("component={VideoComposition}");
  });

  it("generated src/index.ts registers RemotionRoot via registerRoot", () => {
    const index = readFileSync(join(projectDir, "src", "index.ts"), "utf-8");
    expect(index).toContain("registerRoot");
    expect(index).toContain("RemotionRoot");
  });

  it("generated package.json declares @video-script/renderer dependency", () => {
    const pkg = JSON.parse(
      readFileSync(join(projectDir, "package.json"), "utf-8"),
    ) as { dependencies?: Record<string, string> };
    expect(pkg.dependencies?.["@video-script/renderer"]).toBeTruthy();
  });

  it("defaultProps JSON in Root.tsx embeds all fixture scenes", () => {
    const root = readFileSync(join(projectDir, "src", "Root.tsx"), "utf-8");
    // Each scene is serialised with an "id": field — count occurrences
    const idMatches = root.match(/"id":/g);
    expect(idMatches?.length ?? 0).toBeGreaterThanOrEqual(
      pipeline.adaptedScript.scenes.length,
    );
  });

  // --- Negative: no test-only wrappers ---

  it("generated Root.tsx does NOT contain TestRoot", () => {
    const root = readFileSync(join(projectDir, "src", "Root.tsx"), "utf-8");
    expect(root).not.toContain("TestRoot");
  });

  it("generated Root.tsx does NOT contain MockComposition", () => {
    const root = readFileSync(join(projectDir, "src", "Root.tsx"), "utf-8");
    expect(root).not.toContain("MockComposition");
  });

  it("generated Root.tsx does NOT contain FixtureComposition", () => {
    const root = readFileSync(join(projectDir, "src", "Root.tsx"), "utf-8");
    expect(root).not.toContain("FixtureComposition");
  });

  it("generated Root.tsx does NOT have relative imports (only package imports)", () => {
    const root = readFileSync(join(projectDir, "src", "Root.tsx"), "utf-8");
    // Relative imports would indicate test harness code, not real renderer entry
    expect(root).not.toMatch(/from '\.\.?\//);
  });
});
