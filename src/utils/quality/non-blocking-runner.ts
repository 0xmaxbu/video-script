/**
 * Non-blocking runner for quality evaluation steps.
 *
 * Per D-05, D-06: quality eval failures must ONLY go to the report,
 * never change the main flow exit code or throw to the caller.
 *
 * Usage:
 *   const result = await runNonBlocking(
 *     () => evaluateScript(script),
 *     "script",
 *     existingReport,
 *   );
 */

import type { QualityReport, QualityErrorRecord } from "../../types/quality.js";

/**
 * Run an async quality evaluation function.
 * If it throws, record the error in the report and return the report unchanged.
 * Never re-throws. Never changes process exit code.
 *
 * @param fn      - The evaluation function to run
 * @param step    - Which step this is ("script" | "screenshot")
 * @param report  - The current report to append errors to if fn throws
 * @returns Updated report (with error appended if fn threw)
 */
export async function runNonBlocking(
  fn: () => Promise<QualityReport>,
  step: "script" | "screenshot",
  report: QualityReport,
): Promise<QualityReport> {
  try {
    return await fn();
  } catch (err) {
    const errorRecord: QualityErrorRecord = {
      step,
      message: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
    // Return the original report with the error appended — no gating
    return {
      ...report,
      errors: [...report.errors, errorRecord],
    };
  }
}
