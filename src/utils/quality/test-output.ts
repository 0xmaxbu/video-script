/**
 * test-output helper — manages the project-root test-output directory.
 *
 * Per D-04: the top-level output root is always the project-root test-output/.
 * Per D-04: each run clears test-output/ before generating new artifacts.
 * Per D-03: --topic only changes topic/slug/report content — never the output root.
 */

import { rmSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

/** Absolute path to project root (process.cwd() when running from repo) */
const PROJECT_ROOT = process.cwd();

/**
 * The fixed top-level output root for all E2E test runs.
 * Always project-root/test-output/ — never overridden by --topic.
 */
export const TEST_OUTPUT_ROOT = join(PROJECT_ROOT, "test-output");

/**
 * Clear and recreate the test-output/ directory.
 * Must be called before each E2E test run.
 */
export function clearTestOutput(): void {
  if (existsSync(TEST_OUTPUT_ROOT)) {
    rmSync(TEST_OUTPUT_ROOT, { recursive: true, force: true });
  }
  mkdirSync(TEST_OUTPUT_ROOT, { recursive: true });
}

/**
 * Get the expected output subdirectory for a given slug.
 * The slug is derived from the topic, but the root is always TEST_OUTPUT_ROOT.
 */
export function getTestOutputSubdir(slug: string): string {
  return join(TEST_OUTPUT_ROOT, slug);
}
