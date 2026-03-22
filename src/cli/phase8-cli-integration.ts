/**
 * Phase 8: CLI Integration
 *
 * 新增功能：
 * 1. Research 输出 Markdown 文件
 * 2. 等待用户确认后继续
 * 3. --edit-research 标志
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import chalk from "chalk";
import ora from "ora";
import * as readline from "readline";

/**
 * 等待用户确认
 */
export async function waitForUserConfirmation(
  message: string,
): Promise<"continue" | "edit" | "abort"> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(chalk.yellow(message));
    console.log(chalk.gray("  Press Enter to continue, 'e' to edit, 'q' to quit"));

    rl.question("", (answer) => {
      rl.close();
      const input = answer.trim().toLowerCase();

      if (input === "q" || input === "quit" || input === "abort") {
        resolve("abort");
      } else if (input === "e" || input === "edit") {
        resolve("edit");
      } else {
        resolve("continue");
      }
    });
  });
}

/**
 * 保存 Research 为 Markdown 文件
 */
export function saveResearchMarkdown(
  outputDir: string,
  title: string,
  content: string,
): string {
  const mdPath = join(outputDir, "research.md");
  writeFileSync(mdPath, content, "utf-8");
  return mdPath;
}

/**
 * 读取并解析 Research Markdown
 */
export function loadResearchMarkdown(outputDir: string): string | null {
  const mdPath = join(outputDir, "research.md");
  if (!existsSync(mdPath)) {
    return null;
  }
  return readFileSync(mdPath, "utf-8");
}

/**
 * 将 Research Markdown 转换为 JSON 格式（兼容旧流程）
 */
export function convertResearchMdToJson(md: string): {
  title: string;
  segments: Array<{
    order: number;
    sentence: string;
    keyContent: Record<string, string>;
    links: Array<{ url: string; key: string }>;
  }>;
} {
  const lines = md.split("\n");
  let title = "";
  const segments: Array<{
    order: number;
    sentence: string;
    keyContent: Record<string, string>;
    links: Array<{ url: string; key: string }>;
  }> = [];

  // 简单解析：提取标题和段落
  let currentSegment:
    | {
        order: number;
        sentence: string;
        keyContent: Record<string, string>;
        links: Array<{ url: string; key: string }>;
      }
    | null = null;
  let order = 1;

  for (const line of lines) {
    // 标题
    if (line.startsWith("# ") && !title) {
      title = line.slice(2).trim();
      continue;
    }

    // 二级或三级标题（作为段落开始）
    if (line.startsWith("## ") || line.startsWith("### ")) {
      if (currentSegment) {
        segments.push(currentSegment);
      }

      const heading = line.replace(/^#+\s+/, "").replace(/\[priority:.*?\]/, "").trim();
      currentSegment = {
        order: order++,
        sentence: heading,
        keyContent: { concept: heading },
        links: [],
      };
      continue;
    }

    // 来源链接
    const sourceMatch = line.match(/^\[(\d+)\]\s+(.+?)\s*-\s*(https?:\/\/.+)$/);
    if (sourceMatch && currentSegment) {
      currentSegment.links.push({
        key: sourceMatch[2].trim(),
        url: sourceMatch[3].trim(),
      });
    }

    // 行内链接引用
    const inlineLink = line.match(/\[(\d+)\]\s*(https?:\/\/[^\s]+)/);
    if (inlineLink && currentSegment) {
      currentSegment.links.push({
        key: `Source ${inlineLink[1]}`,
        url: inlineLink[2],
      });
    }
  }

  // 添加最后一个段落
  if (currentSegment) {
    segments.push(currentSegment);
  }

  return { title, segments };
}

/**
 * 检查是否应该使用新的 Markdown 流程
 */
export function shouldUseMarkdownFlow(options: {
  editResearch?: boolean;
  skipConfirm?: boolean;
}): boolean {
  // 如果用户明确要求编辑 research，使用 MD 流程
  // 如果用户要求跳过确认，使用旧流程
  return options.editResearch === true || options.skipConfirm !== true;
}

/**
 * 输出 Research 完成信息
 */
export function displayResearchComplete(
  mdPath: string,
  jsonPath: string,
): void {
  console.log(chalk.green("\n✅ Research completed!\n"));
  console.log(chalk.gray("  Output files:"));
  console.log(chalk.cyan(`    📄 ${mdPath}`));
  console.log(chalk.gray(`    📋 ${jsonPath}`));
  console.log("");
  console.log(chalk.yellow("  You can edit the Markdown file to refine the content."));
  console.log(chalk.gray("  Priority tags: [priority: essential|important|supporting|skip]"));
  console.log("");
}
