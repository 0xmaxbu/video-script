#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import chalk from "chalk";
import ora from "ora";
import { promptForInput } from "./prompts.js";
import { mastra } from "../mastra/index.js";
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
      }
      if (options.output) {
        console.log(chalk.gray(`  Output directory: ${options.output}`));
      }

      const workflow = mastra.getWorkflow("videoGeneration");

      spinner.start("🚀 Starting video generation workflow...");
      const run = await workflow.createRun();

      spinner.text = "🎬 Executing workflow steps...";
      const workflowResult = await run.start({ inputData: input });

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
  .command("config")
  .description("View configuration")
  .action(() => {
    console.log(chalk.blue("\n⚙️  Configuration\n"));
    console.log(chalk.yellow("TODO: implement config command logic\n"));
  });

program.parse();
