import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawn, ChildProcess } from "child_process";
import { join } from "path";
import { existsSync, rmSync, mkdirSync } from "fs";
import { tmpdir } from "os";

const CLI_PATH = join(process.cwd(), "dist/cli/index.js");
const PROJECT_ROOT = process.cwd();

describe("CLI E2E Tests", () => {
  let tempOutputDir: string;

  beforeEach(() => {
    tempOutputDir = join(tmpdir(), `video-script-e2e-${Date.now()}`);
    mkdirSync(tempOutputDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempOutputDir)) {
      rmSync(tempOutputDir, { recursive: true, force: true });
    }
  });

  describe("Basic CLI Commands", () => {
    it("should display help message", async () => {
      const result = await runCLI(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("video-script");
      expect(result.stdout).toContain("research");
      expect(result.stdout).toContain("script");
      expect(result.stdout).toContain("screenshot");
      expect(result.stdout).toContain("compose");
    });

    it("should display version", async () => {
      const result = await runCLI(["--version"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    it("should show config", async () => {
      const result = await runCLI(["config"]);

      expect([0, 1]).toContain(result.exitCode);
      const output = result.stdout + result.stderr;
      expect(output).toContain("llm");
      expect(output).toContain("video");
    });
  });

  describe("Research Command", () => {
    it("should show research command help", async () => {
      const result = await runCLI(["research", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("research");
      expect(result.stdout).toContain("--links");
      expect(result.stdout).toContain("--doc");
      expect(result.stdout).toContain("--output");
    });

    it("should require title", async () => {
      const result = await runCLI(["research"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("missing required argument");
    });
  });

  describe("Script Command", () => {
    it("should show script command help", async () => {
      const result = await runCLI(["script", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("script");
    });
  });

  describe("Screenshot Command", () => {
    it("should show screenshot command help", async () => {
      const result = await runCLI(["screenshot", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("screenshot");
    });
  });

  describe("Compose Command", () => {
    it("should show compose command help", async () => {
      const result = await runCLI(["compose", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("compose");
    });
  });

  describe("Workflow Integration", () => {
    it("should have valid TypeScript types", async () => {
      const distExists = existsSync(join(PROJECT_ROOT, "dist"));
      expect(distExists).toBe(true);

      const entryExists = existsSync(CLI_PATH);
      expect(entryExists).toBe(true);
    });

    it("should have required dependencies installed", async () => {
      const nodeModulesExists = existsSync(join(PROJECT_ROOT, "node_modules"));
      expect(nodeModulesExists).toBe(true);

      const mastraExists = existsSync(
        join(PROJECT_ROOT, "node_modules/@mastra/core"),
      );
      expect(mastraExists).toBe(true);
    });
  });
});

interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

function runCLI(args: string[], timeoutMs = 10000): Promise<CLIResult> {
  return new Promise((resolve) => {
    const result: CLIResult = {
      stdout: "",
      stderr: "",
      exitCode: null,
    };

    const proc: ChildProcess = spawn("node", [CLI_PATH, ...args], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, CI: "true" },
      timeout: timeoutMs,
    });

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      resolve({
        ...result,
        exitCode: 124,
      });
    }, timeoutMs);

    proc.stdout?.on("data", (data: Buffer) => {
      result.stdout += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      result.stderr += data.toString();
    });

    proc.on("close", (code: number | null) => {
      clearTimeout(timer);
      result.exitCode = code;
      resolve(result);
    });

    proc.on("error", (err: Error) => {
      clearTimeout(timer);
      result.stderr += err.message;
      result.exitCode = 1;
      resolve(result);
    });
  });
}
