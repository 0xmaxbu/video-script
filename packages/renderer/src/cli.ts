import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { Command } from "commander";
import { renderVideo, RenderVideoInputSchema } from "./index.js";
import { generateSrt } from "./srt-generator.js";

const DEFAULT_OUTPUT_DIR = join(homedir(), "simple-videos");

const program = new Command();

program
  .name("video-script-render")
  .description("Standalone Remotion-based video renderer")
  .version("0.1.0");

program
  .command("render")
  .description("Render a video from a JSON input file")
  .requiredOption("--input <path>", "Path to JSON input file")
  .option("--srt <path>", "Optional path to write SRT subtitle file")
  .action(async (options: { input: string; srt?: string }) => {
    try {
      const raw = await readFile(options.input, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      const input = RenderVideoInputSchema.parse(parsed);

      process.stdout.write(JSON.stringify({ progress: 0 }) + "\n");

      const result = await renderVideo({
        script: input.script,
        screenshotResources: input.screenshotResources,
        outputDir: input.outputDir || DEFAULT_OUTPUT_DIR,
        ...(input.videoFileName !== undefined && {
          videoFileName: input.videoFileName,
        }),
        showSubtitles: input.showSubtitles ?? false,
        onProgress: (pct: number) => {
          process.stdout.write(JSON.stringify({ progress: pct }) + "\n");
        },
      });

      if (options.srt && result.success) {
        await generateSrt({
          script: input.script,
          outputPath: options.srt,
        });
      }

      process.stdout.write(JSON.stringify(result) + "\n");
      process.exit(result.success ? 0 : 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stdout.write(
        JSON.stringify({ success: false, error: message }) + "\n",
      );
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Fatal error: ${message}\n`);
  process.exit(1);
});
