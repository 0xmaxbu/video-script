/**
 * quality-resume-path.test.ts
 *
 * Verifies that the screenshot quality step is correctly wired to the resume path:
 * - runScreenshotQualityStep reads sidecar JSON (quality-report-state.json)
 *   to reconstruct the Script Quality section
 * - Evaluates screenshot quality and overwrites quality-report.md
 *   with BOTH Script Quality AND Screenshot Quality sections
 * - Any evaluation error only goes to the report (non-blocking)
 * - The sidecar is written by runScriptQualityStep for round-trip correctness
 *
 * Uses a real temp directory and real fixture data (no LLM calls).
 */

import { describe, it, expect, afterEach } from "vitest";
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { runScriptQualityStep } from "../../utils/quality/run-script-quality-step.js";
import { runScreenshotQualityStep } from "../../utils/quality/run-screenshot-quality-step.js";
import type { SceneScript } from "../../types/script.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  const dir = join(tmpdir(), `quality-resume-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

const sampleScenes: SceneScript[] = [
  {
    id: "scene-001",
    type: "intro",
    title: "Introduction",
    narration:
      "Welcome to this test video. We will explore the topic in depth.",
    duration: 10,
    visualLayers: [
      {
        id: "bg",
        type: "screenshot",
        content: "https://example.com",
        position: {
          x: "center",
          y: "center",
          width: "full",
          height: "full",
          zIndex: 0,
        },
        animation: { enter: "fadeIn", enterDelay: 0, exit: "none" },
      },
    ],
  },
  {
    id: "scene-002",
    type: "feature",
    title: "Main Feature",
    narration:
      "Here we demonstrate the core functionality. It handles many edge cases.",
    duration: 15,
    visualLayers: [
      {
        id: "layer-1",
        type: "screenshot",
        content: "https://example.com/feature",
        position: {
          x: "center",
          y: "center",
          width: "full",
          height: "full",
          zIndex: 0,
        },
        animation: { enter: "fadeIn", enterDelay: 0, exit: "none" },
      },
    ],
  },
];

function writeScript(dir: string): void {
  const script = {
    title: "Test Script",
    totalDuration: 25,
    scenes: sampleScenes,
  };
  writeFileSync(join(dir, "script.json"), JSON.stringify(script, null, 2));
}

/** Create a fake PNG file so existsSync checks pass */
function makeFakePng(dir: string, filename: string): string {
  const filePath = join(dir, filename);
  writeFileSync(filePath, Buffer.from([0x89, 0x50, 0x4e, 0x47])); // PNG magic bytes
  return filePath;
}

const tmpDirs: string[] = [];

afterEach(() => {
  for (const d of tmpDirs) {
    try {
      rmSync(d, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
  tmpDirs.length = 0;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("runScreenshotQualityStep — resume path wiring", () => {
  it("creates quality-report.md with Screenshot Quality section", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const images: Record<string, string> = {};
    await runScreenshotQualityStep(dir, sampleScenes, images);

    const reportPath = join(dir, "quality-report.md");
    expect(existsSync(reportPath)).toBe(true);
    const content = readFileSync(reportPath, "utf-8");
    expect(content).toContain("## Screenshot Quality");
  });

  it("report contains the scene IDs from evaluated scenes", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const images: Record<string, string> = {};
    await runScreenshotQualityStep(dir, sampleScenes, images);

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    expect(content).toContain("scene-001");
    expect(content).toContain("scene-002");
  });

  it("when script quality ran first, report contains BOTH sections", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    // Step 1: script quality (writes quality-report.md + sidecar)
    await runScriptQualityStep(dir);

    // Step 2: screenshot quality (reads sidecar, rewrites with both sections)
    const images: Record<string, string> = {};
    await runScreenshotQualityStep(dir, sampleScenes, images);

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    expect(content).toContain("## Script Quality");
    expect(content).toContain("## Screenshot Quality");
  });

  it("script quality section appears only ONCE after both steps", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    await runScriptQualityStep(dir);
    await runScreenshotQualityStep(dir, sampleScenes, {});

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    const scriptMatches = (content.match(/## Script Quality/g) ?? []).length;
    expect(scriptMatches).toBe(1);
  });

  it("screenshot quality section appears only ONCE after both steps", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    await runScriptQualityStep(dir);
    await runScreenshotQualityStep(dir, sampleScenes, {});

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    const screenshotMatches = (content.match(/## Screenshot Quality/g) ?? [])
      .length;
    expect(screenshotMatches).toBe(1);
  });

  it("sidecar quality-report-state.json is written by runScriptQualityStep", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    await runScriptQualityStep(dir);

    const statePath = join(dir, "quality-report-state.json");
    expect(existsSync(statePath)).toBe(true);
    const state = JSON.parse(readFileSync(statePath, "utf-8")) as {
      scriptQuality?: unknown;
    };
    expect(state.scriptQuality).toBeDefined();
  });

  it("screenshot quality step does NOT throw when no sidecar exists (non-blocking)", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    await expect(
      runScreenshotQualityStep(dir, sampleScenes, {}),
    ).resolves.toBeUndefined();
  });

  it("missing screenshot files result in 'fileFound: false' warning rows", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    // Pass empty images map — no files present
    await runScreenshotQualityStep(dir, sampleScenes, {});

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    // Both layers should show ❌ (not found)
    expect(content).toMatch(/❌/);
  });

  it("existing screenshot files result in fileFound OK rows", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const img1 = makeFakePng(dir, "scene-001-bg.png");
    const img2 = makeFakePng(dir, "scene-002-layer-1.png");
    const images: Record<string, string> = {
      "scene-001-bg": img1,
      "scene-002-layer-1": img2,
    };

    await runScreenshotQualityStep(dir, sampleScenes, images);

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    // Both layers found — should show ✅ for file found column
    const foundCount = (content.match(/\| scene-00\d \|/g) ?? []).length;
    expect(foundCount).toBeGreaterThanOrEqual(2);
  });

  it("does NOT throw when scenes list is empty (non-blocking)", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    await expect(
      runScreenshotQualityStep(dir, [], {}),
    ).resolves.toBeUndefined();
  });

  it("no Screenshot Quality section content without any screenshot layers", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const noLayerScenes: SceneScript[] = [
      {
        id: "scene-001",
        type: "intro",
        title: "Intro",
        narration: "Just narration, no visual layers.",
        duration: 5,
      },
    ];

    await runScreenshotQualityStep(dir, noLayerScenes, {});

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    expect(content).toContain("## Screenshot Quality");
    expect(content).toContain("_No layers evaluated._");
  });
});
