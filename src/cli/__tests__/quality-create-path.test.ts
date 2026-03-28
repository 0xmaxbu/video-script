/**
 * quality-create-path.test.ts
 *
 * Verifies that the script quality step is correctly wired to the `create` path:
 * - runScriptQualityStep reads script.json from outputDir
 * - Evaluates quality and writes quality-report.md (Script Quality section)
 * - Any evaluation error only goes to the report (non-blocking)
 * - The report is fully overwritten each call (not appended)
 *
 * Uses a real temp directory + real script.json fixture (no LLM calls).
 */

import { describe, it, expect, afterEach } from "vitest";
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { runScriptQualityStep } from "../../utils/quality/run-script-quality-step.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  const dir = join(tmpdir(), `quality-create-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeScript(
  dir: string,
  overrides: Record<string, unknown> = {},
): string {
  const script = {
    title: "Test Script",
    totalDuration: 30,
    scenes: [
      {
        id: "scene-001",
        type: "intro",
        title: "Introduction",
        narration:
          "Welcome to this test video. We will explore the topic in depth.",
        duration: 10,
        visualLayers: [],
      },
      {
        id: "scene-002",
        type: "feature",
        title: "Main Feature",
        narration:
          "Here we demonstrate the core functionality of the system. It handles many edge cases.",
        duration: 15,
        visualLayers: [
          {
            id: "layer-1",
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
        id: "scene-003",
        type: "outro",
        title: "Conclusion",
        narration: "Thank you for watching this demonstration.",
        duration: 5,
        visualLayers: [],
      },
    ],
    ...overrides,
  };
  const scriptPath = join(dir, "script.json");
  writeFileSync(scriptPath, JSON.stringify(script, null, 2));
  return scriptPath;
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

describe("runScriptQualityStep — create path wiring", () => {
  it("creates quality-report.md in the output directory", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    await runScriptQualityStep(dir);

    const reportPath = join(dir, "quality-report.md");
    expect(existsSync(reportPath)).toBe(true);
  });

  it("report contains '## Script Quality' header", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    await runScriptQualityStep(dir);

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    expect(content).toContain("## Script Quality");
  });

  it("report includes scene titles from script.json", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    await runScriptQualityStep(dir);

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    expect(content).toContain("Introduction");
    expect(content).toContain("Main Feature");
    expect(content).toContain("Conclusion");
  });

  it("report contains overall status (ok|warning|error)", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    await runScriptQualityStep(dir);

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    expect(content).toMatch(/\*\*Overall:\*\* (✅ OK|⚠️ WARNING|❌ ERROR)/);
  });

  it("second call to runScriptQualityStep overwrites (not appends) the report", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    await runScriptQualityStep(dir);
    const first = readFileSync(join(dir, "quality-report.md"), "utf-8");
    const firstCount = (first.match(/## Script Quality/g) ?? []).length;

    // Call again — should still have exactly one Script Quality section
    await runScriptQualityStep(dir);
    const second = readFileSync(join(dir, "quality-report.md"), "utf-8");
    const secondCount = (second.match(/## Script Quality/g) ?? []).length;

    expect(firstCount).toBe(1);
    expect(secondCount).toBe(1); // overwrite, not append
  });

  it("does NOT throw when script.json is missing (non-blocking)", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    // Deliberately do NOT write script.json

    await expect(runScriptQualityStep(dir)).resolves.toBeUndefined();
  });

  it("writes an error entry to the report when script.json is missing", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    // No script.json

    await runScriptQualityStep(dir);

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    expect(content).toContain("## Evaluation Errors");
    expect(content).toContain("[script]");
  });

  it("does NOT throw when script.json contains invalid JSON (non-blocking)", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeFileSync(join(dir, "script.json"), "{ invalid json");

    await expect(runScriptQualityStep(dir)).resolves.toBeUndefined();
  });

  it("report does not contain 'Screenshot Quality' section after create step", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    await runScriptQualityStep(dir);

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    expect(content).not.toContain("## Screenshot Quality");
  });

  it("heuristic score appears in report (0-10 range)", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir);

    await runScriptQualityStep(dir);

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    expect(content).toMatch(/\*\*Heuristic score:\*\* \d+\/10/);
  });

  it("scene with no visual layers and type 'feature' gets alignment warning", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    writeScript(dir, {
      scenes: [
        {
          id: "scene-001",
          type: "feature",
          title: "Feature No Layers",
          narration:
            "This feature scene has no visual layers attached to it at all.",
          duration: 8,
          visualLayers: [],
        },
      ],
    });

    await runScriptQualityStep(dir);

    const content = readFileSync(join(dir, "quality-report.md"), "utf-8");
    expect(content).toContain("WARNING");
  });
});
