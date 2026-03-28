/**
 * cli-runner — thin wrapper around `video-script` CLI for real E2E tests.
 *
 * Per D-03: --topic only changes topic/slug/report content, never output root.
 * Per D-04: output root is always project-root/test-output/, cleared each run.
 *
 * Default topic: "TypeScript 5.4 新特性"
 */

import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process";
import { join } from "path";
import {
  clearTestOutput,
  TEST_OUTPUT_ROOT,
} from "../../../src/utils/quality/test-output.js";

export const DEFAULT_TOPIC = "TypeScript 5.4 新特性";

export interface RunCreateOptions {
  /** Override topic — changes topic/slug/report content only, NOT output root */
  topic?: string;
  /** Additional CLI args */
  extraArgs?: string[];
  /** Timeout in ms (default: 5 minutes) */
  timeoutMs?: number;
}

export interface CliRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  outputRoot: string;
}

const CLI_SCRIPT = join(process.cwd(), "src", "cli", "index.ts");
const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

function runCli(args: string[], timeoutMs: number): CliRunResult {
  const opts: ExecSyncOptionsWithStringEncoding = {
    encoding: "utf-8",
    timeout: timeoutMs,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  };

  const cmd = `npx tsx ${CLI_SCRIPT} ${args.join(" ")}`;

  try {
    const stdout = execSync(cmd, opts);
    return { stdout, stderr: "", exitCode: 0, outputRoot: TEST_OUTPUT_ROOT };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      exitCode: e.status ?? 1,
      outputRoot: TEST_OUTPUT_ROOT,
    };
  }
}

/**
 * Run `video-script create` with the given options.
 *
 * Always:
 * - Clears test-output/ before running (per D-04)
 * - Uses project-root/test-output/ as output root (per D-04)
 * - Default topic is "TypeScript 5.4 新特性" (per D-03)
 */
export function runCreate(opts: RunCreateOptions = {}): CliRunResult {
  clearTestOutput();

  const topic = opts.topic ?? DEFAULT_TOPIC;
  const args = [
    "create",
    `--output "${TEST_OUTPUT_ROOT}"`,
    `--topic "${topic}"`,
    "--no-interactive",
    ...(opts.extraArgs ?? []),
  ];

  return runCli(args, opts.timeoutMs ?? DEFAULT_TIMEOUT);
}

/**
 * Run `video-script resume` on an existing output dir.
 *
 * Does NOT clear test-output/ — resume continues from existing state.
 */
export function runResume(
  outputDir: string,
  opts: { timeoutMs?: number } = {},
): CliRunResult {
  const args = ["resume", `"${outputDir}"`];
  return runCli(args, opts.timeoutMs ?? DEFAULT_TIMEOUT);
}
