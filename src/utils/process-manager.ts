import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

export interface RenderProcessInput {
  script: {
    title: string;
    totalDuration: number;
    scenes: Array<{
      id: string;
      type: "intro" | "feature" | "code" | "outro";
      title: string;
      narration: string;
      duration: number;
      startTime?: number;
      endTime?: number;
      visualContent?: string;
      code?: {
        language: string;
        code: string;
        highlightLines?: number[];
      };
    }>;
  };
  screenshotResources: Record<string, string>;
  outputDir: string;
  videoFileName?: string;
  srtOutputPath?: string;
}

export interface RenderProcessOutput {
  success: boolean;
  videoPath?: string;
  duration?: number;
  fps?: number;
  resolution?: string;
  error?: string;
}

export interface RenderProcessOptions {
  onProgress?: (percent: number) => void;
  timeoutMs?: number;
}

export async function spawnRenderer(
  input: RenderProcessInput,
  options: RenderProcessOptions = {},
): Promise<RenderProcessOutput> {
  const { onProgress, timeoutMs = 10 * 60 * 1000 } = options;

  const inputFile = join(
    tmpdir(),
    `video-script-render-${randomBytes(8).toString("hex")}.json`,
  );

  await writeFile(inputFile, JSON.stringify(input), "utf-8");

  const rendererPath = join(
    process.cwd(),
    "packages/renderer/bin/video-script-render.js",
  );
  const args = ["render", "--input", inputFile];
  if (input.srtOutputPath) {
    args.push("--srt", input.srtOutputPath);
  }

  return new Promise<RenderProcessOutput>((resolve) => {
    let stdout = "";
    let timedOut = false;

    const child = spawn("node", [rendererPath, ...args], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_PATH: join(process.cwd(), "packages/renderer/node_modules"),
      },
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000);
    }, timeoutMs);

    const handleInterrupt = () => {
      child.kill("SIGTERM");
    };
    process.on("SIGINT", handleInterrupt);
    process.on("SIGTERM", handleInterrupt);

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;

      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed) as Record<string, unknown>;
          if (
            typeof msg.progress === "number" &&
            Object.keys(msg).length === 1
          ) {
            onProgress?.(msg.progress);
          }
        } catch (_) {}
      }
    });

    child.on("close", (code: number | null) => {
      clearTimeout(timer);
      process.off("SIGINT", handleInterrupt);
      process.off("SIGTERM", handleInterrupt);

      unlink(inputFile).catch(() => undefined);

      if (timedOut) {
        return resolve({ success: false, error: "Render process timed out" });
      }

      const lines = stdout
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const lastJsonLine = [...lines].reverse().find((l) => l.startsWith("{"));

      if (lastJsonLine) {
        try {
          const result = JSON.parse(lastJsonLine) as RenderProcessOutput;
          if (typeof result.success === "boolean") {
            return resolve(result);
          }
        } catch (_) {
          // JSON.parse failed — fall through to generic error
        }
      }

      return resolve({
        success: false,
        error:
          code !== null && code !== 0
            ? `Renderer exited with code ${code}`
            : "No valid result from renderer",
      });
    });

    child.on("error", (err: Error) => {
      clearTimeout(timer);
      process.off("SIGINT", handleInterrupt);
      process.off("SIGTERM", handleInterrupt);
      unlink(inputFile).catch(() => undefined);
      resolve({ success: false, error: `Process error: ${err.message}` });
    });
  });
}
