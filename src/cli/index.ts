#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import chalk from "chalk";
import ora from "ora";
import { promptForInput } from "./prompts.js";
import { mastra } from "../mastra/index.js";
import { gracefulShutdown } from "../utils/graceful-shutdown.js";
import type { ResearchInput } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, "..", "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const program = new Command();

program
  .name("video-script")
  .description("AI-powered video generation CLI tool for tech tutorials")
  .version(packageJson.version);

program
  .command("create [title]")
  .description("Create a new video project")
  .option("--links <urls>", "Reference links (comma-separated)")
  .option("--doc <file>", "Reference document file path")
  .option(
    "--aspect-ratio <ratio>",
    "Video aspect ratio (default: 16:9)",
    "16:9",
  )
  .option("--no-review", "Skip all review nodes and run automatically")
  .option("--output <dir>", "Output directory")
  .action(async (title, options) => {
    const spinner = ora();
    gracefulShutdown.setSpinner(spinner);

    try {
      let input: ResearchInput;
      if (!title) {
        input = await promptForInput();
      } else {
        input = await promptForInput(title);
      }

      console.log(
        chalk.blue(`\n📹 Creating video: ${chalk.bold(input.title)}`),
      );
      console.log(chalk.green("✓ Input collected successfully"));

      if (input.links && input.links.length > 0) {
        console.log(chalk.gray(`  Links: ${input.links.join(", ")}`));
      }
      if (input.document) {
        console.log(
          chalk.gray(`  Document: ${input.document.substring(0, 50)}...`),
        );
      }
      if (options.aspectRatio !== "16:9") {
        console.log(chalk.gray(`  Aspect ratio: ${options.aspectRatio}`));
      }
      if (options.review === false) {
        console.log(chalk.gray("  Skip review: true"));
        process.env.VIDEO_SCRIPT_SKIP_REVIEW = "true";
      }
      if (options.output) {
        console.log(chalk.gray(`  Output directory: ${options.output}`));
      }

      const workflow = mastra.getWorkflow("video-generation-workflow");

      spinner.start("🚀 Starting video generation workflow...");
      const run = await workflow.createRun();
      gracefulShutdown.setRunId(run.runId);
      gracefulShutdown.setWorkflowStatus("running");

      spinner.text = "🎬 Executing workflow steps...";
      const workflowResult = await run.start({ inputData: input });

      if (workflowResult.status === "suspended") {
        spinner.info("⏸️  Workflow paused for review");

        const scriptData = workflowResult.suspendPayload as {
          title: string;
          totalDuration: number;
          scenes: Array<{
            id: string;
            type: string;
            title: string;
            narration: string;
            duration: number;
          }>;
        };

        console.log(chalk.blue("\n📝 Generated Script\n"));
        console.log(chalk.bold(`  Title: ${scriptData.title}`));
        console.log(
          chalk.gray(
            `  Total Duration: ${Math.round(scriptData.totalDuration)}s`,
          ),
        );
        console.log(chalk.gray(`  Scenes: ${scriptData.scenes.length}`));

        console.log(chalk.blue("\n📊 Scene Summary:\n"));
        scriptData.scenes.forEach((scene, index) => {
          const typeIcon: Record<string, string> = {
            intro: "🎬",
            feature: "📷",
            code: "💻",
            outro: "🎬",
          };
          const icon = typeIcon[scene.type] || "📄";
          console.log(
            `  ${icon} ${chalk.bold(`Scene ${index + 1}`)}: ${scene.title}`,
          );
          console.log(
            chalk.gray(
              `     Type: ${scene.type} | Duration: ${scene.duration}s`,
            ),
          );
          console.log(
            chalk.gray(
              `     ${scene.narration.substring(0, 60)}${scene.narration.length > 60 ? "..." : ""}`,
            ),
          );
        });

        const runId = run.runId;
        console.log(chalk.yellow("\n⏳ Awaiting Human Review\n"));
        console.log(
          chalk.gray("The workflow is paused. Review the script above."),
        );
        console.log(chalk.gray("To resume with approved script:"));
        console.log(
          chalk.cyan(
            `  video-script resume ${runId} --file <edited-script.json>`,
          ),
        );
        console.log(chalk.gray("\nOr resume without changes:"));
        console.log(chalk.cyan(`  video-script resume ${runId}`));
        console.log(chalk.gray(`\nRun ID: ${runId}`));
        return;
      }

      spinner.succeed("✅ Video generation completed!");

      console.log(chalk.green("\n🎉 Video generation complete!\n"));

      const result =
        workflowResult.status === "success" ? workflowResult.result : null;

      if (result) {
        console.log(chalk.blue("📁 Project path:"), result.projectPath);
        if (result.videoPath) {
          console.log(chalk.blue("🎥 Video path:"), result.videoPath);
        }
        console.log(
          chalk.blue("📐 Video config:"),
          `${result.videoConfig.resolution} @ ${result.videoConfig.fps}fps, ${result.videoConfig.duration}s`,
        );
        if (result.warnings && result.warnings.length > 0) {
          console.log(chalk.yellow("\n⚠️  Warnings:"));
          result.warnings.forEach((w: string) =>
            console.log(chalk.yellow(`  - ${w}`)),
          );
        }
      }
    } catch (error) {
      spinner.fail("❌ Video generation failed");
      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
        if (error.stack) {
          console.error(chalk.gray(error.stack));
        }
      } else {
        console.error(chalk.red("\n❌ An unexpected error occurred\n"));
      }
      process.exit(1);
    }
  });

program
  .command("resume <runId>")
  .description("Resume a suspended workflow")
  .option("--file <path>", "Path to edited script JSON file")
  .action(async (runId, options) => {
    const spinner = ora();

    try {
      const workflow = mastra.getWorkflow("video-generation-workflow");

      spinner.start(`🔄 Resuming workflow ${runId}...`);

      const run = await workflow.createRun({ runId });

      let resumeData = undefined;
      if (options.file) {
        const { readFileSync } = await import("fs");
        const fileContent = readFileSync(options.file, "utf-8");
        resumeData = JSON.parse(fileContent);
        spinner.text = "📄 Loaded edited script from file...";
      }

      const workflowResult = await run.resume({ resumeData });

      if (workflowResult.status === "suspended") {
        spinner.info("⏸️  Workflow still paused for review");
        console.log(
          chalk.yellow("\nReview not completed. Please provide edited script."),
        );
        console.log(
          chalk.cyan(
            `  video-script resume ${runId} --file <edited-script.json>`,
          ),
        );
        return;
      }

      spinner.succeed("✅ Workflow resumed and completed!");

      console.log(chalk.green("\n🎉 Video generation complete!\n"));

      const result =
        workflowResult.status === "success" ? workflowResult.result : null;

      if (result) {
        console.log(chalk.blue("📁 Project path:"), result.projectPath);
        if (result.videoPath) {
          console.log(chalk.blue("🎥 Video path:"), result.videoPath);
        }
        console.log(
          chalk.blue("📐 Video config:"),
          `${result.videoConfig.resolution} @ ${result.videoConfig.fps}fps, ${result.videoConfig.duration}s`,
        );
        if (result.warnings && result.warnings.length > 0) {
          console.log(chalk.yellow("\n⚠️  Warnings:"));
          result.warnings.forEach((w: string) =>
            console.log(chalk.yellow(`  - ${w}`)),
          );
        }
      }
    } catch (error) {
      spinner.fail("❌ Failed to resume workflow");
      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
        if (error.stack) {
          console.error(chalk.gray(error.stack));
        }
      } else {
        console.error(chalk.red("\n❌ An unexpected error occurred\n"));
      }
      process.exit(1);
    }
  });

program
  .command("config")
  .description("View configuration")
  .action(() => {
    console.log(chalk.blue("\n⚙️  Configuration\n"));
    console.log(chalk.yellow("TODO: implement config command logic\n"));
  });

program.parse();
