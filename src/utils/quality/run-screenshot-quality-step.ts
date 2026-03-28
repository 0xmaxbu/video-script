/**
 * run-screenshot-quality-step.ts
 *
 * Orchestrates screenshot quality evaluation after screenshots are captured
 * and before compose begins.
 *
 * Reads the existing quality-report.md (if present, preserving Script Quality),
 * evaluates screenshot quality, and overwrites quality-report.md with both sections.
 *
 * Per D-05, D-06: wrapped in runNonBlocking — never throws to caller.
 * Per D-09: reads existing script quality section, adds screenshot quality,
 *           and re-writes the entire file.
 *
 * Usage (in CLI resume path, after screenshots complete, before compose):
 *   await runScreenshotQualityStep(outputDir, scenes, images);
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { QualityReport } from "../../types/quality.js";
import type { SceneScript } from "../../types/script.js";
import { writeQualityReport } from "./report-writer.js";
import { runNonBlocking } from "./non-blocking-runner.js";
import { evaluateScreenshotQuality } from "../../mastra/agents/quality/screenshot-quality-agent.js";

/**
 * Read the existing quality-report state from the output directory.
 * If quality-report.md doesn't exist yet, returns a fresh empty report.
 * Since the report is markdown (not JSON), we reconstruct a minimal state
 * that preserves the script quality section by re-using the existing JSON
 * state stored alongside the report (if available).
 *
 * In practice the script quality step stores its result in a sidecar JSON
 * at quality-report-state.json so we can reconstitute it here.
 * If no sidecar exists, we start fresh (screenshot section only).
 */
function loadExistingReport(outputDir: string): QualityReport {
  const statePath = join(outputDir, "quality-report-state.json");
  if (existsSync(statePath)) {
    try {
      return JSON.parse(readFileSync(statePath, "utf-8")) as QualityReport;
    } catch {
      // Fall through to fresh report
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    outputDir,
    errors: [],
  };
}

/**
 * Run the screenshot quality step non-blockingly.
 * Augments the existing quality-report.md (adding Screenshot Quality section).
 *
 * @param outputDir - The video generation output directory
 * @param scenes    - Scenes from script.json (with visualLayers)
 * @param images    - Map of "<sceneId>-<layerId>" → absolute image path
 */
export async function runScreenshotQualityStep(
  outputDir: string,
  scenes: SceneScript[],
  images: Record<string, string>,
): Promise<void> {
  const reportPath = join(outputDir, "quality-report.md");
  const existingReport = loadExistingReport(outputDir);

  const updatedReport = await runNonBlocking(
    async () => {
      const screenshotQuality = await evaluateScreenshotQuality(scenes, images);
      return {
        ...existingReport,
        generatedAt: new Date().toISOString(),
        screenshotQuality,
      };
    },
    "screenshot",
    existingReport,
  );

  writeQualityReport(updatedReport, reportPath);
}
