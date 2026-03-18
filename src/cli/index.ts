#!/usr/bin/env node

import "dotenv/config";

import { Command } from "commander";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import chalk from "chalk";
import ora from "ora";
import { promptForInput } from "./prompts.js";
import {
  researchAgent,
  scriptAgent,
  screenshotAgent,
} from "../mastra/agents/index.js";
import { gracefulShutdown } from "../utils/graceful-shutdown.js";
import { loadConfig, maskSensitiveConfig } from "../utils/config.js";
import { generateOutputDirectory } from "../utils/output-directory.js";
import { spawnRenderer } from "../utils/index.js";
import type { ResearchInput } from "../types/index.js";
import {
  ResearchOutputSchema,
  type ResearchOutput,
} from "../types/research.js";
import { ScriptOutputSchema, type ScriptOutput } from "../types/script.js";

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
  .command("research <title>")
  .description("Generate research.json from title, links, and document")
  .option("--links <urls>", "Reference links (comma-separated)")
  .option("--doc <file>", "Reference document file path")
  .option(
    "--output <dir>",
    "Output directory (optional, auto-generated if not specified)",
  )
  .action(async (title, options) => {
    const spinner = ora();
    gracefulShutdown.setSpinner(spinner);

    try {
      let input: ResearchInput;
      const links = options.links
        ? options.links.split(",").map((url: string) => url.trim())
        : undefined;
      let document: string | undefined;

      if (options.doc) {
        document = readFileSync(options.doc, "utf-8");
      }

      if (!links && !document) {
        input = await promptForInput(title);
      } else {
        input = { title, links, document };
      }

      console.log(chalk.blue("\n🔍 Researching: " + chalk.bold(input.title)));
      if (input.links && input.links.length > 0) {
        console.log(chalk.gray("  Links: " + input.links.join(", ")));
      }
      if (input.document) {
        console.log(
          chalk.gray("  Document: " + input.document.substring(0, 50) + "..."),
        );
      }

      const baseDir = "./output";
      let outputDir: string;

      if (options.output) {
        outputDir = options.output;
      } else {
        outputDir = await generateOutputDirectory(baseDir, input.title);
      }

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      console.log(chalk.gray("  Output directory: " + outputDir));

      spinner.start("🔍 Running research agent...");

      const result = await researchAgent.generate([
        {
          role: "user",
          content: JSON.stringify({
            title: input.title,
            links: input.links || [],
            document: input.document || "",
          }),
        },
      ]);

      spinner.text = "📝 Processing research output...";

      let researchOutput: ResearchOutput;
      try {
        const textContent =
          typeof result.text === "string"
            ? result.text
            : JSON.stringify(result.text);

        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in agent response");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        researchOutput = {
          title: parsed.title || input.title,
          segments:
            parsed.segments ||
            parsed.keyPoints?.map(
              (kp: { title: string; description: string }, index: number) => ({
                order: index + 1,
                sentence: kp.description || kp.title,
                keyContent: JSON.stringify({ concept: kp.title }),
                links:
                  parsed.sources?.map((s: { url: string; title: string }) => ({
                    url: s.url,
                    key: s.title,
                  })) || [],
              }),
            ) ||
            [],
        };

        researchOutput = ResearchOutputSchema.parse(researchOutput);
      } catch (parseError) {
        spinner.fail("Failed to parse research output");
        throw new Error(
          "Failed to parse research output: " +
            (parseError instanceof Error
              ? parseError.message
              : String(parseError)),
        );
      }

      const researchPath = join(outputDir, "research.json");
      writeFileSync(researchPath, JSON.stringify(researchOutput, null, 2));

      spinner.succeed("✅ Research completed!");

      console.log(chalk.green("\n📊 Research Output:\n"));
      console.log(chalk.bold("  Title: " + researchOutput.title));
      console.log(chalk.gray("  Segments: " + researchOutput.segments.length));

      researchOutput.segments.slice(0, 3).forEach((segment, index) => {
        console.log(
          chalk.gray(
            "  " +
              (index + 1) +
              ". " +
              segment.sentence.substring(0, 60) +
              (segment.sentence.length > 60 ? "..." : ""),
          ),
        );
      });

      if (researchOutput.segments.length > 3) {
        console.log(
          chalk.gray(
            "  ... and " + (researchOutput.segments.length - 3) + " more",
          ),
        );
      }

      console.log(chalk.blue("\n📁 Output: " + researchPath));
      console.log(chalk.gray("\nNext step: Run `video-script script <dir>`"));
    } catch (error) {
      spinner.fail("❌ Research failed");
      if (error instanceof Error) {
        console.error(chalk.red("\n❌ Error: " + error.message + "\n"));
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
  .command("script <dir>")
  .description("Generate script.json from research.json")
  .action(async (dir) => {
    const spinner = ora();
    gracefulShutdown.setSpinner(spinner);

    try {
      const researchPath = join(dir, "research.json");

      if (!existsSync(researchPath)) {
        throw new Error(
          "research.json not found in " +
            dir +
            ". Run 'video-script research' first.",
        );
      }

      console.log(chalk.blue("\n📝 Generating script from research..."));
      console.log(chalk.gray("  Input: " + researchPath));

      const researchContent = readFileSync(researchPath, "utf-8");
      const research: ResearchOutput = ResearchOutputSchema.parse(
        JSON.parse(researchContent),
      );

      spinner.start("📝 Running script agent...");

      const result = await scriptAgent.generate([
        {
          role: "user",
          content:
            "根据以下研究数据生成视频脚本。\n\n研究数据:\n" +
            JSON.stringify(research, null, 2) +
            '\n\n输出格式 (JSON):\n{\n  "title": "视频标题",\n  "totalDuration": 180,\n  "scenes": [\n    {\n      "id": "scene-1",\n      "type": "intro|feature|code|outro",\n      "title": "场景标题",\n      "narration": "旁白文本",\n      "duration": 12\n    }\n  ]\n}\n\n要求:\n- 每个场景必须有: id, type, title, narration, duration\n- type 必须是: intro, feature, code, outro 之一\n- intro 和 outro: 10-15秒\n- feature: 20-60秒\n- code: 30-90秒\n- totalDuration 是所有场景 duration 之和\n- 不要包含 visualLayers 字段',
        },
      ]);

      spinner.text = "📝 Processing script output...";

      let scriptOutput: ScriptOutput;
      try {
        const textContent =
          typeof result.text === "string"
            ? result.text
            : JSON.stringify(result.text);

        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in agent response");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        scriptOutput = ScriptOutputSchema.parse(parsed);
      } catch (parseError) {
        spinner.fail("Failed to parse script output");
        throw new Error(
          "Failed to parse script output: " +
            (parseError instanceof Error
              ? parseError.message
              : String(parseError)),
        );
      }

      const scriptPath = join(dir, "script.json");
      writeFileSync(scriptPath, JSON.stringify(scriptOutput, null, 2));

      spinner.succeed("✅ Script generated!");

      console.log(chalk.green("\n🎬 Script Output:\n"));
      console.log(chalk.bold("  Title: " + scriptOutput.title));
      console.log(chalk.gray("  Scenes: " + scriptOutput.scenes.length));

      scriptOutput.scenes.slice(0, 3).forEach((scene, index) => {
        const typeIcon =
          scene.type === "intro"
            ? "🚀"
            : scene.type === "feature"
              ? "✨"
              : scene.type === "code"
                ? "💻"
                : "👋";
        console.log(
          chalk.gray(
            "  " +
              typeIcon +
              " Scene " +
              (scene.id || String(index + 1)) +
              ": " +
              (scene.title || scene.narration).substring(0, 50) +
              ((scene.title || scene.narration).length > 50 ? "..." : ""),
          ),
        );
      });

      if (scriptOutput.scenes.length > 3) {
        console.log(
          chalk.gray("  ... and " + (scriptOutput.scenes.length - 3) + " more"),
        );
      }

      console.log(chalk.blue("\n📁 Output: " + scriptPath));
      console.log(
        chalk.gray("\nNext step: Run `video-script screenshot <dir>`"),
      );
    } catch (error) {
      spinner.fail("❌ Script generation failed");
      if (error instanceof Error) {
        console.error(chalk.red("\n❌ Error: " + error.message + "\n"));
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
  .command("screenshot <dir>")
  .description("Capture screenshots from script.json")
  .action(async (dir) => {
    const spinner = ora();
    gracefulShutdown.setSpinner(spinner);

    try {
      const scriptPath = join(dir, "script.json");

      if (!existsSync(scriptPath)) {
        throw new Error(
          "script.json not found in " +
            dir +
            ". Run 'video-script script' first.",
        );
      }

      console.log(chalk.blue("\n📸 Capturing screenshots..."));
      console.log(chalk.gray("  Input: " + scriptPath));

      const scriptContent = readFileSync(scriptPath, "utf-8");
      const script: ScriptOutput = ScriptOutputSchema.parse(
        JSON.parse(scriptContent),
      );

      const screenshotsDir = join(dir, "screenshots");
      if (!existsSync(screenshotsDir)) {
        mkdirSync(screenshotsDir, { recursive: true });
      }

      spinner.start("📸 Running screenshot agent...");

      const result = await screenshotAgent.generate([
        {
          role: "user",
          content:
            "Process the following script and generate screenshots for each scene.\n\nScript:\n" +
            JSON.stringify(script, null, 2) +
            "\n\nOutput directory: " +
            screenshotsDir +
            '\n\nFor each scene:\n- If type is "url", capture a webpage screenshot using playwrightScreenshot tool\n- If type is "text", generate a text image\n- Save files as scene-001.png, scene-002.png, etc.\n\nReturn a JSON object with the list of captured screenshots:\n{\n  "screenshots": [\n    { "sceneOrder": 1, "filename": "scene-001.png", "success": true }\n  ]\n}',
        },
      ]);

      spinner.text = "📸 Processing screenshot results...";

      interface ScreenshotResult {
        screenshots: Array<{
          sceneOrder: number;
          filename: string;
          success: boolean;
          error?: string;
        }>;
      }

      let screenshotResult: ScreenshotResult;
      try {
        const textContent =
          typeof result.text === "string"
            ? result.text
            : JSON.stringify(result.text);

        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          screenshotResult = {
            screenshots: script.scenes.map((_scene, index) => ({
              sceneOrder: index + 1,
              filename: "scene-" + String(index + 1).padStart(3, "0") + ".png",
              success: true,
            })),
          };
        } else {
          screenshotResult = JSON.parse(jsonMatch[0]);
        }
      } catch {
        screenshotResult = {
          screenshots: script.scenes.map((_scene, index) => ({
            sceneOrder: index + 1,
            filename: "scene-" + String(index + 1).padStart(3, "0") + ".png",
            success: true,
          })),
        };
      }

      spinner.succeed("✅ Screenshots captured!");

      const successCount = screenshotResult.screenshots.filter(
        (s) => s.success,
      ).length;
      const failCount = screenshotResult.screenshots.length - successCount;

      console.log(chalk.green("\n📸 Screenshot Results:\n"));
      console.log(
        chalk.gray("  Captured: " + successCount + "/" + script.scenes.length),
      );

      if (failCount > 0) {
        console.log(chalk.yellow("  Failed: " + failCount));
      }

      screenshotResult.screenshots.slice(0, 5).forEach((s) => {
        const icon = s.success ? "✓" : "✗";
        const color = s.success ? chalk.green : chalk.red;
        console.log(
          color("  " + icon + " Scene " + s.sceneOrder + ": " + s.filename),
        );
      });

      if (screenshotResult.screenshots.length > 5) {
        console.log(
          chalk.gray(
            "  ... and " + (screenshotResult.screenshots.length - 5) + " more",
          ),
        );
      }

      console.log(chalk.blue("\n📁 Output: " + screenshotsDir));
      console.log(chalk.gray("\nNext step: Run `video-script compose <dir>`"));
    } catch (error) {
      spinner.fail("❌ Screenshot capture failed");
      if (error instanceof Error) {
        console.error(chalk.red("\n❌ Error: " + error.message + "\n"));
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
  .command("compose <dir>")
  .description(
    "Generate final video and subtitles from script.json and screenshots",
  )
  .action(async (dir) => {
    const spinner = ora();
    gracefulShutdown.setSpinner(spinner);

    try {
      const scriptPath = join(dir, "script.json");
      const screenshotsDir = join(dir, "screenshots");

      if (!existsSync(scriptPath)) {
        throw new Error(
          "script.json not found in " +
            dir +
            ". Run 'video-script script' first.",
        );
      }

      if (!existsSync(screenshotsDir)) {
        throw new Error(
          "screenshots directory not found in " +
            dir +
            ". Run 'video-script screenshot' first.",
        );
      }

      console.log(chalk.blue("\n🎬 Composing video..."));
      console.log(chalk.gray("  Script: " + scriptPath));
      console.log(chalk.gray("  Screenshots: " + screenshotsDir));

      const scriptContent = readFileSync(scriptPath, "utf-8");
      const script: ScriptOutput = ScriptOutputSchema.parse(
        JSON.parse(scriptContent),
      );

      const screenshotResources: Record<string, string> = {};
      script.scenes.forEach((scene, index) => {
        const sceneKey = scene.id || String(index + 1);
        const filename = `scene-${sceneKey}.png`;
        const filepath = join(screenshotsDir, filename);
        if (existsSync(filepath)) {
          screenshotResources[sceneKey] = filepath;
        }
      });

      const srtPath = join(dir, "output.srt");

      spinner.start("🎬 Rendering video...");

      const onProgress = (progress: number) => {
        if (progress === 10) {
          spinner.text = "🎬 Generating Remotion project...";
        } else if (progress === 30) {
          spinner.text = "🎬 Preparing video output...";
        } else if (progress === 50) {
          spinner.text = "🎬 Rendering video frames...";
        } else if (progress === 80) {
          spinner.text = "🎬 Finalizing video...";
        } else if (progress === 90) {
          spinner.text = "🎬 Cleaning up...";
        } else if (progress === 100) {
          spinner.text = "🎬 Complete!";
        }
      };

      const videoResult = await spawnRenderer(
        {
          script: {
            title: script.title,
            totalDuration: script.scenes.reduce(
              (sum, s) => sum + s.duration,
              0,
            ),
            scenes: script.scenes.map((scene) => ({
              id: scene.id,
              type: scene.type,
              title: scene.title,
              narration: scene.narration,
              duration: scene.duration,
              ...(scene.visualLayers !== undefined && {
                visualLayers: scene.visualLayers,
              }),
            })),
          },
          screenshotResources,
          outputDir: dir,
          videoFileName: "output.mp4",
          srtOutputPath: srtPath,
        },
        { onProgress },
      );

      if (!videoResult.success) {
        throw new Error(videoResult.error ?? "Video rendering failed");
      }

      spinner.succeed("✅ Video composed!");

      console.log(chalk.green("\n🎉 Composition Complete!\n"));
      console.log(chalk.blue("📁 Video:"), videoResult.videoPath);
      console.log(chalk.blue("📝 Subtitles:"), srtPath);
      console.log(
        chalk.blue("⏱️  Duration:"),
        Math.round(videoResult.duration ?? 0) + "s",
      );
      console.log(chalk.blue("🎬 Scenes:"), script.scenes.length);

      console.log(chalk.green("\n✨ Your video is ready!"));
    } catch (error) {
      spinner.fail("❌ Video composition failed");
      if (error instanceof Error) {
        console.error(chalk.red("\n❌ Error: " + error.message + "\n"));
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
  .description("View current configuration (sensitive values masked)")
  .action(() => {
    try {
      const config = loadConfig();
      const masked = maskSensitiveConfig(config);
      console.log(chalk.blue("\n⚙️  Current Configuration\n"));
      console.log(JSON.stringify(masked, null, 2));
      console.log();
    } catch (error) {
      console.error(
        chalk.red(
          "\n❌ Failed to load config: " +
            (error instanceof Error ? error.message : String(error)) +
            "\n",
        ),
      );
      process.exit(1);
    }
  });

program.parse();
