import inquirer from "inquirer";
import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";
import { copyFile, mkdir } from "fs/promises";
import { basename, join } from "path";
import type { ScriptOutput, Scene } from "../types/index.js";

const execAsync = promisify(exec);

const SCENE_TYPE_ICONS: Record<string, string> = {
  intro: "🎬",
  feature: "📷",
  code: "💻",
  outro: "🎬",
};

function printSceneSummary(scene: Scene, index: number, total: number): void {
  const icon = SCENE_TYPE_ICONS[scene.type] ?? "📄";
  console.log(
    chalk.blue(
      `\n${icon} Scene ${index + 1}/${total}: ${chalk.bold(scene.title)}`,
    ),
  );
  console.log(
    chalk.gray(`   Type: ${scene.type} | Duration: ${scene.duration}s`),
  );
  if (scene.visualType) {
    console.log(chalk.gray(`   Visual: ${scene.visualType}`));
  }
  if (scene.visualContent) {
    const preview = scene.visualContent.substring(0, 80);
    console.log(
      chalk.gray(
        `   Content: ${preview}${scene.visualContent.length > 80 ? "..." : ""}`,
      ),
    );
  }
  console.log(chalk.white(`\n   Narration:\n   "${scene.narration}"`));
}

async function promptSceneAction(): Promise<{
  action: "approve" | "edit_narration" | "edit_visual" | "skip";
}> {
  return inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do with this scene?",
      choices: [
        { name: "✅ Approve", value: "approve" },
        { name: "✏️  Edit narration", value: "edit_narration" },
        { name: "🖼️  Edit visual instructions", value: "edit_visual" },
        { name: "⏭️  Skip (keep as-is)", value: "skip" },
      ],
      default: "approve",
    },
  ]);
}

async function editNarration(scene: Scene): Promise<string> {
  const result = await inquirer.prompt([
    {
      type: "editor",
      name: "narration",
      message: "Edit narration (opens in editor):",
      default: scene.narration,
      postfix: ".txt",
    },
  ]);
  return (result.narration as string).trim();
}

async function editVisualContent(scene: Scene): Promise<string> {
  const result = await inquirer.prompt([
    {
      type: "editor",
      name: "visual",
      message: "Edit visual instructions (opens in editor):",
      default: scene.visualContent ?? "",
      postfix: ".txt",
    },
  ]);
  return (result.visual as string).trim();
}

export async function reviewScript(
  script: ScriptOutput,
): Promise<ScriptOutput> {
  console.log(chalk.blue("\n📝 Script Review\n"));
  console.log(chalk.bold(`Title: ${script.title}`));
  console.log(
    chalk.gray(
      `Total duration: ${Math.round(script.totalDuration)}s | Scenes: ${script.scenes.length}`,
    ),
  );
  console.log(
    chalk.yellow("\nReview each scene below. Press Enter to navigate.\n"),
  );

  const editedScenes: Scene[] = [];

  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i] as Scene;
    printSceneSummary(scene, i, script.scenes.length);

    const { action } = await promptSceneAction();

    if (action === "edit_narration") {
      const narration = await editNarration(scene);
      editedScenes.push({ ...scene, narration });
      console.log(chalk.green("  ✓ Narration updated"));
    } else if (action === "edit_visual") {
      const visualContent = await editVisualContent(scene);
      editedScenes.push({ ...scene, visualContent });
      console.log(chalk.green("  ✓ Visual instructions updated"));
    } else {
      editedScenes.push(scene);
      if (action === "approve") {
        console.log(chalk.green("  ✓ Approved"));
      }
    }
  }

  const { finalAction } = await inquirer.prompt([
    {
      type: "list",
      name: "finalAction",
      message: "\nReview complete. What would you like to do?",
      choices: [
        { name: "✅ Proceed with this script", value: "proceed" },
        { name: "❌ Cancel", value: "cancel" },
      ],
      default: "proceed",
    },
  ]);

  if (finalAction === "cancel") {
    console.log(chalk.yellow("\nScript review cancelled."));
    process.exit(0);
  }

  return { ...script, scenes: editedScenes };
}

export interface VideoReviewResult {
  accepted: boolean;
  finalPath?: string;
  rerender?: boolean;
}

export async function reviewVideo(
  videoPath: string,
  outputDir: string,
): Promise<VideoReviewResult> {
  console.log(chalk.blue("\n🎥 Video Review\n"));
  console.log(chalk.gray(`Video: ${videoPath}`));

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: "▶️  Preview in system player", value: "preview" },
        { name: "✅ Accept and save to output", value: "accept" },
        { name: "🔄 Re-render (use current settings)", value: "rerender" },
        { name: "❌ Discard", value: "discard" },
      ],
      default: "preview",
    },
  ]);

  if (action === "preview") {
    const platform = process.platform;
    const openCmd =
      platform === "darwin"
        ? "open"
        : platform === "win32"
          ? "start"
          : "xdg-open";
    try {
      await execAsync(`${openCmd} "${videoPath}"`);
    } catch {
      console.log(
        chalk.yellow(`  Could not open player. Video is at: ${videoPath}`),
      );
    }

    const { afterPreview } = await inquirer.prompt([
      {
        type: "list",
        name: "afterPreview",
        message: "After preview, what would you like to do?",
        choices: [
          { name: "✅ Accept and save to output", value: "accept" },
          { name: "🔄 Re-render", value: "rerender" },
          { name: "❌ Discard", value: "discard" },
        ],
        default: "accept",
      },
    ]);

    return handleVideoAction(afterPreview as string, videoPath, outputDir);
  }

  return handleVideoAction(action as string, videoPath, outputDir);
}

async function handleVideoAction(
  action: string,
  videoPath: string,
  outputDir: string,
): Promise<VideoReviewResult> {
  if (action === "accept") {
    const finalDir = join(outputDir, "final");
    await mkdir(finalDir, { recursive: true });
    const finalPath = join(finalDir, basename(videoPath));
    await copyFile(videoPath, finalPath);
    console.log(chalk.green(`\n✅ Video saved to: ${finalPath}`));
    const srtPath = videoPath.replace(/\.mp4$/, ".srt");
    const finalSrtPath = join(finalDir, basename(srtPath));
    try {
      await copyFile(srtPath, finalSrtPath);
      console.log(chalk.green(`✅ Subtitles saved to: ${finalSrtPath}`));
    } catch {
      // SRT may not exist
    }
    return { accepted: true, finalPath };
  }

  if (action === "rerender") {
    console.log(chalk.blue("\n🔄 Preparing to re-render..."));
    return { accepted: false, rerender: true };
  }

  console.log(chalk.yellow("\nVideo discarded."));
  return { accepted: false };
}
