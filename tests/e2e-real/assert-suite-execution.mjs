#!/usr/bin/env node
/**
 * assert-suite-execution.mjs
 *
 * Parses a Vitest JSON reporter output file and asserts that all required
 * test suite files were:
 *   1. Discovered (appear in the report)
 *   2. Not empty (have at least 1 test listed)
 *   3. Have at least 1 non-skipped test (when REQUIRE_REAL_EXECUTION=true)
 *
 * Usage:
 *   node tests/e2e-real/assert-suite-execution.mjs <report.json> <suite1> <suite2> ...
 *
 * Environment:
 *   REQUIRE_REAL_EXECUTION=true  — enforce that each suite has ≥1 non-skipped test
 *                                   (use in CI with real API keys)
 *
 * Exit codes:
 *   0 — all assertions pass
 *   1 — one or more assertions failed (prints summary)
 *
 * This script implements the D-02 locked decision: the test:e2e verification
 * must be based on structured reporter output, not file-name grep or pass/fail alone.
 */

import { readFileSync } from "fs";
import { resolve, basename } from "path";

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
const [, , reportFile, ...requiredSuites] = process.argv;

if (!reportFile || requiredSuites.length === 0) {
  console.error(
    "Usage: node assert-suite-execution.mjs <report.json> <suite1> [suite2 ...]",
  );
  process.exit(1);
}

const REQUIRE_REAL_EXECUTION = process.env["REQUIRE_REAL_EXECUTION"] === "true";

// ---------------------------------------------------------------------------
// Parse report
// ---------------------------------------------------------------------------
let report;
try {
  report = JSON.parse(readFileSync(resolve(reportFile), "utf-8"));
} catch (err) {
  console.error(`ERROR: Cannot read/parse report file: ${reportFile}`);
  console.error(err.message);
  process.exit(1);
}

/** @type {Array<{name: string, status: string, assertionResults: Array<{status: string, fullName: string}>}>} */
const testResults = report.testResults ?? [];

// Build lookup: absolute or basename → result entry
const byAbsolute = new Map();
const byBasename = new Map();
for (const result of testResults) {
  byAbsolute.set(result.name, result);
  byBasename.set(basename(result.name), result);
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------
let allPassed = true;
const summary = [];

for (const suitePath of requiredSuites) {
  const absPath = resolve(suitePath);
  const base = basename(suitePath);

  // Find by absolute path or basename match
  const result =
    byAbsolute.get(absPath) ??
    byAbsolute.get(suitePath) ??
    byBasename.get(base);

  const label = suitePath;

  if (!result) {
    console.error(`❌ MISSING: ${label} — not found in report`);
    summary.push({ suite: label, status: "missing" });
    allPassed = false;
    continue;
  }

  const tests = result.assertionResults ?? [];

  if (tests.length === 0) {
    console.error(`❌ EMPTY: ${label} — no tests found in suite`);
    summary.push({ suite: label, status: "empty" });
    allPassed = false;
    continue;
  }

  const passed = tests.filter((t) => t.status === "passed").length;
  const skipped = tests.filter(
    (t) =>
      t.status === "skipped" || t.status === "todo" || t.status === "pending",
  ).length;
  const failed = tests.filter((t) => t.status === "failed").length;
  const total = tests.length;

  if (REQUIRE_REAL_EXECUTION && passed === 0) {
    console.error(
      `❌ ALL SKIPPED: ${label} — ${total} tests, ${skipped} skipped, 0 passed` +
        `\n   (REQUIRE_REAL_EXECUTION=true requires ≥1 non-skipped test)`,
    );
    summary.push({ suite: label, status: "all-skipped", total, skipped });
    allPassed = false;
    continue;
  }

  if (failed > 0) {
    console.error(
      `❌ FAILED: ${label} — ${failed} test(s) failed out of ${total}`,
    );
    summary.push({ suite: label, status: "failed", total, failed });
    allPassed = false;
    continue;
  }

  const statusLabel =
    passed > 0
      ? `${passed}/${total} passed`
      : `${skipped}/${total} skipped (env vars missing — OK in dev)`;

  console.log(`✅ FOUND: ${label} — ${statusLabel}`);
  summary.push({
    suite: label,
    status: passed > 0 ? "passed" : "skipped-ok",
    total,
    passed,
    skipped,
  });
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n── Suite Execution Summary ──────────────────────────────────");
for (const s of summary) {
  const icon = s.status === "passed" || s.status === "skipped-ok" ? "✅" : "❌";
  console.log(`${icon} ${s.suite}: ${s.status}`);
}
console.log("─────────────────────────────────────────────────────────────");

if (!allPassed) {
  console.error(
    `\n❌ Suite execution assertion FAILED — see errors above.\n` +
      `   Run with REQUIRE_REAL_EXECUTION=true only in CI with real API keys.`,
  );
  process.exit(1);
}

console.log(`\n✅ All required suites discovered and verified.\n`);
process.exit(0);
