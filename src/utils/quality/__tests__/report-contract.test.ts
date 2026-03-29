import { describe, it, expect } from "vitest";
import type {
  QualityStatus,
  QualityReport,
  ScriptQualitySection,
  ScreenshotQualitySection,
  SceneScriptQualityResult,
  LayerScreenshotMatchResult,
  QualityErrorRecord,
} from "../../../types/quality.js";

describe("Quality report schema contract", () => {
  describe("QualityStatus", () => {
    it("only allows ok | warning | error — not gate/pass/fail values", () => {
      const validStatuses: QualityStatus[] = ["ok", "warning", "error"];
      expect(validStatuses).toHaveLength(3);
      expect(validStatuses).toContain("ok");
      expect(validStatuses).toContain("warning");
      expect(validStatuses).toContain("error");
      // The type system prevents "pass"/"fail"/"gate" — we assert the known values are exactly 3
    });
  });

  describe("SceneScriptQualityResult", () => {
    it("includes D-07 three dimensions: depth, specificity, coverage", () => {
      const result: SceneScriptQualityResult = {
        sceneId: "scene-1",
        sceneTitle: "Introduction",
        depthStatus: "ok",
        specificityStatus: "warning",
        specificityNote: "lacks specific version numbers",
        coverageStatus: "error",
        coverageNote: "missing core concepts",
      };
      expect(result.depthStatus).toBe("ok");
      expect(result.specificityStatus).toBe("warning");
      expect(result.coverageStatus).toBe("error");
    });

    it("includes optional LLM score 0-10", () => {
      const result: SceneScriptQualityResult = {
        sceneId: "scene-1",
        sceneTitle: "Introduction",
        depthStatus: "ok",
        specificityStatus: "ok",
        coverageStatus: "ok",
        llmScore: 8,
        llmNote: "Good depth and specificity",
      };
      expect(result.llmScore).toBe(8);
    });
  });

  describe("ScriptQualitySection", () => {
    it("has evaluatedAt, overallStatus, and scenes array", () => {
      const section: ScriptQualitySection = {
        evaluatedAt: "2026-03-28T00:00:00Z",
        overallStatus: "warning",
        scenes: [
          {
            sceneId: "s1",
            sceneTitle: "Intro",
            depthStatus: "ok",
            specificityStatus: "warning",
            coverageStatus: "ok",
          },
        ],
      };
      expect(section.evaluatedAt).toBeTruthy();
      expect(section.overallStatus).toBe("warning");
      expect(section.scenes).toHaveLength(1);
    });

    it("can record evaluation errors without gating", () => {
      const section: ScriptQualitySection = {
        evaluatedAt: "2026-03-28T00:00:00Z",
        overallStatus: "error",
        scenes: [],
        evaluationError: "LLM API timeout",
      };
      expect(section.evaluationError).toBe("LLM API timeout");
      // The error is just recorded — no gate behavior
    });
  });

  describe("LayerScreenshotMatchResult", () => {
    it("includes fileFound, relevanceStatus, visualStatus", () => {
      const result: LayerScreenshotMatchResult = {
        sceneId: "scene-1",
        layerId: "layer-1",
        fileFound: true,
        relevanceStatus: "ok",
        visualStatus: "warning",
        visualNote: "slight blur detected",
      };
      expect(result.fileFound).toBe(true);
      expect(result.relevanceStatus).toBe("ok");
      expect(result.visualStatus).toBe("warning");
    });
  });

  describe("ScreenshotQualitySection", () => {
    it("has evaluatedAt, overallStatus, and layers array", () => {
      const section: ScreenshotQualitySection = {
        evaluatedAt: "2026-03-28T00:00:00Z",
        overallStatus: "ok",
        layers: [
          {
            sceneId: "s1",
            layerId: "l1",
            fileFound: true,
            relevanceStatus: "ok",
            visualStatus: "ok",
          },
        ],
      };
      expect(section.layers).toHaveLength(1);
    });
  });

  describe("QualityErrorRecord", () => {
    it("identifies which step failed and records message + timestamp", () => {
      const err: QualityErrorRecord = {
        step: "script",
        message: "Agent call timed out",
        timestamp: "2026-03-28T00:00:00Z",
      };
      expect(err.step).toBe("script");
      expect(err.message).toBeTruthy();
    });
  });

  describe("QualityReport (D-09: unified report)", () => {
    it("can hold script quality only (after create step)", () => {
      const report: QualityReport = {
        generatedAt: "2026-03-28T00:00:00Z",
        outputDir: "/tmp/test-output",
        scriptQuality: {
          evaluatedAt: "2026-03-28T00:00:00Z",
          overallStatus: "ok",
          scenes: [],
        },
        errors: [],
      };
      expect(report.scriptQuality).toBeDefined();
      expect(report.screenshotQuality).toBeUndefined();
    });

    it("can hold both script + screenshot quality (after resume step)", () => {
      const report: QualityReport = {
        generatedAt: "2026-03-28T00:01:00Z",
        outputDir: "/tmp/test-output",
        scriptQuality: {
          evaluatedAt: "2026-03-28T00:00:00Z",
          overallStatus: "ok",
          scenes: [],
        },
        screenshotQuality: {
          evaluatedAt: "2026-03-28T00:01:00Z",
          overallStatus: "warning",
          layers: [],
        },
        errors: [],
      };
      expect(report.scriptQuality).toBeDefined();
      expect(report.screenshotQuality).toBeDefined();
    });

    it("accumulates errors from both steps without gating", () => {
      const report: QualityReport = {
        generatedAt: "2026-03-28T00:01:00Z",
        outputDir: "/tmp/test-output",
        errors: [
          {
            step: "script",
            message: "Script eval failed",
            timestamp: "2026-03-28T00:00:00Z",
          },
          {
            step: "screenshot",
            message: "Vision API unavailable",
            timestamp: "2026-03-28T00:01:00Z",
          },
        ],
      };
      expect(report.errors).toHaveLength(2);
      // No gate field, no pass/fail field
      expect(
        (report as unknown as Record<string, unknown>).gate,
      ).toBeUndefined();
      expect(
        (report as unknown as Record<string, unknown>).passed,
      ).toBeUndefined();
    });
  });
});
