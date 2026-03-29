import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, readFileSync, rmSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { writeQualityReport } from "../report-writer.js";
import { runNonBlocking } from "../non-blocking-runner.js";
import type {
  QualityReport,
  ScriptQualitySection,
  ScreenshotQualitySection,
} from "../../../types/quality.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReport(overrides: Partial<QualityReport> = {}): QualityReport {
  return {
    generatedAt: "2026-03-28T00:00:00Z",
    outputDir: "/tmp/test-output",
    errors: [],
    ...overrides,
  };
}

function makeScriptSection(
  overallStatus: "ok" | "warning" | "error" = "ok",
): ScriptQualitySection {
  return {
    evaluatedAt: "2026-03-28T00:00:00Z",
    overallStatus,
    scenes: [
      {
        sceneId: "s1",
        sceneTitle: "Introduction",
        depthStatus: "ok",
        specificityStatus: overallStatus === "warning" ? "warning" : "ok",
        coverageStatus: "ok",
        llmScore: 8,
      },
    ],
  };
}

function makeScreenshotSection(
  overallStatus: "ok" | "warning" | "error" = "ok",
): ScreenshotQualitySection {
  return {
    evaluatedAt: "2026-03-28T00:01:00Z",
    overallStatus,
    layers: [
      {
        sceneId: "s1",
        layerId: "l1",
        fileFound: true,
        relevanceStatus: "ok",
        visualStatus: overallStatus === "error" ? "error" : "ok",
        visualNote: overallStatus === "error" ? "image blank" : undefined,
      },
    ],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("writeQualityReport", () => {
  let tmpDir: string;
  let reportPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "quality-report-test-"));
    reportPath = join(tmpDir, "quality-report.md");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes a valid markdown file with header", () => {
    const report = makeReport();
    writeQualityReport(report, reportPath);
    const content = readFileSync(reportPath, "utf-8");
    expect(content).toContain("# Quality Report");
    expect(content).toContain("Generated");
  });

  it("writes Script Quality section when scriptQuality is present", () => {
    const report = makeReport({ scriptQuality: makeScriptSection("ok") });
    writeQualityReport(report, reportPath);
    const content = readFileSync(reportPath, "utf-8");
    expect(content).toContain("## Script Quality");
    expect(content).toContain("Introduction");
  });

  it("writes Screenshot Quality section when screenshotQuality is present", () => {
    const report = makeReport({
      screenshotQuality: makeScreenshotSection("ok"),
    });
    writeQualityReport(report, reportPath);
    const content = readFileSync(reportPath, "utf-8");
    expect(content).toContain("## Screenshot Quality");
  });

  it("writes both sections when both are present (D-09)", () => {
    const report = makeReport({
      scriptQuality: makeScriptSection("ok"),
      screenshotQuality: makeScreenshotSection("warning"),
    });
    writeQualityReport(report, reportPath);
    const content = readFileSync(reportPath, "utf-8");
    expect(content).toContain("## Script Quality");
    expect(content).toContain("## Screenshot Quality");
  });

  it("overwrites entire file on second call (not append)", () => {
    // First write: script only
    const report1 = makeReport({ scriptQuality: makeScriptSection("ok") });
    writeQualityReport(report1, reportPath);

    // Second write: both script + screenshot — should fully overwrite
    const report2 = makeReport({
      scriptQuality: makeScriptSection("warning"),
      screenshotQuality: makeScreenshotSection("ok"),
    });
    writeQualityReport(report2, reportPath);

    const content = readFileSync(reportPath, "utf-8");
    // Both sections exist
    expect(content).toContain("## Script Quality");
    expect(content).toContain("## Screenshot Quality");
    // File has exactly ONE "# Quality Report" header (not duplicated)
    const headerCount = (content.match(/^# Quality Report/gm) ?? []).length;
    expect(headerCount).toBe(1);
  });

  it("does not write gate/pass/fail language", () => {
    const report = makeReport({
      scriptQuality: makeScriptSection("error"),
      screenshotQuality: makeScreenshotSection("error"),
    });
    writeQualityReport(report, reportPath);
    const content = readFileSync(reportPath, "utf-8").toLowerCase();
    expect(content).not.toMatch(/\bgate\b/);
    expect(content).not.toMatch(/\bpassed\b/);
    expect(content).not.toMatch(/\bfailed\b/);
    // These words appearing only in "pass" context — error/warning/ok are fine
  });

  it("includes evaluation error note in the section when present", () => {
    const report = makeReport({
      scriptQuality: {
        evaluatedAt: "2026-03-28T00:00:00Z",
        overallStatus: "error",
        scenes: [],
        evaluationError: "LLM API timeout",
      },
    });
    writeQualityReport(report, reportPath);
    const content = readFileSync(reportPath, "utf-8");
    expect(content).toContain("LLM API timeout");
  });

  it("creates parent directories if they don't exist", () => {
    const deepPath = join(tmpDir, "nested", "deep", "quality-report.md");
    const report = makeReport();
    writeQualityReport(report, deepPath);
    const content = readFileSync(deepPath, "utf-8");
    expect(content).toContain("# Quality Report");
  });
});

describe("runNonBlocking", () => {
  it("returns the fn result when fn succeeds", async () => {
    const baseReport = makeReport();
    const updatedReport = makeReport({
      scriptQuality: makeScriptSection("ok"),
    });

    const result = await runNonBlocking(
      async () => updatedReport,
      "script",
      baseReport,
    );

    expect(result.scriptQuality).toBeDefined();
    expect(result.errors).toHaveLength(0);
  });

  it("catches fn errors and appends them to report without re-throwing", async () => {
    const baseReport = makeReport();

    const result = await runNonBlocking(
      async () => {
        throw new Error("Agent call failed");
      },
      "script",
      baseReport,
    );

    // Must NOT throw
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].step).toBe("script");
    expect(result.errors[0].message).toContain("Agent call failed");
    expect(result.errors[0].timestamp).toBeTruthy();
  });

  it("preserves existing errors when adding a new one", async () => {
    const baseReport = makeReport({
      errors: [
        {
          step: "script",
          message: "Previous error",
          timestamp: "2026-03-28T00:00:00Z",
        },
      ],
    });

    const result = await runNonBlocking(
      async () => {
        throw new Error("New error");
      },
      "screenshot",
      baseReport,
    );

    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].message).toBe("Previous error");
    expect(result.errors[1].step).toBe("screenshot");
  });

  it("does not affect main flow exit behavior when fn throws", async () => {
    const baseReport = makeReport();
    let mainFlowCompleted = false;

    // Simulate main flow: run quality, then continue regardless
    await runNonBlocking(
      async () => {
        throw new Error("Eval failed");
      },
      "screenshot",
      baseReport,
    );
    mainFlowCompleted = true;

    expect(mainFlowCompleted).toBe(true);
  });

  it("handles non-Error throws gracefully", async () => {
    const baseReport = makeReport();
    const result = await runNonBlocking(
      async () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "string error";
      },
      "screenshot",
      baseReport,
    );

    expect(result.errors[0].message).toBe("string error");
  });
});
