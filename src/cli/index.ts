#!/usr/bin/env node

import "dotenv/config";

import { Command } from "commander";
import { workspace } from "../mastra/index.js";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from "fs";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { dirname, join, resolve } from "path";
import chalk from "chalk";
import ora from "ora";
import { promptForInput } from "./prompts.js";
import {
  researchAgent,
  scriptAgent,
  screenshotAgent,
  visualAgent,
  generateScriptPrompt,
  generateVisualPrompt,
} from "../mastra/agents/index.js";
import { convertResearchMdToJson } from "./phase8-cli-integration.js";
import { gracefulShutdown } from "../utils/graceful-shutdown.js";
import { loadConfig, maskSensitiveConfig } from "../utils/config.js";
import { generateOutputDirectory } from "../utils/output-directory.js";
import { HELP_TEXT } from "./help-text.js";
import {
  spawnRenderer,
  workflowStateManager,
  generateRunId,
} from "../utils/index.js";
import { adaptScriptForRenderer } from "../utils/scene-adapter.js";
import { findScreenshotFile } from "../utils/screenshot-finder.js";
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

program.helpOption("-h, --help", "显示帮助信息").on("--help", () => {
  console.log(HELP_TEXT);
});

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

      const baseDir = join(homedir(), "simple-videos");
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

      const MAX_RETRIES = 3;
      let lastError: Error | undefined;
      let researchOutput: ResearchOutput | undefined;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
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

          const textContent =
            typeof result.text === "string"
              ? result.text
              : JSON.stringify(result.text);

          // Save raw research output (Markdown) to research.md
          const researchMdPath = join(outputDir, "research.md");
          writeFileSync(researchMdPath, textContent, "utf-8");

          // Try to parse as JSON first (only if text starts with '{')
          const trimmed = textContent.trim();
          if (trimmed.startsWith("{")) {
            const parsed = JSON.parse(trimmed);

            researchOutput = {
              title: parsed.title || input.title,
              segments:
                parsed.segments ||
                parsed.keyPoints?.map(
                  (
                    kp: { title: string; description: string },
                    index: number,
                  ) => ({
                    order: index + 1,
                    sentence: kp.description || kp.title,
                    keyContent: { concept: kp.title },
                    links:
                      parsed.sources?.map(
                        (s: { url: string; title: string }) => ({
                          url: s.url,
                          key: s.title,
                        }),
                      ) || [],
                  }),
                ) ||
                [],
            };

            researchOutput = ResearchOutputSchema.parse(researchOutput);
          } else {
            // Markdown format - convert to JSON using convertResearchMdToJson
            researchOutput = convertResearchMdToJson(textContent);
            researchOutput = ResearchOutputSchema.parse(researchOutput);
          }
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < MAX_RETRIES - 1) {
            spinner.text = chalk.yellow(
              `  Retrying... (${attempt + 1}/${MAX_RETRIES})`,
            );
          }
        }
      }

      if (!researchOutput) {
        spinner.fail("Failed to parse research output");
        throw lastError || new Error("Research failed after retries");
      }

      spinner.text = "📝 Processing research output...";

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
      // Read research.md directly (Markdown format)
      const researchMdPath = join(dir, "research.md");

      if (!existsSync(researchMdPath)) {
        throw new Error(
          "research.md not found in " +
            dir +
            ". Run 'video-script research' first.",
        );
      }

      console.log(chalk.blue("\n📝 Generating script from research.md..."));
      console.log(chalk.gray("  Input: " + researchMdPath));

      // Read the raw Markdown content
      const researchMd = readFileSync(researchMdPath, "utf-8");

      // ========================================
      // Generate scene structure only
      // ========================================
      spinner.start("📝 Generating scene structure...");

      const MAX_RETRIES = 3;
      let lastError: Error | undefined;
      let structureOutput: ScriptOutput | undefined;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const result = await scriptAgent.generate(
            [
              {
                role: "user",
                content: generateScriptPrompt(researchMd),
              },
            ],
            { modelSettings: { maxOutputTokens: 16000 } },
          );

          const textContent =
            typeof result.text === "string"
              ? result.text
              : JSON.stringify(result.text);

          // Split by markdown code fences and try each block
          const jsonBlocks = textContent.split(/```json\s*/).slice(1);

          let parsed: unknown;
          let bestScore = 0;

          for (const block of jsonBlocks) {
            const jsonStr = block.split("```")[0].trim();
            if (!jsonStr) continue;

            try {
              const candidate = JSON.parse(jsonStr);
              // Score by how complete the structure is
              const score =
                (candidate.scenes?.length || 0) * 100 +
                (candidate.title ? 10 : 0) +
                (candidate.totalDuration ? 5 : 0);
              if (score > bestScore) {
                bestScore = score;
                parsed = candidate;
              }
            } catch {
              // Try to fix truncated JSON by finding balanced braces
              let braceCount = 0;
              let endIdx = 0;
              for (let i = 0; i < jsonStr.length; i++) {
                if (jsonStr[i] === "{") braceCount++;
                else if (jsonStr[i] === "}") {
                  braceCount--;
                  if (braceCount === 0) {
                    endIdx = i + 1;
                    break;
                  }
                }
              }
              if (endIdx > 0) {
                try {
                  const fixed = jsonStr.substring(0, endIdx);
                  const candidate = JSON.parse(fixed);
                  const score =
                    (candidate.scenes?.length || 0) * 100 +
                    (candidate.title ? 10 : 0) +
                    (candidate.totalDuration ? 5 : 0);
                  if (score > bestScore) {
                    bestScore = score;
                    parsed = candidate;
                  }
                } catch {
                  // Still can't parse, skip
                }
              }
            }
          }

          if (!parsed) {
            throw new Error("No valid JSON found in agent response");
          }

          // Post-process: flatten narration objects to strings
          // LLM may return narration as { fullText, segments, ... } instead of plain string
          if (parsed && typeof parsed === "object" && "scenes" in parsed) {
            const output = parsed as {
              scenes: Array<{
                narration?: unknown;
                codeHighlights?: Array<Record<string, unknown>>;
              }>;
            };
            for (const scene of output.scenes) {
              // Flatten narration object to string (LLM may use different keys)
              if (scene.narration && typeof scene.narration === "object") {
                const narrationObj = scene.narration as Record<string, unknown>;
                scene.narration =
                  (typeof narrationObj.fullText === "string" &&
                    narrationObj.fullText) ||
                  (typeof narrationObj.text === "string" &&
                    narrationObj.text) ||
                  (typeof narrationObj.content === "string" &&
                    narrationObj.content) ||
                  (typeof narrationObj.value === "string" &&
                    narrationObj.value) ||
                  JSON.stringify(narrationObj);
              }
              // Filter out incomplete codeHighlights
              if (scene.codeHighlights && Array.isArray(scene.codeHighlights)) {
                scene.codeHighlights = scene.codeHighlights.filter(
                  (ch) =>
                    ch.codeLine !== undefined &&
                    ch.codeText !== undefined &&
                    ch.annotationType !== undefined,
                );
              }
            }
          }

          structureOutput = ScriptOutputSchema.parse(parsed);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < MAX_RETRIES - 1) {
            spinner.text = chalk.yellow(
              `  Retrying structure... (${attempt + 1}/${MAX_RETRIES})`,
            );
          }
        }
      }

      if (!structureOutput) {
        spinner.fail("Failed to parse script structure");
        throw (
          lastError || new Error("Structure generation failed after retries")
        );
      }

      // ========================================
      // Skip visual layers generation - handled by separate Visual Agent
      // ========================================

      const scriptOutput: ScriptOutput = {
        title: structureOutput.title,
        totalDuration: structureOutput.totalDuration,
        scenes: structureOutput.scenes,
      };

      spinner.text = "📝 Processing script output...";

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
  .command("visual <dir>")
  .description("Generate visual.json from script.json and research.md")
  .action(async (dir) => {
    const spinner = ora();
    gracefulShutdown.setSpinner(spinner);

    try {
      const scriptPath = join(dir, "script.json");
      const researchMdPath = join(dir, "research.md");

      if (!existsSync(scriptPath)) {
        throw new Error(
          "script.json not found in " +
            dir +
            ". Run 'video-script script' first.",
        );
      }

      if (!existsSync(researchMdPath)) {
        throw new Error(
          "research.md not found in " +
            dir +
            ". Run 'video-script research' first.",
        );
      }

      console.log(chalk.blue("\n🎨 Generating visual plan..."));
      console.log(chalk.gray("  Input: " + scriptPath));

      // Read script.json and research.md
      const scriptContent = readFileSync(scriptPath, "utf-8");
      const script = JSON.parse(scriptContent);
      const researchMd = readFileSync(researchMdPath, "utf-8");

      spinner.start("🎨 Running visual agent...");

      const result = await visualAgent.generate(
        [
          {
            role: "user",
            content: generateVisualPrompt(script, researchMd),
          },
        ],
        { modelSettings: { maxOutputTokens: 16000 } },
      );

      const textContent =
        typeof result.text === "string"
          ? result.text
          : JSON.stringify(result.text);

      // Try to find JSON in code blocks first, then try raw JSON with brace balancing
      let parsed: unknown;
      let bestScore = 0;

      // First try code blocks
      const codeBlockPattern = /```(?:json)?\s*([\s\S]*?)```/g;
      let match;
      while ((match = codeBlockPattern.exec(textContent)) !== null) {
        const jsonStr = match[1].trim();
        if (!jsonStr) continue;
        try {
          const candidate = JSON.parse(jsonStr);
          const score = (candidate.scenes?.length || 0) * 100;
          if (score > bestScore) {
            bestScore = score;
            parsed = candidate;
          }
        } catch {
          // Try to fix truncated JSON by finding balanced braces
          let braceCount = 0;
          let endIdx = 0;
          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === "{") braceCount++;
            else if (jsonStr[i] === "}") {
              braceCount--;
              if (braceCount === 0) {
                endIdx = i + 1;
                break;
              }
            }
          }
          if (endIdx > 0) {
            try {
              const fixed = jsonStr.substring(0, endIdx);
              const candidate = JSON.parse(fixed);
              const score = (candidate.scenes?.length || 0) * 100;
              if (score > bestScore) {
                bestScore = score;
                parsed = candidate;
              }
            } catch {
              // Still can't parse, skip
            }
          }
        }
      }

      // If no valid JSON from code blocks, try finding JSON directly in text
      if (!parsed) {
        // Find the first { and try to build a balanced JSON
        const firstBrace = textContent.indexOf("{");
        if (firstBrace !== -1) {
          const truncated = textContent.substring(firstBrace);
          let braceCount = 0;
          let endIdx = 0;
          for (let i = 0; i < truncated.length; i++) {
            if (truncated[i] === "{") braceCount++;
            else if (truncated[i] === "}") {
              braceCount--;
              if (braceCount === 0) {
                endIdx = i + 1;
                break;
              }
            }
          }
          if (endIdx > 0) {
            try {
              const jsonStr = truncated.substring(0, endIdx);
              const candidate = JSON.parse(jsonStr);
              if (candidate.scenes?.length > 0) {
                parsed = candidate;
              }
            } catch {
              // Failed to parse
            }
          }
        }
      }

      if (!parsed) {
        throw new Error("No valid JSON found in agent response");
      }

      spinner.text = "💾 Saving visual.json...";

      const visualPath = join(dir, "visual.json");
      writeFileSync(visualPath, JSON.stringify(parsed, null, 2));

      spinner.succeed("✅ Visual plan generated!");

      console.log(chalk.green("\n🎨 Visual Plan Output:\n"));
      const visualData = parsed as {
        scenes?: Array<{ sceneId?: string; layoutTemplate?: string }>;
      };
      if (visualData.scenes) {
        console.log(chalk.gray("  Scenes: " + visualData.scenes.length));
        visualData.scenes.slice(0, 5).forEach((scene, index) => {
          console.log(
            chalk.gray(
              "  📐 Scene " +
                (scene.sceneId || String(index + 1)) +
                ": " +
                (scene.layoutTemplate || "unknown"),
            ),
          );
        });
        if (visualData.scenes.length > 5) {
          console.log(
            chalk.gray("  ... and " + (visualData.scenes.length - 5) + " more"),
          );
        }
      }

      console.log(chalk.blue("\n📁 Output: " + visualPath));
      console.log(
        chalk.gray("\nNext step: Run `video-script screenshot <dir>`"),
      );
    } catch (error) {
      spinner.fail("❌ Visual generation failed");
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

      // Build a URL map from research.json to give the screenshot agent concrete URLs
      const researchPathScreenshot = join(dir, "research.json");
      let screenshotSourceUrls: string[] = [];
      if (existsSync(researchPathScreenshot)) {
        try {
          const researchData = JSON.parse(
            readFileSync(researchPathScreenshot, "utf-8"),
          ) as { segments?: Array<{ links?: Array<{ url: string }> }> };
          const urlSet = new Set<string>();
          researchData.segments?.forEach((seg) => {
            seg.links?.forEach((l) => {
              if (l.url && !l.url.includes("example.com")) urlSet.add(l.url);
            });
          });
          screenshotSourceUrls = Array.from(urlSet);
        } catch {
          // research.json is optional
        }
      }

      const screenshotCmdInstructions =
        screenshotSourceUrls.length > 0
          ? `For each scene with type "feature" or "code", capture a webpage screenshot using the playwrightScreenshot tool. ` +
            `Use the most relevant URL from the source list below based on the scene title/narration.\n\n` +
            `Source URLs:\n${screenshotSourceUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}\n\n` +
            `For scenes with type "intro" or "outro", skip screenshot capture.\n` +
            `Save files as scene-001.png, scene-002.png, etc. (matching scene order, including skipped scenes).`
          : `For each scene with type "feature" or "code", capture a webpage screenshot using the playwrightScreenshot tool. ` +
            `Use the URL from the scene's sourceRef field if available, or search for a relevant page based on the scene title.\n` +
            `For scenes with type "intro" or "outro", skip screenshot capture.\n` +
            `Save files as scene-001.png, scene-002.png, etc. (matching scene order, including skipped scenes).`;

      const result = await screenshotAgent.generate([
        {
          role: "user",
          content:
            "Process the following script and generate screenshots for each scene.\n\nScript:\n" +
            JSON.stringify(script, null, 2) +
            "\n\nOutput directory: " +
            screenshotsDir +
            "\n\n" +
            screenshotCmdInstructions +
            '\n\nReturn a JSON object with the list of captured screenshots:\n{\n  "screenshots": [\n    { "sceneOrder": 1, "filename": "scene-001.png", "success": true }\n  ]\n}',
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
  .option("--subtitles", "Include narration subtitles in video output")
  .option("--output <path>", "Custom output path for rendered video")
  .action(async (dir, options: { subtitles?: boolean; output?: string }) => {
    const spinner = ora();
    gracefulShutdown.setSpinner(spinner);

    try {
      const scriptPath = join(dir, "script.json");
      const screenshotsDir = join(dir, "screenshots");
      const outputDir = options.output ? resolve(options.output) : resolve(dir);
      if (options.output) {
        mkdirSync(outputDir, { recursive: true });
      }

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

      // Phase 9: Read visual.json if exists (from visualAgent)
      const visualPath = join(dir, "visual.json");
      let visualPlan: unknown | undefined;
      if (existsSync(visualPath)) {
        try {
          const visualContent = readFileSync(visualPath, "utf-8");
          visualPlan = JSON.parse(visualContent);
          console.log(chalk.gray("  Visual: " + visualPath));
        } catch {
          // Visual plan is optional, continue without it
        }
      }

      // Phase 9: Adapt script to renderer format - convert visual.json to visualLayers
      const adaptedScript = adaptScriptForRenderer(
        script,
        visualPlan as Parameters<typeof adaptScriptForRenderer>[1],
      );

      // Auto-inject screenshot visualLayers for scenes that have no visual content.
      // When visual.json is absent and script.json has no visualLayers, fall back to
      // mapping screenshots/scene-001.png → scene-1 etc. so the renderer shows content.
      const finalScenes = adaptedScript.scenes.map((scene, sceneIndex) => {
        if (!scene.visualLayers || scene.visualLayers.length === 0) {
          const screenshotPath = findScreenshotFile(
            screenshotsDir,
            sceneIndex,
            "bg",
          );
          if (screenshotPath) {
            return {
              ...scene,
              visualLayers: [
                {
                  id: "bg",
                  type: "screenshot" as const,
                  position: {
                    x: "center" as const,
                    y: "center" as const,
                    width: "full" as const,
                    height: "full" as const,
                    zIndex: 0,
                  },
                  content: screenshotPath,
                  animation: {
                    enter: "fadeIn" as const,
                    enterDelay: 0,
                    exit: "none" as const,
                  },
                },
              ],
            };
          }
        }
        return scene;
      });

      const images: Record<string, string> = {};
      finalScenes.forEach((scene, sceneIndex) => {
        scene.visualLayers?.forEach((layer) => {
          if (layer.type === "screenshot" || layer.type === "code") {
            const filepath = findScreenshotFile(
              screenshotsDir,
              sceneIndex,
              layer.id,
            );
            if (filepath) {
              images[`${scene.id}-${layer.id}`] = filepath;
            }
          }
        });
      });

      const srtPath = join(outputDir, "output.srt");

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
            title: adaptedScript.title,
            totalDuration: adaptedScript.totalDuration,
            scenes: finalScenes.map((scene) => ({
              id: scene.id,
              type: scene.type,
              title: scene.title,
              narration: scene.narration,
              duration: scene.duration,
              ...(scene.visualLayers !== undefined && {
                visualLayers: scene.visualLayers,
              }),
              ...(scene.transition !== undefined && {
                transition: scene.transition,
              }),
            })),
          },
          images,
          outputDir: outputDir,
          srtOutputPath: srtPath,
          showSubtitles: options.subtitles ?? false,
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

// Two-Phase Workflow Commands

program
  .command("create [title]")
  .description("Create a new video project (runs research + script)")
  .option("--links <urls>", "Reference links (comma-separated)")
  .option("--doc <file>", "Reference document file path")
  .option(
    "--output <dir>",
    "Output directory (optional, auto-generated if not specified)",
  )
  .option("--no-review", "Skip review and continue to screenshot/compose")
  .option("--aspect-ratio <ratio>", "Aspect ratio", "16:9")
  .action(async (title, options) => {
    const spinner = ora();
    gracefulShutdown.setSpinner(spinner);

    try {
      // Initialize workflow state manager for this output directory
      let outputDir: string;
      if (options.output) {
        outputDir = options.output;
      } else {
        const baseDir = join(homedir(), "simple-videos");
        outputDir = await generateOutputDirectory(baseDir, title || "untitled");
      }

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Initialize workflow state
      workflowStateManager.initialize(
        "video-generation",
        generateRunId(),
        ["research", "script", "screenshot", "compose"],
        { title, outputDir, aspectRatio: options.aspectRatio },
      );
      workflowStateManager.startWorkflow();

      // Phase 1: Research
      spinner.start("🔍 Running research agent...");

      let input: ResearchInput = { title: title || "" };
      const links = options.links
        ? options.links.split(",").map((url: string) => url.trim())
        : undefined;
      let document: string | undefined;

      if (options.doc) {
        document = readFileSync(options.doc, "utf-8");
      }

      if (!links && !document && !title) {
        // Interactive mode - use prompt
        const prompted = await promptForInput(title || "");
        input = prompted;
      } else {
        input = { title: title || "", links, document };
      }

      console.log(chalk.blue("\n🔍 Researching: " + chalk.bold(input.title)));
      if (input.links && input.links.length > 0) {
        console.log(chalk.gray("  Links: " + input.links.join(", ")));
      }

      const MAX_RETRIES = 3;
      let lastError: Error | undefined;
      let researchOutput: ResearchOutput | undefined;

      workflowStateManager.startStep("research");

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
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

          const textContent =
            typeof result.text === "string"
              ? result.text
              : JSON.stringify(result.text);

          // Save raw research output (Markdown) to research.md
          const researchMdPath = join(outputDir, "research.md");
          writeFileSync(researchMdPath, textContent, "utf-8");

          // Try to parse as JSON first (only if text starts with '{')
          const trimmed = textContent.trim();
          if (trimmed.startsWith("{")) {
            const parsed = JSON.parse(trimmed);

            researchOutput = {
              title: parsed.title || input.title,
              segments:
                parsed.segments ||
                parsed.keyPoints?.map(
                  (
                    kp: { title: string; description: string },
                    index: number,
                  ) => ({
                    order: index + 1,
                    sentence: kp.description || kp.title,
                    keyContent: { concept: kp.title },
                    links:
                      parsed.sources?.map(
                        (s: { url: string; title: string }) => ({
                          url: s.url,
                          key: s.title,
                        }),
                      ) || [],
                  }),
                ) ||
                [],
            };

            researchOutput = ResearchOutputSchema.parse(researchOutput);
          } else {
            // Markdown format - convert to JSON using convertResearchMdToJson
            researchOutput = convertResearchMdToJson(textContent);
            researchOutput = ResearchOutputSchema.parse(researchOutput);
          }
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < MAX_RETRIES - 1) {
            spinner.text = chalk.yellow(
              `  Retrying... (${attempt + 1}/${MAX_RETRIES})`,
            );
          }
        }
      }

      if (!researchOutput) {
        workflowStateManager.failStep(
          "research",
          lastError?.message || "Failed",
        );
        workflowStateManager.failWorkflow("Research failed after retries");
        spinner.fail("Failed to parse research output");
        throw lastError || new Error("Research failed after retries");
      }

      // Save research output (both JSON and MD)
      const researchPath = join(outputDir, "research.json");
      const researchMdPath = join(outputDir, "research.md");
      writeFileSync(researchPath, JSON.stringify(researchOutput, null, 2));
      workflowStateManager.completeStep("research", {
        researchPath,
        researchMdPath,
      });

      spinner.text = "📝 Processing research output...";
      spinner.succeed("✅ Research completed!");

      console.log(chalk.green("\n📊 Research Output:\n"));
      console.log(chalk.bold("  Title: " + researchOutput.title));
      console.log(chalk.gray("  Segments: " + researchOutput.segments.length));

      // ========================================
      // Generate scene structure only (without visualLayers)
      // ========================================
      spinner.start("📝 Generating scene structure...");

      workflowStateManager.startStep("script");

      // Read the raw Markdown content for script generation
      const researchMd = readFileSync(researchMdPath, "utf-8");

      let structureOutput: ScriptOutput | undefined;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const result = await scriptAgent.generate(
            [
              {
                role: "user",
                content: generateScriptPrompt(researchMd),
              },
            ],
            { modelSettings: { maxOutputTokens: 16000 } },
          );

          const textContent =
            typeof result.text === "string"
              ? result.text
              : JSON.stringify(result.text);

          // Split by markdown code fences and try each block
          const jsonBlocks = textContent.split(/```json\s*/).slice(1);

          let parsed: unknown;
          let bestScore = 0;

          for (const block of jsonBlocks) {
            const jsonStr = block.split("```")[0].trim();
            if (!jsonStr) continue;

            try {
              const candidate = JSON.parse(jsonStr);
              // Score by how complete the structure is
              const score =
                (candidate.scenes?.length || 0) * 100 +
                (candidate.title ? 10 : 0) +
                (candidate.totalDuration ? 5 : 0);
              if (score > bestScore) {
                bestScore = score;
                parsed = candidate;
              }
            } catch {
              // Try to fix truncated JSON by finding balanced braces
              let braceCount = 0;
              let endIdx = 0;
              for (let i = 0; i < jsonStr.length; i++) {
                if (jsonStr[i] === "{") braceCount++;
                else if (jsonStr[i] === "}") {
                  braceCount--;
                  if (braceCount === 0) {
                    endIdx = i + 1;
                    break;
                  }
                }
              }
              if (endIdx > 0) {
                try {
                  const fixed = jsonStr.substring(0, endIdx);
                  const candidate = JSON.parse(fixed);
                  const score =
                    (candidate.scenes?.length || 0) * 100 +
                    (candidate.title ? 10 : 0) +
                    (candidate.totalDuration ? 5 : 0);
                  if (score > bestScore) {
                    bestScore = score;
                    parsed = candidate;
                  }
                } catch {
                  // Still can't parse, skip
                }
              }
            }
          }

          if (!parsed) {
            throw new Error("No valid JSON found in agent response");
          }

          // Post-process: flatten narration objects to strings
          // LLM may return narration as { fullText, segments, ... } instead of plain string
          if (parsed && typeof parsed === "object" && "scenes" in parsed) {
            const output = parsed as {
              scenes: Array<{
                narration?: unknown;
                codeHighlights?: Array<Record<string, unknown>>;
              }>;
            };
            for (const scene of output.scenes) {
              // Flatten narration object to string (LLM may use different keys)
              if (scene.narration && typeof scene.narration === "object") {
                const narrationObj = scene.narration as Record<string, unknown>;
                scene.narration =
                  (typeof narrationObj.fullText === "string" &&
                    narrationObj.fullText) ||
                  (typeof narrationObj.text === "string" &&
                    narrationObj.text) ||
                  (typeof narrationObj.content === "string" &&
                    narrationObj.content) ||
                  (typeof narrationObj.value === "string" &&
                    narrationObj.value) ||
                  JSON.stringify(narrationObj);
              }
              // Filter out incomplete codeHighlights
              if (scene.codeHighlights && Array.isArray(scene.codeHighlights)) {
                scene.codeHighlights = scene.codeHighlights.filter(
                  (ch) =>
                    ch.codeLine !== undefined &&
                    ch.codeText !== undefined &&
                    ch.annotationType !== undefined,
                );
              }
            }
          }

          structureOutput = ScriptOutputSchema.parse(parsed);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < MAX_RETRIES - 1) {
            spinner.text = chalk.yellow(
              `  Retrying structure... (${attempt + 1}/${MAX_RETRIES})`,
            );
          }
        }
      }

      if (!structureOutput) {
        workflowStateManager.failStep("script", lastError?.message || "Failed");
        workflowStateManager.failWorkflow(
          "Script generation failed after retries",
        );
        spinner.fail("Failed to parse script structure");
        throw (
          lastError || new Error("Structure generation failed after retries")
        );
      }

      // ========================================
      // Skip visual layers generation - handled by separate Visual Agent
      // ========================================

      const scriptOutput: ScriptOutput = {
        title: structureOutput.title,
        totalDuration: structureOutput.totalDuration,
        scenes: structureOutput.scenes,
      };

      spinner.text = "📝 Processing script output...";

      // Save script output
      const scriptPath = join(outputDir, "script.json");
      writeFileSync(scriptPath, JSON.stringify(scriptOutput, null, 2));
      workflowStateManager.completeStep("script", { scriptPath });

      spinner.text = "📝 Processing script output...";
      spinner.succeed("✅ Script generated!");

      console.log(chalk.green("\n🎬 Script Output:\n"));
      console.log(chalk.bold("  Title: " + scriptOutput.title));
      console.log(chalk.gray("  Scenes: " + scriptOutput.scenes.length));

      const state = workflowStateManager.getState();
      if (state) {
        console.log(chalk.blue("\n📁 Output directory: " + outputDir));
        console.log(
          chalk.gray(
            "\nRun `video-script resume` to continue or `video-script screenshot " +
              outputDir +
              "` followed by `video-script compose " +
              outputDir +
              "`",
          ),
        );
      }

      // Check if we should continue to Phase 2
      if (options.noReview) {
        console.log(
          chalk.blue("\n▶️  Continuing to Phase 2 (screenshot + compose)..."),
        );
        // Continue to screenshot and compose phases
        await runScreenshotAndCompose(outputDir, spinner);
      } else {
        console.log(
          chalk.blue(
            "\n⏸️  Workflow paused. Run `video-script resume` to continue.",
          ),
        );
        workflowStateManager.suspendWorkflow();
      }
    } catch (error) {
      spinner.fail("❌ Create workflow failed");
      workflowStateManager.failWorkflow(
        error instanceof Error ? error.message : String(error),
      );
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

// Helper function to run screenshot and compose phases
async function runScreenshotAndCompose(
  outputDir: string,
  spinner: ReturnType<typeof ora>,
): Promise<void> {
  const scriptPath = join(outputDir, "script.json");
  const screenshotsDir = join(outputDir, "screenshots");

  if (!existsSync(scriptPath)) {
    throw new Error("script.json not found. Run 'video-script create' first.");
  }

  const scriptContent = readFileSync(scriptPath, "utf-8");
  const script: ScriptOutput = ScriptOutputSchema.parse(
    JSON.parse(scriptContent),
  );

  if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir, { recursive: true });
  }

  // Phase 2: Screenshot
  spinner.start("📸 Running screenshot agent...");
  workflowStateManager.startStep("screenshot");

  // Build a URL map from research.json to give the screenshot agent concrete URLs
  const researchPath = join(outputDir, "research.json");
  let researchSourceUrls: string[] = [];
  if (existsSync(researchPath)) {
    try {
      const researchData = JSON.parse(readFileSync(researchPath, "utf-8")) as {
        segments?: Array<{ links?: Array<{ url: string }> }>;
      };
      const urlSet = new Set<string>();
      researchData.segments?.forEach((seg) => {
        seg.links?.forEach((l) => {
          if (l.url && !l.url.includes("example.com")) urlSet.add(l.url);
        });
      });
      researchSourceUrls = Array.from(urlSet);
    } catch {
      // research.json is optional
    }
  }

  const screenshotInstructions =
    researchSourceUrls.length > 0
      ? `For each scene with type "feature" or "code", capture a webpage screenshot using the playwrightScreenshot tool. ` +
        `Use the most relevant URL from the source list below based on the scene title/narration.\n\n` +
        `Source URLs:\n${researchSourceUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}\n\n` +
        `For scenes with type "intro" or "outro", skip screenshot capture.\n` +
        `Save files as scene-001.png, scene-002.png, etc. (matching scene order, including skipped scenes).`
      : `For each scene with type "feature" or "code", capture a webpage screenshot using the playwrightScreenshot tool. ` +
        `Use the URL from the scene's sourceRef field if available, or search for a relevant page based on the scene title.\n` +
        `For scenes with type "intro" or "outro", skip screenshot capture.\n` +
        `Save files as scene-001.png, scene-002.png, etc. (matching scene order, including skipped scenes).`;

  const screenshotResult = await screenshotAgent.generate([
    {
      role: "user",
      content:
        "Process the following script and generate screenshots for each scene.\n\nScript:\n" +
        JSON.stringify(script, null, 2) +
        "\n\nOutput directory: " +
        screenshotsDir +
        "\n\n" +
        screenshotInstructions +
        '\n\nReturn a JSON object with the list of captured screenshots:\n{\n  "screenshots": [\n    { "sceneOrder": 1, "filename": "scene-001.png", "success": true }\n  ]\n}',
    },
  ]);

  interface ScreenshotResult {
    screenshots: Array<{
      sceneOrder: number;
      filename: string;
      success: boolean;
      error?: string;
    }>;
  }

  let screenshotData: ScreenshotResult;
  try {
    const textContent =
      typeof screenshotResult.text === "string"
        ? screenshotResult.text
        : JSON.stringify(screenshotResult.text);

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      screenshotData = {
        screenshots: script.scenes.map((_scene, index) => ({
          sceneOrder: index + 1,
          filename: "scene-" + String(index + 1).padStart(3, "0") + ".png",
          success: true,
        })),
      };
    } else {
      screenshotData = JSON.parse(jsonMatch[0]);
    }
  } catch {
    screenshotData = {
      screenshots: script.scenes.map((_scene, index) => ({
        sceneOrder: index + 1,
        filename: "scene-" + String(index + 1).padStart(3, "0") + ".png",
        success: true,
      })),
    };
  }

  workflowStateManager.completeStep("screenshot", {
    screenshotsDir,
    screenshotCount: screenshotData.screenshots.length,
  });
  spinner.succeed("✅ Screenshots captured!");

  // Phase 2: Compose
  spinner.start("🎬 Rendering video...");
  workflowStateManager.startStep("compose");

  // Auto-inject screenshot visualLayers for scenes that have no visual content.
  // When script.json has no visualLayers, fall back to mapping screenshots/scene-001.png etc.
  const finalScenes2 = script.scenes.map((scene, sceneIndex) => {
    if (!scene.visualLayers || scene.visualLayers.length === 0) {
      const screenshotPath = findScreenshotFile(
        screenshotsDir,
        sceneIndex,
        "bg",
      );
      if (screenshotPath) {
        return {
          ...scene,
          visualLayers: [
            {
              id: "bg",
              type: "screenshot" as const,
              position: {
                x: "center" as const,
                y: "center" as const,
                width: "full" as const,
                height: "full" as const,
                zIndex: 0,
              },
              content: screenshotPath,
              animation: {
                enter: "fadeIn" as const,
                enterDelay: 0,
                exit: "none" as const,
              },
            },
          ],
        };
      }
    }
    return scene;
  });

  const images: Record<string, string> = {};
  finalScenes2.forEach((scene, sceneIndex) => {
    scene.visualLayers?.forEach((layer) => {
      if (layer.type === "screenshot" || layer.type === "code") {
        const filepath = findScreenshotFile(
          screenshotsDir,
          sceneIndex,
          layer.id,
        );
        if (filepath) {
          images[`${scene.id}-${layer.id}`] = `file://${resolve(filepath)}`;
        }
      }
    });
  });

  const srtPath = join(outputDir, "output.srt");

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
        totalDuration: script.scenes.reduce((sum, s) => sum + s.duration, 0),
        scenes: finalScenes2.map((scene) => ({
          id: scene.id,
          type: scene.type,
          title: scene.title,
          narration: scene.narration,
          duration: scene.duration,
          ...(scene.visualLayers !== undefined && {
            visualLayers: scene.visualLayers,
          }),
          ...(scene.transition !== undefined && {
            transition: scene.transition,
          }),
        })),
      },
      images,
      outputDir,
      srtOutputPath: srtPath,
    },
    { onProgress },
  );

  if (!videoResult.success) {
    workflowStateManager.failStep(
      "compose",
      videoResult.error ?? "Render failed",
    );
    workflowStateManager.failWorkflow("Video rendering failed");
    throw new Error(videoResult.error ?? "Video rendering failed");
  }

  workflowStateManager.completeStep("compose", {
    videoPath: videoResult.videoPath,
    srtPath,
  });
  workflowStateManager.completeWorkflow({ outputDir });

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
}

// Resume command
program
  .command("resume [runId]")
  .description("Resume a suspended workflow")
  .action(async (runId) => {
    const spinner = ora();
    gracefulShutdown.setSpinner(spinner);

    try {
      // Try to load existing workflow state
      const state = workflowStateManager.load();

      if (!state) {
        if (runId) {
          spinner.fail(`Workflow ${runId} not found`);
        } else {
          spinner.fail(
            "No workflow state found. Run 'video-script create' first.",
          );
        }
        process.exit(1);
      }

      if (state.status !== "suspended" && state.status !== "failed") {
        console.log(chalk.blue("\n📊 Workflow Status: " + state.status));
        console.log(chalk.gray("  Run ID: " + state.runId));
        console.log(chalk.gray("  Created: " + state.createdAt));

        const progress = workflowStateManager.getProgress();
        console.log(
          chalk.gray(
            `  Progress: ${progress.completed}/${progress.total} steps`,
          ),
        );

        if (state.status === "completed") {
          console.log(chalk.green("\n✅ Workflow already completed!"));
          console.log(
            chalk.gray(
              "  Output: " +
                (state.output as Record<string, unknown>)?.outputDir,
            ),
          );
        }
        process.exit(0);
      }

      console.log(chalk.blue("\n▶️  Resuming workflow..."));
      console.log(chalk.gray("  Run ID: " + state.runId));
      console.log(
        chalk.gray(
          "  Title: " + (state.input as Record<string, unknown>)?.title,
        ),
      );
      console.log(
        chalk.gray(
          "  Output: " + (state.input as Record<string, unknown>)?.outputDir,
        ),
      );

      // Determine where to resume based on completed steps
      const outputDir = (state.input as Record<string, unknown>)
        ?.outputDir as string;

      if (!outputDir || !existsSync(outputDir)) {
        spinner.fail(
          "Output directory not found. Workflow state may be corrupted.",
        );
        process.exit(1);
      }

      // Find the next step to run
      const scriptPath = join(outputDir, "script.json");
      const screenshotsDir = join(outputDir, "screenshots");

      if (!existsSync(scriptPath)) {
        spinner.fail("script.json not found. Run 'video-script create' first.");
        process.exit(1);
      }

      const scriptContent = readFileSync(scriptPath, "utf-8");
      const script: ScriptOutput = ScriptOutputSchema.parse(
        JSON.parse(scriptContent),
      );

      // Resume from screenshot if script exists, or compose if screenshots exist
      let needsScreenshot = !existsSync(join(screenshotsDir, "scene-001.png"));

      // Check if we have screenshots
      if (existsSync(screenshotsDir)) {
        const files = readdirSync(screenshotsDir);
        needsScreenshot = !files.some(
          (f: string) => f.startsWith("scene-") && f.endsWith(".png"),
        );
      }

      if (needsScreenshot) {
        // Run screenshot phase
        spinner.start("📸 Running screenshot agent...");
        workflowStateManager.startStep("screenshot");

        if (!existsSync(screenshotsDir)) {
          mkdirSync(screenshotsDir, { recursive: true });
        }

        // Build a URL map from research.json to give the screenshot agent concrete URLs
        const researchPathResume = join(outputDir, "research.json");
        let resumeSourceUrls: string[] = [];
        if (existsSync(researchPathResume)) {
          try {
            const researchData = JSON.parse(
              readFileSync(researchPathResume, "utf-8"),
            ) as { segments?: Array<{ links?: Array<{ url: string }> }> };
            const urlSet = new Set<string>();
            researchData.segments?.forEach((seg) => {
              seg.links?.forEach((l) => {
                if (l.url && !l.url.includes("example.com")) urlSet.add(l.url);
              });
            });
            resumeSourceUrls = Array.from(urlSet);
          } catch {
            // research.json is optional
          }
        }

        const resumeScreenshotInstructions =
          resumeSourceUrls.length > 0
            ? `For each scene with type "feature" or "code", capture a webpage screenshot using the playwrightScreenshot tool. ` +
              `Use the most relevant URL from the source list below based on the scene title/narration.\n\n` +
              `Source URLs:\n${resumeSourceUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}\n\n` +
              `For scenes with type "intro" or "outro", skip screenshot capture.\n` +
              `Save files as scene-001.png, scene-002.png, etc. (matching scene order, including skipped scenes).`
            : `For each scene with type "feature" or "code", capture a webpage screenshot using the playwrightScreenshot tool. ` +
              `Use the URL from the scene's sourceRef field if available, or search for a relevant page based on the scene title.\n` +
              `For scenes with type "intro" or "outro", skip screenshot capture.\n` +
              `Save files as scene-001.png, scene-002.png, etc. (matching scene order, including skipped scenes).`;

        const screenshotResult = await screenshotAgent.generate([
          {
            role: "user",
            content:
              "Process the following script and generate screenshots for each scene.\n\nScript:\n" +
              JSON.stringify(script, null, 2) +
              "\n\nOutput directory: " +
              screenshotsDir +
              "\n\n" +
              resumeScreenshotInstructions +
              '\n\nReturn a JSON object with the list of captured screenshots:\n{\n  "screenshots": [\n    { "sceneOrder": 1, "filename": "scene-001.png", "success": true }\n  ]\n}',
          },
        ]);

        interface ScreenshotResult {
          screenshots: Array<{
            sceneOrder: number;
            filename: string;
            success: boolean;
            error?: string;
          }>;
        }

        let screenshotData: ScreenshotResult;
        try {
          const textContent =
            typeof screenshotResult.text === "string"
              ? screenshotResult.text
              : JSON.stringify(screenshotResult.text);

          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            screenshotData = {
              screenshots: script.scenes.map((_scene, index) => ({
                sceneOrder: index + 1,
                filename:
                  "scene-" + String(index + 1).padStart(3, "0") + ".png",
                success: true,
              })),
            };
          } else {
            screenshotData = JSON.parse(jsonMatch[0]);
          }
        } catch {
          screenshotData = {
            screenshots: script.scenes.map((_scene, index) => ({
              sceneOrder: index + 1,
              filename: "scene-" + String(index + 1).padStart(3, "0") + ".png",
              success: true,
            })),
          };
        }

        workflowStateManager.completeStep("screenshot", {
          screenshotsDir,
          screenshotCount: screenshotData.screenshots.length,
        });
        spinner.succeed("✅ Screenshots captured!");
      }

      // Run compose phase
      spinner.start("🎬 Rendering video...");
      workflowStateManager.startStep("compose");

      // Auto-inject screenshot visualLayers for scenes that have no visual content.
      const finalScenes3 = script.scenes.map((scene, sceneIndex) => {
        if (!scene.visualLayers || scene.visualLayers.length === 0) {
          const screenshotPath = findScreenshotFile(
            screenshotsDir,
            sceneIndex,
            "bg",
          );
          if (screenshotPath) {
            return {
              ...scene,
              visualLayers: [
                {
                  id: "bg",
                  type: "screenshot" as const,
                  position: {
                    x: "center" as const,
                    y: "center" as const,
                    width: "full" as const,
                    height: "full" as const,
                    zIndex: 0,
                  },
                  content: screenshotPath,
                  animation: {
                    enter: "fadeIn" as const,
                    enterDelay: 0,
                    exit: "none" as const,
                  },
                },
              ],
            };
          }
        }
        return scene;
      });

      const images: Record<string, string> = {};
      finalScenes3.forEach((scene, sceneIndex) => {
        scene.visualLayers?.forEach((layer) => {
          if (layer.type === "screenshot" || layer.type === "code") {
            const filepath = findScreenshotFile(
              screenshotsDir,
              sceneIndex,
              layer.id,
            );
            if (filepath) {
              images[`${scene.id}-${layer.id}`] = filepath;
            }
          }
        });
      });

      const srtPath = join(outputDir, "output.srt");

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
            scenes: finalScenes3.map((scene) => ({
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
          images,
          outputDir,
          srtOutputPath: srtPath,
        },
        { onProgress },
      );

      if (!videoResult.success) {
        workflowStateManager.failStep(
          "compose",
          videoResult.error ?? "Render failed",
        );
        workflowStateManager.failWorkflow("Video rendering failed");
        throw new Error(videoResult.error ?? "Video rendering failed");
      }

      workflowStateManager.completeStep("compose", {
        videoPath: videoResult.videoPath,
        srtPath,
      });
      workflowStateManager.completeWorkflow({ outputDir });

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
      spinner.fail("❌ Resume workflow failed");
      workflowStateManager.failWorkflow(
        error instanceof Error ? error.message : String(error),
      );
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

(async () => {
  await workspace.init();
  program.parse();
})().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(
    "\n\u274c Failed to initialize: " +
      (err instanceof Error ? err.message : String(err)) +
      "\n",
  );
  process.exit(1);
});
