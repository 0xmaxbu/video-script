/**
 * run-script-quality-step.ts
 *
 * Orchestrates script quality evaluation after script.json is written to disk.
 *
 * Reads script.json from the output directory, runs the heuristic evaluator,
 * builds/updates the QualityReport, and overwrites quality-report.md.
 *
 * Per D-05, D-06: wrapped in runNonBlocking — never throws to caller.
 * Per D-09: writes Script Quality section to quality-report.md (first call).
 *
 * Usage (in CLI create path, after script.json is written):
 *   await runScriptQualityStep(outputDir);
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import type { QualityReport } from "../../types/quality.js";
import { writeQualityReport } from "./report-writer.js";
import { runNonBlocking } from "./non-blocking-runner.js";
import { evaluateScriptQuality } from "../../mastra/agents/quality/script-quality-agent.js";
import type { SceneScript } from "../../types/script.js";

/**
 * Run the script quality step non-blockingly.
 * Reads script.json from outputDir, evaluates quality, writes quality-report.md.
 *
 * @param outputDir - The video generation output directory (contains script.json)
 */
export async function runScriptQualityStep(outputDir: string): Promise<void> {
  const reportPath = join(outputDir, "quality-report.md");

  const initialReport: QualityReport = {
    generatedAt: new Date().toISOString(),
    outputDir,
    errors: [],
  };

  const updatedReport = await runNonBlocking(
    async () => {
      const scriptPath = join(outputDir, "script.json");
      if (!existsSync(scriptPath)) {
        throw new Error(`script.json not found at ${scriptPath}`);
      }

      const raw = readFileSync(scriptPath, "utf-8");
      const parsed: { scenes: SceneScript[] } = JSON.parse(raw) as {
        scenes: SceneScript[];
      };

      const scriptQuality = await evaluateScriptQuality(parsed.scenes);

      return {
        ...initialReport,
        scriptQuality,
      };
    },
    "script",
    initialReport,
  );

  writeQualityReport(updatedReport, reportPath);

  // Write a sidecar JSON so the screenshot step can reconstruct this report's
  // script quality section without re-parsing the markdown file.
  const statePath = join(outputDir, "quality-report-state.json");
  writeFileSync(statePath, JSON.stringify(updatedReport, null, 2), "utf-8");
}
