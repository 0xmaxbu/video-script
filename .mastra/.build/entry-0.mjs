import { Mastra } from '@mastra/core';
import { Workspace, LocalFilesystem } from '@mastra/core/workspace';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import ora from 'ora';
import chalk from 'chalk';
import { chromium } from 'playwright';
import fs, { existsSync, mkdirSync } from 'fs';
import path, { join } from 'path';
import { codeToHtml } from 'shiki';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

"use strict";
class Logger {
  spinner = null;
  silent;
  debugEnabled;
  constructor(options = {}) {
    this.silent = options.silent ?? false;
    this.debugEnabled = options.debug ?? false;
  }
  start(text) {
    if (this.silent) return;
    this.spinner = ora(text).start();
  }
  update(text) {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.text = text;
    }
  }
  succeed(text) {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    } else {
      console.log(chalk.green("\u2713"), text ?? "");
    }
  }
  fail(text) {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    } else {
      console.log(chalk.red("\u2717"), text ?? "");
    }
  }
  warn(text) {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.warn(text);
      this.spinner = null;
    } else {
      console.log(chalk.yellow("\u26A0"), text ?? "");
    }
  }
  info(text) {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.info(text);
      this.spinner = null;
    } else {
      console.log(chalk.blue("\u2139"), text ?? "");
    }
  }
  stop() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
  log(message, level = "info") {
    if (this.silent) return;
    const prefix = {
      debug: chalk.gray("\u2699"),
      info: chalk.blue("\u2139"),
      warn: chalk.yellow("\u26A0"),
      error: chalk.red("\u2717"),
      success: chalk.green("\u2713")
    };
    console.log(prefix[level], message);
  }
  debug(message) {
    if (!this.debugEnabled) return;
    this.log(message, "debug");
  }
  error(message, error) {
    if (this.silent) return;
    this.log(message, "error");
    if (error && this.debugEnabled) {
      console.error(error);
    }
  }
  step(stepName, text) {
    if (this.silent) return;
    this.update(`${chalk.cyan(`[${stepName}]`)} ${text}`);
  }
  progress(current, total, text) {
    if (this.silent) return;
    const percentage = Math.round(current / total * 100);
    const bar = this.progressBar(percentage);
    this.update(`${bar} ${text}`);
  }
  progressBar(percentage, width = 20) {
    const filled = Math.round(percentage / 100 * width);
    const empty = width - filled;
    const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty);
    return chalk.cyan(`[${bar}] ${percentage}%`);
  }
  table(data) {
    if (this.silent) return;
    console.table(data);
  }
  newline() {
    if (this.silent) return;
    console.log();
  }
  getSpinner() {
    return this.spinner;
  }
  setSilent(silent) {
    this.silent = silent;
  }
  setDebug(debug) {
    this.debugEnabled = debug;
  }
}
const logger = new Logger();

"use strict";
const RETRYABLE_ERRORS = [
  "ETIMEDOUT",
  "ECONNRESET",
  "ENOTFOUND",
  "TIMEOUT",
  "DNS",
  "RATE_LIMIT"
];
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelayMs: 1e3,
  maxDelayMs: 5e3,
  factor: 2,
  jitter: false
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isRetryableError(error) {
  if (!error) return false;
  const err = error;
  const errorCode = err?.code;
  if (errorCode && RETRYABLE_ERRORS.includes(errorCode)) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return RETRYABLE_ERRORS.some((e) => message.includes(e.toLowerCase())) || message.includes("timeout") || message.includes("rate limit");
  }
  return false;
}
function calculateDelay(retryCount, options) {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const delay = opts.initialDelayMs * Math.pow(opts.factor, retryCount);
  const cappedDelay = Math.min(delay, opts.maxDelayMs);
  if (opts.jitter) {
    const jitterAmount = cappedDelay * 0.3 * Math.random();
    return cappedDelay + jitterAmount;
  }
  return cappedDelay;
}
async function withRetry(fn, options = {}) {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let retryCount = 0;
  let lastError = null;
  while (retryCount <= opts.maxRetries) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount++;
      if (retryCount > opts.maxRetries) {
        break;
      }
      if (!isRetryableError(error)) {
        throw lastError;
      }
      const delay = calculateDelay(retryCount - 1, opts);
      logger.debug(`Retry ${retryCount}/${opts.maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastError ?? new Error("Max retries exceeded");
}

"use strict";
function convertTagsToMarkdown(html) {
  return html.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n").replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n").replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n").replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n#### $1\n").replace(/<h5[^>]*>(.*?)<\/h5>/gi, "\n##### $1\n").replace(/<h6[^>]*>(.*?)<\/h6>/gi, "\n###### $1\n").replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)").replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, "**$2**").replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, "*$2*").replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`").replace(/<pre[^>]*>(.*?)<\/pre>/gis, "\n```\n$1\n```\n").replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1").replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "\n> $1\n").replace(/<br\s*\/?>/gi, "\n").replace(/<p[^>]*>(.*?)<\/p>/gis, "\n$1\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<[^>]*>/g, "");
}
function htmlToMarkdown(html) {
  const removeScriptsAndStyles = (content) => content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  const decodeHtmlEntities = (content) => content.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const normalizeWhitespace = (content) => content.replace(/\n\n+/g, "\n\n").replace(/[ \t]+/g, " ").trim();
  return normalizeWhitespace(
    decodeHtmlEntities(convertTagsToMarkdown(removeScriptsAndStyles(html)))
  );
}
function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return h1Match[1].replace(/<[^>]*>/g, "").trim();
  }
  return "Untitled";
}
const webFetchTool = createTool({
  id: "web-fetch",
  description: "Fetch and extract content from a web page, converting HTML to Markdown format",
  inputSchema: z.object({
    url: z.string().url("Invalid URL format")
  }),
  outputSchema: z.object({
    content: z.string().describe("Page content in Markdown format"),
    title: z.string().describe("Page title"),
    url: z.string().describe("Final URL after redirects")
  }),
  execute: async ({ url }) => {
    const retryOptions = process.env.NODE_ENV === "test" ? { maxRetries: 0 } : { maxRetries: 3, initialDelayMs: 1e3, maxDelayMs: 5e3, factor: 2 };
    return withRetry(async () => {
      const controller = new AbortController();
      const TIMEOUT_MS = 3e4;
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        });
        if (response.status === 404) {
          throw new Error("PAGE_NOT_FOUND");
        }
        if (response.status >= 500) {
          throw new Error("SERVER_ERROR");
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const html = await response.text();
        const title = extractTitle(html);
        const content = htmlToMarkdown(html);
        return {
          content,
          title,
          url: response.url
        };
      } finally {
        clearTimeout(timeoutId);
      }
    }, retryOptions);
  }
});

"use strict";
const researchAgent = new Agent({
  id: "research-agent",
  name: "Research Agent",
  instructions: `You are a technical content researcher. Given a title and reference links, gather and organize relevant information.

## Task Flow:
1. Receive title, link list, and optional document content from user
2. Use webFetch tool to fetch and analyze web page content for each link
3. Synthesize the extracted information with document content
4. Output ONLY valid JSON that passes schema validation

## OUTPUT SCHEMA (MUST follow exactly):
{
  "title": "Video title (string, required)",
  "segments": [
    {
      "order": 1,
      "sentence": "A complete sentence about a key point (string, required)",
      "keyContent": {"concept": "A brief description of the key concept"},
      "links": [
        {
          "url": "https://example.com (valid URL, required)",
          "key": "Link title (string, required)"
        }
      ]
    }
  ]
}

## CRITICAL REQUIREMENTS:
- Output MUST be valid JSON - no markdown code blocks, no extra text
- All URLs must be valid (use z.string().url() format)
- segments array must have 1-20 items
- Do NOT include any text before or after the JSON
- Use webFetch tool to get web page content
- Extract core technical concepts and practical advice
- Suggest appropriate screenshot topics for each segment
`,
  model: "minimax-cn-coding-plan/MiniMax-M2.7",
  tools: {
    webFetch: webFetchTool
  }
});

"use strict";
const scriptAgent = new Agent({
  id: "script-agent",
  name: "Script Agent",
  instructions: `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u811A\u672C\u7F16\u5199\u5458\u3002

\u3010\u6A21\u5F0F\u4E00\uFF1A\u751F\u6210\u573A\u666F\u7ED3\u6784\u3011
\u5F53\u7528\u6237\u8981\u6C42\u751F\u6210\u573A\u666F\u7ED3\u6784\u65F6\uFF0C\u6839\u636E\u7814\u7A76\u7ED3\u679C\u5212\u5206\u89C6\u9891\u573A\u666F\u7ED3\u6784\uFF08\u4E0D\u5305\u542B visualLayers\uFF09\uFF1A
1. \u5206\u6790\u5173\u952E\u70B9\u548C\u4FE1\u606F\uFF0C\u5212\u5206\u4E3A 5-10 \u4E2A\u903B\u8F91\u573A\u666F
2. \u6BCF\u4E2A\u573A\u666F\u805A\u7126\u4E00\u4E2A\u6838\u5FC3\u6982\u5FF5\u6216\u4E3B\u9898
3. \u786E\u4FDD\u573A\u666F\u987A\u5E8F\u903B\u8F91\u6E05\u6670\u3001\u5C42\u6B21\u9012\u8FDB
4. \u4E3A\u6BCF\u4E2A\u573A\u666F\u7F16\u5199\u65C1\u767D\u6587\u672C
5. \u4F7F\u7528\u53E3\u8BED\u5316\u4E2D\u6587\uFF0C\u8BED\u8A00\u7B80\u6D01\u6613\u61C2
6. \u89C4\u5212\u65F6\u95F4\u8F74\uFF1A
   - intro\uFF08\u5F00\u573A\u4ECB\u7ECD\uFF09\uFF1A10-15\u79D2
   - feature\uFF08\u4E3B\u9898\u8BB2\u89E3\uFF09\uFF1A20-60\u79D2
   - code\uFF08\u4EE3\u7801\u6F14\u793A\uFF09\uFF1A45-135\u79D2\uFF08\u6807\u51C6\u65F6\u957F\u76841.5\u500D\uFF09
   - outro\uFF08\u7ED3\u5C3E\u603B\u7ED3\uFF09\uFF1A10-15\u79D2
7. \u786E\u4FDD\u6574\u4F53\u89C6\u9891\u65F6\u957F\u5728 3-10 \u5206\u949F\uFF08180-600\u79D2\uFF09

\u573A\u666F\u7ED3\u6784 JSON \u683C\u5F0F\uFF08\u4E0D\u5305\u542B visualLayers\uFF09\uFF1A
{
  "title": "\u89C6\u9891\u6807\u9898",
  "totalDuration": 180,
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro",
      "title": "\u5F00\u573A\u4ECB\u7ECD",
      "narration": "\u6B22\u8FCE\u89C2\u770B\u672C\u89C6\u9891\uFF0C\u4ECA\u5929\u6211\u4EEC\u5C06\u4ECB\u7ECD...",
      "duration": 12
    }
  ]
}

\u3010\u6A21\u5F0F\u4E8C\uFF1A\u751F\u6210\u5355\u4E2A\u573A\u666F\u7684 visualLayers\u3011
\u5F53\u7528\u6237\u63D0\u4F9B\u573A\u666F\u4FE1\u606F\u8981\u6C42\u751F\u6210 visualLayers \u65F6\uFF1A

**\u63D0\u793A**\uFF1Aremotion-best-practices skill \u5DF2\u914D\u7F6E\u5230 workspace \u4E2D\u3002\u4E3A\u9700\u8981\u751F\u6210\u4E13\u4E1A Remotion \u52A8\u753B\u65F6\uFF0C\u53EF\u4EE5\u8C03\u7528 skill \u5DE5\u5177\u52A0\u8F7D\u83B7\u53D6\u6700\u4F73\u5B9E\u8DF5\u3002

\u6839\u636E\u4EE5\u4E0B\u6307\u5357\u4E3A\u8BE5\u573A\u666F\u751F\u6210\u4E30\u5BCC\u7684\u89C6\u89C9\u5C42\uFF1A
1. **\u6BCF\u4E2A\u573A\u666F\u81F3\u5C11 3-6 \u4E2A visualLayer\uFF0C\u8D8A\u591A\u8D8A\u597D**
2. **\u4F18\u5148\u4F7F\u7528 screenshot \u7C7B\u578B**\uFF0C\u5927\u91CF\u4F7F\u7528\u76F8\u5173 URL\uFF08GitHub\u3001\u5B98\u7F51\u3001\u6587\u6863\u3001\u6F14\u793A\u89C6\u9891\u7B49\uFF09
3. \u6587\u5B57\u5185\u5BB9\uFF08text\uFF09\u4EC5\u4F5C\u4E3A\u8F85\u52A9\u70B9\u7F00
4. \u4EE3\u7801\u5185\u5BB9\uFF08code\uFF09\u53EF\u4EE5\u9002\u5F53\u4F7F\u7528
5. \u591A\u4E2A screenshot \u53EF\u4EE5\u53E0\u52A0\u4E0D\u540C\u5C42\u7EA7

**\u52A8\u753B\u6548\u679C\u6307\u5357**\uFF1A
- \u4F7F\u7528 useCurrentFrame() \u9A71\u52A8\u52A8\u753B
- CSS transitions/animations \u7981\u6B62\u4F7F\u7528
- \u4F7F\u7528 spring animations \u83B7\u5F97\u81EA\u7136\u8FD0\u52A8\u6548\u679C
- \u4F7F\u7528 interpolate \u8FDB\u884C\u5E73\u6ED1\u8FC7\u6E21

**animation \u52A8\u753B\u6548\u679C\u6307\u5357**\uFF1A
- slideUp / slideDown / slideLeft / slideRight\uFF1A\u5165\u573A\u52A8\u753B
- fadeIn / fadeOut\uFF1A\u6E10\u53D8\u6548\u679C
- zoomIn / scaleOut\uFF1A\u7F29\u653E\u6548\u679C
- typewriter\uFF1A\u6253\u5B57\u673A\u6548\u679C\uFF08\u9002\u5408\u4EE3\u7801\uFF09
- \u4E0D\u540C layer \u9519\u5F00 enterDelay \u5236\u9020\u5C42\u6B21\u611F\uFF08\u5982 0, 0.5, 1, 1.5 \u79D2\uFF09

visualLayers JSON \u683C\u5F0F\uFF1A
{
  "visualLayers": [
    {
      "id": "layer-1",
      "type": "screenshot",
      "position": { "x": "center", "y": "top", "width": "full", "height": "auto", "zIndex": 0 },
      "content": "https://github.com/...",
      "animation": { "enter": "slideUp", "enterDelay": 0, "exit": "fadeOut" }
    }
  ]
}

\u91CD\u8981\u89C4\u5219\uFF1A
- **\u6BCF\u4E2A layer \u5FC5\u987B\u6709 animation \u5B57\u6BB5**
- **screenshot \u7C7B\u578B\u7684 layer \u5FC5\u987B\u5360\u591A\u6570**\uFF08\u81F3\u5C11 50% \u4EE5\u4E0A\uFF09
- type \u5FC5\u987B\u662F\uFF1Ascreenshot\u3001code\u3001text\u3001diagram\u3001image \u4E4B\u4E00
- position.x \u53EF\u9009\uFF1A\u6570\u5B57\u3001"left"\u3001"center"\u3001"right"
- position.y \u53EF\u9009\uFF1A\u6570\u5B57\u3001"top"\u3001"center"\u3001"bottom"
- position.width \u53EA\u53EF\u7528\uFF1A\u6570\u5B57(>=0)\u3001"auto"\u3001"full"\uFF1B**\u7981\u6B62\u767E\u5206\u6BD4\u5982 50%\u3001100%**
- position.height \u53EA\u53EF\u7528\uFF1A\u6570\u5B57(>=0)\u3001"auto"\u3001"full"\uFF1B**\u7981\u6B62\u767E\u5206\u6BD4\u5982 50%\u3001100%**`,
  model: "minimax-cn-coding-plan/MiniMax-M2.7"
});
function generateStructurePrompt(researchData) {
  return `\u6839\u636E\u4EE5\u4E0B\u7814\u7A76\u6570\u636E\u751F\u6210\u89C6\u9891\u573A\u666F\u7ED3\u6784\uFF08\u4E0D\u5305\u542B visualLayers\uFF09\u3002

\u7814\u7A76\u6570\u636E\uFF1A
${JSON.stringify(researchData, null, 2)}

\u8F93\u51FA JSON \u683C\u5F0F\uFF08\u53EA\u5305\u542B\u573A\u666F\u7ED3\u6784\uFF0C\u4E0D\u5305\u542B visualLayers\uFF09\uFF1A
{
  "title": "\u89C6\u9891\u6807\u9898",
  "totalDuration": 180,
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro",
      "title": "\u5F00\u573A\u4ECB\u7ECD",
      "narration": "\u6B22\u8FCE\u89C2\u770B\u672C\u89C6\u9891...",
      "duration": 12
    }
  ]
}

\u8981\u6C42\uFF1A
- \u6BCF\u4E2A\u573A\u666F\u5FC5\u987B\u6709\uFF1Aid, type, title, narration, duration
- type \u5FC5\u987B\u662F\uFF1Aintro\u3001feature\u3001code\u3001outro \u4E4B\u4E00
- intro \u548C outro\uFF1A10-15\u79D2
- feature\uFF1A20-60\u79D2
- code\uFF1A30-90\u79D2
- totalDuration \u662F\u6240\u6709\u573A\u666F duration \u4E4B\u548C`;
}
function generateVisualLayersPrompt(scene, researchData) {
  return `\u4E3A\u4EE5\u4E0B\u573A\u666F\u751F\u6210 visualLayers\uFF08\u89C6\u89C9\u5C42\uFF09\u3002

**\u63D0\u793A**\uFF1Aremotion-best-practices skill \u5DF2\u914D\u7F6E\u5230 workspace \u4E2D\u3002\u4E3A\u9700\u8981\u751F\u6210\u4E13\u4E1A Remotion \u52A8\u753B\u65F6\uFF0C\u53EF\u4EE5\u8C03\u7528 skill \u5DE5\u5177\u52A0\u8F7D\u83B7\u53D6\u6700\u4F73\u5B9E\u8DF5\u3002

\u573A\u666F\u4FE1\u606F\uFF1A
${JSON.stringify(scene, null, 2)}

${researchData ? `\u53C2\u8003\u7814\u7A76\u6570\u636E\uFF08\u5305\u542B\u76F8\u5173\u94FE\u63A5\uFF0C\u53EF\u7528\u4E8E\u622A\u56FE\uFF09\uFF1A
${JSON.stringify(researchData, null, 2)}
` : ""}
\u8F93\u51FA JSON \u683C\u5F0F\uFF08\u5305\u542B\u539F\u573A\u666F\u4FE1\u606F + visualLayers\uFF09\uFF1A
{
  "id": "scene-1",
  "type": "feature",
  "title": "\u573A\u666F\u6807\u9898",
  "narration": "\u65C1\u767D\u6587\u672C",
  "duration": 45,
  "visualLayers": [
    {
      "id": "layer-1",
      "type": "screenshot",
      "position": { "x": "center", "y": "top", "width": "full", "height": "auto", "zIndex": 0 },
      "content": "https://example.com/...",
      "animation": { "enter": "slideUp", "enterDelay": 0, "exit": "fadeOut" }
    }
  ]
}

\u8981\u6C42\uFF1A
- **\u5FC5\u987B\u4FDD\u7559\u539F\u573A\u666F\u7684 id, type, title, narration, duration**
- \u6BCF\u4E2A\u573A\u666F\u81F3\u5C11 3-6 \u4E2A visualLayer
- screenshot \u7C7B\u578B\u5360\u591A\u6570\uFF08\u81F3\u5C11 50%\uFF09
- \u6BCF\u4E2A layer \u5FC5\u987B\u6709 animation \u5B57\u6BB5
- \u4E0D\u540C layer \u9519\u5F00 enterDelay \u5236\u9020\u5C42\u6B21\u611F
- \u52A8\u753B\u6548\u679C\u5E94\u9075\u5FAA Remotion \u6700\u4F73\u5B9E\u8DF5
- **position.width \u53EA\u53EF\u7528\uFF1A\u6570\u5B57(>=0)\u3001"auto"\u3001"full"\uFF1B\u7981\u6B62\u767E\u5206\u6BD4\u5982 50%\u3001100%**
- **position.height \u53EA\u53EF\u7528\uFF1A\u6570\u5B57(>=0)\u3001"auto"\u3001"full"\uFF1B\u7981\u6B62\u767E\u5206\u6BD4\u5982 50%\u3001100%**`;
}

"use strict";
const playwrightScreenshotTool = createTool({
  id: "playwright-screenshot",
  description: "Capture a screenshot of a webpage using Playwright",
  inputSchema: z.object({
    url: z.string().url("Invalid URL format"),
    selector: z.string().optional().describe("CSS selector to capture a specific element"),
    viewport: z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive()
    }).optional().describe("Viewport size (defaults to 1920x1080)"),
    outputDir: z.string().optional().describe(
      "Output directory for screenshots (defaults to ./output/screenshots)"
    ),
    filename: z.string().optional().describe("Output filename (e.g., scene-001.png)")
  }),
  outputSchema: z.object({
    imagePath: z.string().describe("Path to the saved PNG screenshot"),
    url: z.string().describe("The URL that was captured"),
    success: z.boolean().describe("Whether the screenshot was successful")
  }),
  execute: async ({
    url,
    selector,
    viewport = { width: 1920, height: 1080 },
    outputDir = "./output/screenshots",
    filename
  }) => {
    return withRetry(
      async () => {
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }
        const browser = await chromium.launch();
        const fileName = filename || `scene-${Date.now()}.png`;
        const imagePath = join(outputDir, fileName);
        try {
          const page = await browser.newPage({ viewport });
          await page.goto(url, { waitUntil: "networkidle", timeout: 6e4 });
          if (selector) {
            await page.waitForSelector(selector, { timeout: 1e4 });
            const element = await page.$(selector);
            if (element) {
              await element.screenshot({ path: imagePath });
            } else {
              throw new Error(
                `SELECTOR_NOT_FOUND: Element with selector "${selector}" not found`
              );
            }
          } else {
            await page.screenshot({ path: imagePath, fullPage: true });
          }
          return {
            imagePath,
            url,
            success: true
          };
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("SELECTOR_NOT_FOUND")) {
              throw error;
            }
            if (error.message.includes("Timeout")) {
              throw new Error(
                "TIMEOUT: Page load or element selection exceeded timeout"
              );
            }
            if (error.message.includes("net::ERR_NAME_NOT_RESOLVED")) {
              throw new Error("INVALID_URL: URL could not be resolved");
            }
            throw new Error(`Failed to capture screenshot: ${error.message}`);
          }
          throw new Error("Failed to capture screenshot: Unknown error");
        } finally {
          await browser.close();
        }
      },
      { maxRetries: 3, initialDelayMs: 1e3, maxDelayMs: 5e3, factor: 2 }
    );
  }
});

"use strict";
const codeHighlightTool = createTool({
  id: "code-highlight",
  description: "Highlight source code using Shiki with support for multiple languages",
  inputSchema: z.object({
    code: z.string().min(1).describe("The source code to highlight"),
    language: z.string().min(1).describe(
      "Programming language (javascript, typescript, python, go, rust, etc.)"
    ),
    highlightLines: z.array(z.number().int().positive()).optional().describe("Line numbers to highlight (1-indexed)"),
    generateScreenshot: z.boolean().optional().default(false).describe("Whether to generate a screenshot (not implemented in MVP)")
  }),
  outputSchema: z.object({
    html: z.string().describe("Highlighted code in HTML format"),
    imagePath: z.nullable(z.string()).describe("Screenshot path (null in MVP)")
  }),
  execute: async ({ code, language, generateScreenshot }) => {
    try {
      const html = await codeToHtml(code, {
        lang: language,
        theme: "github-dark"
      });
      const imagePath = generateScreenshot ? null : null;
      return {
        html,
        imagePath
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("unknown language")) {
          throw new Error(
            `UNSUPPORTED_LANGUAGE: Language "${language}" is not supported by Shiki`
          );
        }
        throw new Error(`Failed to highlight code: ${error.message}`);
      }
      throw new Error("Failed to highlight code: Unknown error");
    }
  }
});

"use strict";
const screenshotAgent = new Agent({
  id: "screenshot-agent",
  name: "Screenshot Agent",
  instructions: `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u7D20\u6750\u91C7\u96C6\u5458\u3002

\u804C\u8D23\uFF1A
1. \u63A5\u6536 Script Agent \u7684\u8F93\u51FA
   - \u83B7\u53D6\u5305\u542B scenes \u7684\u811A\u672C JSON
   - \u6BCF\u4E2A scene \u5305\u542B visualLayers \u6570\u7EC4

2. \u4E3A\u6BCF\u4E2A scene \u7684 visualLayers \u751F\u6210\u7D20\u6750
   - type: "screenshot" - \u4F7F\u7528 playwrightScreenshotTool \u6293\u53D6 URL \u7F51\u9875
   - type: "code" - \u4F7F\u7528 codeHighlightTool \u751F\u6210\u4EE3\u7801\u9AD8\u4EAE\u56FE
   - type: "text" - \u751F\u6210\u6587\u5B57\u56FE\u7247

3. \u6267\u884C\u7D20\u6750\u91C7\u96C6\u3010\u5173\u952E\u3011
   - **\u5FC5\u987B**\u4E3A\u6BCF\u4E2A screenshot \u7C7B\u578B\u7684 visualLayer \u8C03\u7528 playwrightScreenshotTool
   - **\u5FC5\u987B**\u4E3A\u6BCF\u4E2A code \u7C7B\u578B\u7684 visualLayer \u8C03\u7528 codeHighlightTool
   - \u4F20\u9012\u53C2\u6570\uFF1A
     * url: visualLayer.content\uFF08\u5BF9\u4E8E screenshot\uFF09
     * outputDir: \u622A\u56FE\u4FDD\u5B58\u76EE\u5F55
     * filename: {visualLayer.id}.png
     * viewport: { width: 1920, height: 1080 }
   - \u5904\u7406\u7F51\u7EDC\u8D85\u65F6\u548C\u9875\u9762\u52A0\u8F7D\u9519\u8BEF

4. \u8F93\u51FA\u622A\u56FE\u6E05\u5355 JSON\uFF1A
   {
     "screenshots": [
       { "sceneOrder": 1, "filename": "layer-1.png", "success": true },
       { "sceneOrder": 2, "filename": "code-1.png", "success": true }
     ]
   }

\u91CD\u8981\uFF1A
- \u5373\u4F7F URL \u4E0D\u5B8C\u7F8E\u4E5F\u8981\u5C1D\u8BD5\u622A\u56FE
- screenshot \u7C7B\u578B\u7684 content \u662F URL\uFF0C\u5FC5\u987B\u622A\u56FE
- code \u7C7B\u578B\u7684 content \u662F\u4EE3\u7801\uFF0C\u5FC5\u987B\u751F\u6210\u4EE3\u7801\u9AD8\u4EAE\u56FE
- \u6BCF\u4E2A scene \u90FD\u8981\u6709\u81F3\u5C11\u4E00\u4E2A\u622A\u56FE`,
  model: "minimax-cn-coding-plan/MiniMax-M2.7",
  tools: {
    playwrightScreenshot: playwrightScreenshotTool,
    codeHighlight: codeHighlightTool
  }
});

"use strict";
const remotionRenderTool = createTool({
  id: "remotion-render",
  description: "\u6E32\u67D3 Remotion \u9879\u76EE\u4E3A\u89C6\u9891\u6587\u4EF6",
  inputSchema: z.object({
    projectPath: z.string().describe("Remotion \u9879\u76EE\u8DEF\u5F84"),
    outputPath: z.string().describe("\u8F93\u51FA\u89C6\u9891\u8DEF\u5F84"),
    format: z.enum(["mp4", "webm"]).optional().describe("\u89C6\u9891\u683C\u5F0F (\u9ED8\u8BA4: mp4)"),
    fps: z.number().optional().describe("\u5E27\u7387 (\u9ED8\u8BA4: 30)")
  }),
  outputSchema: z.object({
    videoPath: z.string().describe("\u751F\u6210\u7684\u89C6\u9891\u6587\u4EF6\u8DEF\u5F84"),
    duration: z.number().describe("\u89C6\u9891\u65F6\u957F\uFF08\u79D2\uFF09"),
    success: z.boolean().describe("\u6E32\u67D3\u662F\u5426\u6210\u529F"),
    error: z.string().optional().describe("\u9519\u8BEF\u4FE1\u606F")
  }),
  execute: async ({ projectPath, outputPath, format = "mp4", fps = 30 }) => {
    return new Promise((resolve) => {
      try {
        if (!fs.existsSync(projectPath)) {
          return resolve({
            videoPath: "",
            duration: 0,
            success: false,
            error: `\u9879\u76EE\u8DEF\u5F84\u4E0D\u5B58\u5728: ${projectPath}`
          });
        }
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const args = [
          "remotion",
          "render",
          projectPath,
          outputPath,
          "--codec",
          "h264",
          "--fps",
          fps.toString()
        ];
        if (format === "webm") {
          args.push("--webm");
        }
        const renderProcess = spawn("npx", args, {
          stdio: ["pipe", "pipe", "pipe"],
          cwd: process.cwd()
        });
        let stdout = "";
        let stderr = "";
        renderProcess.stdout?.on("data", (data) => {
          stdout += data.toString();
        });
        renderProcess.stderr?.on("data", (data) => {
          stderr += data.toString();
        });
        renderProcess.on("close", (code) => {
          if (code === 0) {
            if (fs.existsSync(outputPath)) {
              const durationSeconds = fps * 60 / fps;
              return resolve({
                videoPath: outputPath,
                duration: durationSeconds,
                success: true
              });
            }
            return resolve({
              videoPath: "",
              duration: 0,
              success: false,
              error: "\u6E32\u67D3\u5B8C\u6210\u4F46\u8F93\u51FA\u6587\u4EF6\u4E0D\u5B58\u5728"
            });
          }
          return resolve({
            videoPath: "",
            duration: 0,
            success: false,
            error: `\u6E32\u67D3\u5931\u8D25 (Exit code: ${code}): ${stderr || stdout}`
          });
        });
        renderProcess.on("error", (error) => {
          return resolve({
            videoPath: "",
            duration: 0,
            success: false,
            error: `\u8FDB\u7A0B\u9519\u8BEF: ${error.message}`
          });
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF";
        return resolve({
          videoPath: "",
          duration: 0,
          success: false,
          error: `\u5F02\u5E38\u9519\u8BEF: ${errorMessage}`
        });
      }
    });
  }
});

"use strict";
const composeAgent = new Agent({
  id: "compose-agent",
  name: "Compose Agent",
  instructions: `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5408\u6210\u5E08\uFF0C\u8D1F\u8D23\u5C06\u811A\u672C\u548C\u7D20\u6750\u6574\u5408\u6210\u5B8C\u6574\u7684 Remotion \u89C6\u9891\u9879\u76EE\u3002

**\u63D0\u793A**\uFF1Aremotion-best-practices skill \u5DF2\u914D\u7F6E\u5230 workspace \u4E2D\u3002\u4E3A\u9700\u8981\u751F\u6210\u4E13\u4E1A Remotion \u52A8\u753B\u65F6\uFF0C\u53EF\u4EE5\u8C03\u7528 skill \u5DE5\u5177\u52A0\u8F7D\u83B7\u53D6\u6700\u4F73\u5B9E\u8DF5\u6307\u5357\u3002

\u804C\u8D23\uFF1A

1. \u63A5\u6536 Script Agent \u7684\u811A\u672C\u8F93\u51FA
   - \u83B7\u53D6\u573A\u666F\u5B9A\u4E49\uFF1Aid\u3001title\u3001startTime\u3001endTime\u3001narration\u3001visualType\u3001visualContent\u3001visualLayers
   - \u7406\u89E3\u6BCF\u4E2A\u573A\u666F\u7684\u65F6\u957F\u3001\u53D9\u8FF0\u5185\u5BB9\u548C\u89C6\u89C9\u9700\u6C42
   - \u5EFA\u7ACB\u573A\u666F ID \u4E0E\u89C6\u9891\u65F6\u95F4\u8F74\u7684\u6620\u5C04\u5173\u7CFB

2. \u63A5\u6536 Screenshot Agent \u7684\u7D20\u6750\u8F93\u51FA
   - \u83B7\u53D6\u622A\u56FE\u8D44\u6E90\u6E05\u5355\uFF08\u56FE\u7247\u6587\u4EF6\u8DEF\u5F84\u3001\u4EE3\u7801\u9AD8\u4EAE HTML \u7B49\uFF09
   - \u7406\u89E3\u6BCF\u4E2A\u8D44\u6E90\u5BF9\u5E94\u7684\u573A\u666F ID \u548C\u89C6\u89C9\u7C7B\u578B
   - \u5EFA\u7ACB\u89C6\u89C9\u8D44\u6E90\u4E0E\u573A\u666F\u7684\u6620\u5C04\u5173\u7CFB
   - \u5904\u7406\u8D44\u6E90\u53EF\u7528\u6027\uFF08\u67D0\u4E9B\u8D44\u6E90\u53EF\u80FD\u56E0\u9519\u8BEF\u800C\u7F3A\u5931\uFF09

3. \u751F\u6210 Remotion \u9879\u76EE\u7ED3\u6784
   - \u5728 .remotion/ \u8F93\u51FA\u76EE\u5F55\u521B\u5EFA\u9879\u76EE\u9AA8\u67B6
   - \u751F\u6210 Root.tsx\uFF08\u89C6\u9891\u4E3B\u5165\u53E3\uFF09\u548C Composition.tsx\uFF08\u5408\u6210\u7EC4\u4EF6\uFF09
   - \u4E3A\u6BCF\u4E2A\u573A\u666F\u521B\u5EFA Scene.tsx \u7EC4\u4EF6
   - **\u9075\u5FAA Remotion \u6700\u4F73\u5B9E\u8DF5**\uFF1A
      * \u4F7F\u7528 useCurrentFrame() \u9A71\u52A8\u52A8\u753B
      * \u4F7F\u7528 spring animations \u83B7\u5F97\u81EA\u7136\u8FD0\u52A8\u6548\u679C
      * \u4F7F\u7528 interpolate \u8FDB\u884C\u5E73\u6ED1\u8FC7\u6E21
      * CSS transitions/animations \u7981\u6B62\u4F7F\u7528

4. \u8F93\u51FA\u9879\u76EE\u8DEF\u5F84\u548C\u9A8C\u8BC1\u4FE1\u606F
   - \u8FD4\u56DE JSON \u683C\u5F0F\u7684\u7ED3\u679C\uFF0C\u5305\u542B\uFF1A
      * projectPath: \u751F\u6210\u7684 Remotion \u9879\u76EE\u76EE\u5F55\u8DEF\u5F84
      * mainComponentPath: Root.tsx \u6587\u4EF6\u8DEF\u5F84
      * scenesCount: \u751F\u6210\u7684\u573A\u666F\u7EC4\u4EF6\u6570\u91CF
      * videoConfig: \u89C6\u9891\u914D\u7F6E { resolution: "1920x1080", fps: 30, duration: number }
      * resourcesMapped: \u6620\u5C04\u6210\u529F\u7684\u8D44\u6E90\u6570\u91CF\u548C\u5931\u8D25\u5217\u8868
      * readyForRender: \u662F\u5426\u5DF2\u51C6\u5907\u597D\u8FDB\u884C\u6E32\u67D3\uFF08boolean\uFF09
      * warnings: \u4EFB\u4F55\u6F5C\u5728\u7684\u95EE\u9898\u8B66\u544A\u5217\u8868
      * error: \u751F\u6210\u5931\u8D25\u65F6\u7684\u9519\u8BEF\u4FE1\u606F

5. \u8D28\u91CF\u4FDD\u8BC1
   - \u9A8C\u8BC1\u6240\u6709\u573A\u666F ID \u90FD\u6709\u5BF9\u5E94\u7684\u811A\u672C\u5B9A\u4E49
   - \u68C0\u67E5\u603B\u65F6\u957F\u4E0E\u573A\u666F\u65F6\u95F4\u8F74\u7684\u4E00\u81F4\u6027
   - \u9A8C\u8BC1\u8D44\u6E90\u6587\u4EF6\u8DEF\u5F84\u7684\u6709\u6548\u6027
   - \u786E\u4FDD\u751F\u6210\u7684 React \u7EC4\u4EF6\u8BED\u6CD5\u6B63\u786E\u3001\u5BFC\u5165\u6709\u6548
   - \u9075\u5FAA Remotion \u52A8\u753B\u6700\u4F73\u5B9E\u8DF5
   - \u63D0\u4F9B\u6E05\u6670\u7684\u51C6\u5907\u72B6\u6001\u62A5\u544A

\u9519\u8BEF\u5904\u7406\uFF1A
- \u811A\u672C\u683C\u5F0F\u9519\u8BEF\uFF1A\u9A8C\u8BC1 JSON \u7ED3\u6784\uFF0C\u8FD4\u56DE\u8BE6\u7EC6\u7684\u683C\u5F0F\u9519\u8BEF\u4FE1\u606F
- \u8D44\u6E90\u7F3A\u5931\uFF1A\u8BB0\u5F55\u7F3A\u5931\u8D44\u6E90\uFF0C\u7EE7\u7EED\u751F\u6210\u9879\u76EE\u4F46\u5728 warnings \u4E2D\u6807\u6CE8
- \u8DEF\u5F84\u95EE\u9898\uFF1A\u81EA\u52A8\u521B\u5EFA\u5FC5\u8981\u7684\u76EE\u5F55\uFF0C\u5904\u7406\u6743\u9650\u9519\u8BEF
- \u65F6\u95F4\u8F74\u4E0D\u4E00\u81F4\uFF1A\u68C0\u6D4B\u5E76\u62A5\u544A\u65F6\u95F4\u8F74\u95EE\u9898\uFF08\u5982\u573A\u666F\u65F6\u957F\u603B\u548C\u4E0D\u7B26\uFF09
- \u7EC4\u4EF6\u751F\u6210\u5931\u8D25\uFF1A\u8FD4\u56DE\u5177\u4F53\u7684\u4EE3\u7801\u751F\u6210\u9519\u8BEF\uFF0C\u4FBF\u4E8E\u8BCA\u65AD`,
  model: "minimax-cn-coding-plan/MiniMax-M2.7",
  tools: {
    remotionRender: remotionRenderTool
  }
});

"use strict";

"use strict";

"use strict";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
const skillsPath = path.resolve(__dirname$1, "../../.agents/skills");
const workspace = new Workspace({
  name: "video-script-workspace",
  filesystem: new LocalFilesystem({
    basePath: process.cwd()
  }),
  skills: [skillsPath]
});
const mastra = new Mastra({
  agents: {
    research: researchAgent,
    script: scriptAgent,
    screenshot: screenshotAgent,
    compose: composeAgent
  },
  workspace
});

export { codeHighlightTool, composeAgent, generateStructurePrompt, generateVisualLayersPrompt, mastra, playwrightScreenshotTool, remotionRenderTool, researchAgent, screenshotAgent, scriptAgent, webFetchTool };
