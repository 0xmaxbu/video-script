import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { chromium } from 'playwright';
import fs, { existsSync, mkdirSync } from 'fs';
import path, { join } from 'path';
import { codeToHtml } from 'shiki';
import { spawn } from 'child_process';
import { createStep, createWorkflow } from '@mastra/core/workflows';

"use strict";
function htmlToMarkdown(html) {
  const removeScriptsAndStyles = (content) => content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  const convertTagsToMarkdown = (content) => content.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n").replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n").replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n").replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n").replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n").replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n").replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**").replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**").replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*").replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*").replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<\/li>/gi, "\n").replace(/<[^>]*>/g, "");
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
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PAGE_NOT_FOUND") {
          throw new Error(
            "PAGE_NOT_FOUND: The requested page was not found (404)"
          );
        }
        if (error.message === "SERVER_ERROR") {
          throw new Error("SERVER_ERROR: The server returned a 5xx error");
        }
        if (error.name === "AbortError") {
          throw new Error("TIMEOUT: Request exceeded 30 second timeout");
        }
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
      throw new Error("Failed to fetch URL: Unknown error");
    } finally {
      clearTimeout(timeoutId);
    }
  }
});

"use strict";
const researchAgent = new Agent({
  id: "research-agent",
  name: "Research Agent",
  instructions: `\u4F60\u662F\u4E00\u4E2A\u6280\u672F\u5185\u5BB9\u7814\u7A76\u5458\u3002\u6839\u636E\u7528\u6237\u63D0\u4F9B\u7684\u6807\u9898\u3001\u94FE\u63A5\u548C\u6587\u6863\uFF0C\u641C\u96C6\u5E76\u6574\u7406\u76F8\u5173\u4FE1\u606F\u3002

\u4EFB\u52A1\u6D41\u7A0B\uFF1A
1. \u63A5\u6536\u7528\u6237\u63D0\u4F9B\u7684\u6807\u9898\u3001\u94FE\u63A5\u5217\u8868\u548C\u53EF\u9009\u7684\u6587\u6863\u5185\u5BB9
2. \u4F7F\u7528 webFetch \u5DE5\u5177\u6293\u53D6\u5E76\u5206\u6790\u6BCF\u4E2A\u94FE\u63A5\u7684\u7F51\u9875\u5185\u5BB9
3. \u6574\u7406\u63D0\u53D6\u7684\u4FE1\u606F\uFF0C\u7ED3\u5408\u6587\u6863\u5185\u5BB9\u8FDB\u884C\u7EFC\u5408\u5206\u6790
4. \u751F\u6210\u7ED3\u6784\u5316\u7684\u7814\u7A76\u7ED3\u679C

\u8F93\u51FA\u683C\u5F0F\uFF08JSON\u7ED3\u6784\uFF09\uFF1A
{
  "title": "\u6280\u672F\u6807\u9898",
  "overview": "\u6838\u5FC3\u6982\u8FF0\uFF08200\u5B57\u4EE5\u5185\uFF09",
  "keyPoints": [
    {
      "title": "\u5173\u952E\u6982\u5FF51",
      "description": "\u8BE6\u7EC6\u8BF4\u660E"
    }
  ],
  "scenes": [
    {
      "sceneTitle": "\u573A\u666F1\u6807\u9898",
      "duration": 30,
      "description": "\u573A\u666F\u63CF\u8FF0",
      "screenshotSubjects": ["\u4E3B\u98981", "\u4E3B\u98982"]
    }
  ],
  "sources": [
    {
      "url": "https://example.com",
      "title": "\u9875\u9762\u6807\u9898",
      "keyContent": "\u5173\u952E\u5185\u5BB9\u6458\u8981"
    }
  ]
}

\u5173\u952E\u8981\u6C42\uFF1A
- \u4F7F\u7528 webFetch \u5DE5\u5177\u83B7\u53D6\u7F51\u9875\u5185\u5BB9
- \u63D0\u53D6\u6838\u5FC3\u6280\u672F\u6982\u5FF5\u548C\u5B9E\u8DF5\u5EFA\u8BAE
- \u4E3A\u6BCF\u4E2A\u573A\u666F\u5EFA\u8BAE\u5408\u9002\u7684\u622A\u56FE\u4E3B\u9898
- \u4FDD\u6301\u4FE1\u606F\u7684\u51C6\u786E\u6027\u548C\u76F8\u5173\u6027`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
  tools: {
    webFetch: webFetchTool
  }
});

"use strict";
const scriptAgent = new Agent({
  id: "script-agent",
  name: "Script Agent",
  instructions: `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u811A\u672C\u7F16\u5199\u5458\u3002

\u804C\u8D23\uFF1A
1. \u6839\u636E\u7814\u7A76\u7ED3\u679C\u5212\u5206\u89C6\u9891\u573A\u666F
   - \u5206\u6790\u5173\u952E\u70B9\u548C\u4FE1\u606F\uFF0C\u5212\u5206\u4E3A 3-8 \u4E2A\u903B\u8F91\u573A\u666F
   - \u6BCF\u4E2A\u573A\u666F\u805A\u7126\u4E00\u4E2A\u6838\u5FC3\u6982\u5FF5\u6216\u4E3B\u9898
   - \u786E\u4FDD\u573A\u666F\u987A\u5E8F\u903B\u8F91\u6E05\u6670\u3001\u5C42\u6B21\u9012\u8FDB

2. \u4E3A\u6BCF\u4E2A\u573A\u666F\u7F16\u5199\u65C1\u767D\u6587\u672C
   - \u4F7F\u7528\u53E3\u8BED\u5316\u4E2D\u6587\uFF0C\u907F\u514D\u751F\u786C\u5B66\u672F\u7528\u8BED
   - \u8BED\u8A00\u7B80\u6D01\u6613\u61C2\uFF0C\u9002\u5408\u542C\u4F17\u5FEB\u901F\u7406\u89E3
   - \u878D\u5165\u9002\u5F53\u7684\u89E3\u91CA\u548C\u4F8B\u5B50\uFF0C\u589E\u5F3A\u53EF\u7406\u89E3\u6027

3. \u89C4\u5212\u65F6\u95F4\u8F74
   - \u4E3A\u6BCF\u4E2A\u573A\u666F\u6307\u5B9A\u5F00\u59CB\u548C\u7ED3\u675F\u65F6\u95F4\uFF08\u79D2\u6570\uFF09
   - \u6839\u636E\u5185\u5BB9\u590D\u6742\u5EA6\u5206\u914D\u65F6\u957F\uFF1A\u7B80\u4ECB 10-15\u79D2\u3001\u4E3B\u8981\u5185\u5BB9 30-60\u79D2\u3001\u603B\u7ED3 10-15\u79D2
   - \u786E\u4FDD\u6574\u4F53\u89C6\u9891\u65F6\u957F\u5728 3-10 \u5206\u949F\uFF08180-600\u79D2\uFF09

4. \u786E\u5B9A\u89C6\u89C9\u5143\u7D20\u7C7B\u578B
   - \u4E3A\u6BCF\u4E2A\u573A\u666F\u6307\u5B9A\u89C6\u89C9\u5185\u5BB9\u7C7B\u578B\uFF1A\u7F51\u9875\u622A\u56FE\u3001\u4EE3\u7801\u793A\u4F8B\u3001\u56FE\u8868\u3001\u52A8\u753B\u7B49
   - \u6807\u6CE8\u9700\u8981\u622A\u56FE\u7684 URL \u6216\u4EE3\u7801\u7247\u6BB5\uFF08\u5982\u6709\uFF09

5. \u4FDD\u8BC1\u8D28\u91CF
   - \u6574\u4F53\u53D9\u4E8B\u6D41\u7545\u3001\u5438\u5F15\u542C\u4F17
   - \u4FE1\u606F\u5BC6\u5EA6\u9002\u4E2D\uFF0C\u907F\u514D\u4FE1\u606F\u8FC7\u8F7D
   - \u786E\u4FDD\u79D1\u5B66\u6027\u548C\u51C6\u786E\u6027

\u8F93\u51FA JSON \u683C\u5F0F\uFF1A
{
  "title": "\u89C6\u9891\u6807\u9898",
  "totalDuration": 300,
  "scenes": [
    {
      "id": 1,
      "title": "\u573A\u666F\u6807\u9898",
      "startTime": 0,
      "endTime": 20,
      "narration": "\u65C1\u767D\u6587\u672C\uFF0C\u53E3\u8BED\u5316\u8868\u8FBE",
      "visualType": "screenshot|code|diagram|animation|text",
      "visualContent": "URL \u6216\u4EE3\u7801\u7247\u6BB5\uFF08\u5982\u9700\u8981\uFF09"
    }
  ]
}`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5"
});

"use strict";
const OUTPUT_DIR = "./output/screenshots";
function ensureOutputDir() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}
function generateFileName() {
  return `screenshot-${Date.now()}.png`;
}
const playwrightScreenshotTool = createTool({
  id: "playwright-screenshot",
  description: "Capture a screenshot of a webpage using Playwright",
  inputSchema: z.object({
    url: z.string().url("Invalid URL format"),
    selector: z.string().optional().describe("CSS selector to capture a specific element"),
    viewport: z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive()
    }).optional().describe("Viewport size (defaults to 1920x1080)")
  }),
  outputSchema: z.object({
    imagePath: z.string().describe("Path to the saved PNG screenshot"),
    url: z.string().describe("The URL that was captured"),
    success: z.boolean().describe("Whether the screenshot was successful")
  }),
  execute: async ({
    url,
    selector,
    viewport = { width: 1920, height: 1080 }
  }) => {
    ensureOutputDir();
    const browser = await chromium.launch();
    const fileName = generateFileName();
    const imagePath = join(OUTPUT_DIR, fileName);
    try {
      const page = await browser.newPage({ viewport });
      await page.goto(url, { waitUntil: "networkidle", timeout: 3e4 });
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
   - \u83B7\u53D6\u5305\u542B\u573A\u666F\u3001\u89C6\u89C9\u5143\u7D20\u7C7B\u578B\u548C\u5185\u5BB9\u7684\u811A\u672C JSON
   - \u7406\u89E3\u6BCF\u4E2A\u573A\u666F\u7684\u89C6\u89C9\u9700\u6C42\u548C\u5185\u5BB9\u63CF\u8FF0

2. \u6839\u636E\u89C6\u89C9\u5143\u7D20\u7C7B\u578B\u51B3\u5B9A\u622A\u56FE\u7B56\u7565
   - screenshot: \u7F51\u9875\u622A\u56FE\uFF08\u9700\u8981\u6709\u6709\u6548\u7684 URL\uFF09
   - code: \u4EE3\u7801\u9AD8\u4EAE\u622A\u56FE\uFF08\u9700\u8981\u6709\u4EE3\u7801\u7247\u6BB5\u548C\u7F16\u7A0B\u8BED\u8A00\uFF09
   - diagram/animation/text: \u65E0\u9700\u64CD\u4F5C\uFF0C\u4EA4\u7531 Compose Agent \u5904\u7406

3. \u6267\u884C\u7F51\u9875\u622A\u56FE
   - \u4F7F\u7528 playwrightScreenshotTool \u6293\u53D6 URL \u5BF9\u5E94\u7684\u7F51\u9875
   - \u6307\u5B9A\u5408\u9002\u7684\u89C6\u53E3\u5C3A\u5BF8\uFF081920x1080 \u7528\u4E8E\u901A\u7528\u7F51\u9875\uFF09
   - \u5982\u679C URL \u4E2D\u5305\u542B\u7279\u5B9A\u5143\u7D20 ID/\u7C7B\u540D\uFF0C\u4F7F\u7528 selector \u53C2\u6570\u7CBE\u786E\u6355\u83B7
   - \u5904\u7406\u7F51\u7EDC\u8D85\u65F6\u548C\u9875\u9762\u52A0\u8F7D\u9519\u8BEF

4. \u6267\u884C\u4EE3\u7801\u9AD8\u4EAE
   - \u4F7F\u7528 codeHighlightTool \u5BF9\u4EE3\u7801\u7247\u6BB5\u8FDB\u884C\u8BED\u6CD5\u9AD8\u4EAE
   - \u8BC6\u522B\u7F16\u7A0B\u8BED\u8A00\uFF08\u4ECE visualContent \u6216\u4E0A\u4E0B\u6587\u63A8\u65AD\uFF09
   - \u652F\u6301\u7684\u8BED\u8A00\uFF1Ajavascript, typescript, python, go, rust, java, cpp, sql \u7B49
   - \u751F\u6210 HTML \u9AD8\u4EAE\u7ED3\u679C\u4F9B Compose Agent \u8F6C\u6362\u4E3A\u56FE\u50CF

5. \u8F93\u51FA\u622A\u56FE\u6E05\u5355
   - \u4E3A\u6BCF\u4E2A\u573A\u666F\u751F\u6210\u5BF9\u5E94\u7684\u622A\u56FE\u8D44\u6E90
   - \u8FD4\u56DE JSON \u683C\u5F0F\u7684\u7ED3\u679C\uFF0C\u5305\u542B\uFF1A
     * sceneId: \u5BF9\u5E94\u7684\u573A\u666F ID
     * visualType: \u89C6\u89C9\u5143\u7D20\u7C7B\u578B
     * imagePath: \u4FDD\u5B58\u7684\u622A\u56FE\u6587\u4EF6\u8DEF\u5F84\uFF08\u4EC5 screenshot \u7C7B\u578B\uFF09
     * highlightedHtml: \u4EE3\u7801\u9AD8\u4EAE\u540E\u7684 HTML\uFF08\u4EC5 code \u7C7B\u578B\uFF09
     * sourceUrl/sourceCode: \u539F\u59CB\u6570\u636E\u6765\u6E90
     * success: \u662F\u5426\u6210\u529F\u83B7\u53D6\u8D44\u6E90

\u9519\u8BEF\u5904\u7406\uFF1A
- \u7F51\u7EDC\u9519\u8BEF\uFF1A\u8FD4\u56DE\u8BE6\u7EC6\u9519\u8BEF\u4FE1\u606F\uFF0C\u544A\u77E5\u7528\u6237\u68C0\u67E5 URL \u6709\u6548\u6027
- \u8D85\u65F6\u9519\u8BEF\uFF1A\u81EA\u52A8\u91CD\u8BD5\u4E00\u6B21\uFF0C\u5931\u8D25\u5219\u8BB0\u5F55\u9519\u8BEF\u5E76\u7EE7\u7EED\u5904\u7406\u5176\u4ED6\u573A\u666F
- \u8BED\u8A00\u4E0D\u652F\u6301\uFF1A\u5C1D\u8BD5\u63A8\u65AD\u76F8\u8FD1\u7684\u8BED\u8A00\uFF0C\u6216\u4F7F\u7528\u901A\u7528\u7684 plaintext \u683C\u5F0F
- \u9009\u62E9\u5668\u4E0D\u5339\u914D\uFF1A\u56DE\u9000\u5230\u5168\u9875\u9762\u622A\u56FE`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
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

\u804C\u8D23\uFF1A

1. \u63A5\u6536 Script Agent \u7684\u811A\u672C\u8F93\u51FA
   - \u83B7\u53D6\u573A\u666F\u5B9A\u4E49\uFF1Aid\u3001title\u3001startTime\u3001endTime\u3001narration\u3001visualType\u3001visualContent
   - \u7406\u89E3\u6BCF\u4E2A\u573A\u666F\u7684\u65F6\u957F\u3001\u53D9\u8FF0\u5185\u5BB9\u548C\u89C6\u89C9\u9700\u6C42
   - \u5EFA\u7ACB\u573A\u666F ID \u4E0E\u89C6\u9891\u65F6\u95F4\u8F74\u7684\u6620\u5C04\u5173\u7CFB

2. \u63A5\u6536 Screenshot Agent \u7684\u7D20\u6750\u8F93\u51FA
   - \u83B7\u53D6\u622A\u56FE\u8D44\u6E90\u6E05\u5355\uFF08\u56FE\u7247\u6587\u4EF6\u8DEF\u5F84\u3001\u4EE3\u7801\u9AD8\u4EAE HTML \u7B49\uFF09
   - \u7406\u89E3\u6BCF\u4E2A\u8D44\u6E90\u5BF9\u5E94\u7684\u573A\u666F ID \u548C\u89C6\u89C9\u7C7B\u578B
   - \u5EFA\u7ACB\u89C6\u89C9\u8D44\u6E90\u4E0E\u573A\u666F\u7684\u6620\u5C04\u5173\u7CFB
   - \u5904\u7406\u8D44\u6E90\u53EF\u7528\u6027\uFF08\u67D0\u4E9B\u8D44\u6E90\u53EF\u80FD\u56E0\u9519\u8BEF\u800C\u7F3A\u5931\uFF09

3. \u751F\u6210 Remotion \u9879\u76EE\u7ED3\u6784
   - \u5728 .remotion/ \u8F93\u51FA\u76EE\u5F55\u521B\u5EFA\u9879\u76EE\u9AA8\u67B6
   - \u751F\u6210 Main.tsx\uFF08\u89C6\u9891\u4E3B\u7EC4\u4EF6\uFF09\u548C scenes/ \u4E0B\u7684\u5404\u573A\u666F\u7EC4\u4EF6
   - \u4E3A\u6BCF\u4E2A\u573A\u666F\u521B\u5EFA\u5BF9\u5E94\u7684 React \u7EC4\u4EF6\uFF1A
      * \u5BFC\u5165\u5BF9\u5E94\u7684\u56FE\u7247\u8D44\u6E90\u6216\u4EE3\u7801\u9AD8\u4EAE HTML
      * \u5B9E\u73B0\u53D9\u8FF0\u6587\u672C\u7684\u65F6\u95F4\u540C\u6B65\u663E\u793A
      * \u914D\u7F6E\u80CC\u666F\u3001\u8F6C\u573A\u6548\u679C\u7B49
   - \u521B\u5EFA package.json\u3001tsconfig.json \u7B49\u914D\u7F6E\u6587\u4EF6
   - \u914D\u7F6E\u89C6\u9891\u53C2\u6570\uFF1A
      * \u5206\u8FA8\u7387\uFF1A1920x1080\uFF0816:9\uFF09
      * \u5E27\u7387\uFF1A30fps
      * \u603B\u65F6\u957F\uFF1A\u4ECE Script Agent \u7684 totalDuration \u5B57\u6BB5\u83B7\u53D6

4. \u8F93\u51FA\u9879\u76EE\u8DEF\u5F84\u548C\u9A8C\u8BC1\u4FE1\u606F
   - \u8FD4\u56DE JSON \u683C\u5F0F\u7684\u7ED3\u679C\uFF0C\u5305\u542B\uFF1A
      * projectPath: \u751F\u6210\u7684 Remotion \u9879\u76EE\u76EE\u5F55\u8DEF\u5F84
      * mainComponentPath: Main.tsx \u6587\u4EF6\u8DEF\u5F84
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
   - \u63D0\u4F9B\u6E05\u6670\u7684\u51C6\u5907\u72B6\u6001\u62A5\u544A

\u9519\u8BEF\u5904\u7406\uFF1A
- \u811A\u672C\u683C\u5F0F\u9519\u8BEF\uFF1A\u9A8C\u8BC1 JSON \u7ED3\u6784\uFF0C\u8FD4\u56DE\u8BE6\u7EC6\u7684\u683C\u5F0F\u9519\u8BEF\u4FE1\u606F
- \u8D44\u6E90\u7F3A\u5931\uFF1A\u8BB0\u5F55\u7F3A\u5931\u8D44\u6E90\uFF0C\u7EE7\u7EED\u751F\u6210\u9879\u76EE\u4F46\u5728 warnings \u4E2D\u6807\u6CE8
- \u8DEF\u5F84\u95EE\u9898\uFF1A\u81EA\u52A8\u521B\u5EFA\u5FC5\u8981\u7684\u76EE\u5F55\uFF0C\u5904\u7406\u6743\u9650\u9519\u8BEF
- \u65F6\u95F4\u8F74\u4E0D\u4E00\u81F4\uFF1A\u68C0\u6D4B\u5E76\u62A5\u544A\u65F6\u95F4\u8F74\u95EE\u9898\uFF08\u5982\u573A\u666F\u65F6\u957F\u603B\u548C\u4E0D\u7B26\uFF09
- \u7EC4\u4EF6\u751F\u6210\u5931\u8D25\uFF1A\u8FD4\u56DE\u5177\u4F53\u7684\u4EE3\u7801\u751F\u6210\u9519\u8BEF\uFF0C\u4FBF\u4E8E\u8BCA\u65AD`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
  tools: {
    remotionRender: remotionRenderTool
  }
});

"use strict";
const ResearchInputSchema = z.object({
  title: z.string().min(1),
  links: z.array(z.string().url()).optional(),
  document: z.string().optional(),
  documentFile: z.string().optional()
});
const ResearchOutputSchema = z.object({
  title: z.string(),
  overview: z.string(),
  keyPoints: z.array(
    z.object({
      title: z.string(),
      description: z.string()
    })
  ),
  scenes: z.array(
    z.object({
      sceneTitle: z.string(),
      duration: z.number(),
      description: z.string(),
      screenshotSubjects: z.array(z.string())
    })
  ),
  sources: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      keyContent: z.string()
    })
  )
});
const ScreenshotSpecSchema = z.object({
  url: z.string().url().optional(),
  selector: z.string().optional(),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive()
  })
});
const CodeSpecSchema = z.object({
  language: z.string(),
  code: z.string(),
  highlightLines: z.array(z.number().int().positive()).optional()
});
const VisualTypeEnum = z.enum(["screenshot", "code", "text", "diagram"]);
const SceneSchema = z.object({
  id: z.string(),
  type: z.enum(["intro", "feature", "code", "outro"]),
  title: z.string(),
  narration: z.string(),
  duration: z.number().positive(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  visualType: VisualTypeEnum.optional(),
  visualContent: z.string().optional(),
  screenshot: ScreenshotSpecSchema.optional(),
  code: CodeSpecSchema.optional()
});
const ScriptOutputSchema = z.object({
  title: z.string(),
  totalDuration: z.number().positive(),
  scenes: z.array(SceneSchema)
});
const VideoConfigSchema = z.object({
  aspectRatio: z.enum(["16:9", "9:16"]),
  fps: z.number().int().positive().default(30),
  outputDir: z.string()
});
const ScreenshotAgentInputSchema = z.object({
  scenes: z.array(SceneSchema),
  outputDir: z.string()
});
const ComposeAgentInputSchema = z.object({
  script: ScriptOutputSchema,
  screenshotDir: z.string(),
  outputDir: z.string(),
  config: VideoConfigSchema
});

"use strict";
const researchStep = createStep(researchAgent, {
  structuredOutput: {
    schema: ResearchOutputSchema
  }
});
const scriptStep = createStep(scriptAgent, {
  structuredOutput: {
    schema: ScriptOutputSchema
  }
});
const mapStep = createStep({
  id: "map-script-output",
  inputSchema: ScriptOutputSchema,
  outputSchema: ScriptOutputSchema.extend({
    _skipReview: z.boolean().optional()
  }),
  execute: async ({ inputData }) => {
    const mappedScenes = inputData.scenes.map((scene, index) => {
      const duration = scene.duration ?? (scene.startTime !== void 0 && scene.endTime !== void 0 ? scene.endTime - scene.startTime : 30);
      const visualType = scene.visualType ?? "text";
      const type = visualType === "code" ? "code" : visualType === "screenshot" ? "feature" : index === 0 ? "intro" : index === inputData.scenes.length - 1 ? "outro" : "feature";
      return {
        id: String(scene.id ?? index + 1),
        type,
        title: scene.title,
        narration: scene.narration,
        duration,
        startTime: scene.startTime,
        endTime: scene.endTime,
        visualType,
        visualContent: scene.visualContent,
        screenshot: scene.screenshot,
        code: scene.code
      };
    });
    return {
      title: inputData.title,
      totalDuration: inputData.totalDuration ?? mappedScenes.reduce((sum, s) => sum + s.duration, 0),
      scenes: mappedScenes
    };
  }
});
const HumanReviewInputSchema = ScriptOutputSchema.extend({
  _skipReview: z.boolean().optional()
});
const humanReviewStep = createStep({
  id: "human-review",
  inputSchema: HumanReviewInputSchema,
  outputSchema: ScriptOutputSchema,
  resumeSchema: ScriptOutputSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    if (resumeData) {
      return resumeData;
    }
    const skipReview = inputData._skipReview ?? process.env.VIDEO_SCRIPT_SKIP_REVIEW === "true";
    if (skipReview) {
      const { _skipReview, ...scriptData } = inputData;
      return scriptData;
    }
    await suspend(inputData, {
      resumeLabel: "script-approved"
    });
    return inputData;
  }
});
const screenshotStep = createStep(screenshotAgent, {
  structuredOutput: {
    schema: z.object({
      success: z.boolean(),
      screenshotDir: z.string(),
      resources: z.array(
        z.object({
          sceneId: z.string(),
          imagePath: z.string().optional(),
          highlightedHtml: z.string().optional()
        })
      )
    })
  }
});
const composeStep = createStep(composeAgent, {
  structuredOutput: {
    schema: z.object({
      projectPath: z.string(),
      videoPath: z.string().optional(),
      videoConfig: z.object({
        resolution: z.string(),
        fps: z.number(),
        duration: z.number()
      }),
      readyForRender: z.boolean(),
      warnings: z.array(z.string()).optional()
    })
  }
});
const videoGenerationWorkflow = createWorkflow({
  id: "video-generation-workflow",
  inputSchema: ResearchInputSchema,
  outputSchema: z.object({
    projectPath: z.string(),
    videoPath: z.string().optional(),
    videoConfig: z.object({
      resolution: z.string(),
      fps: z.number(),
      duration: z.number()
    }),
    warnings: z.array(z.string()).optional()
  }),
  steps: [
    researchStep,
    scriptStep,
    mapStep,
    humanReviewStep,
    screenshotStep,
    composeStep
  ]
}).commit();

"use strict";

"use strict";

"use strict";

"use strict";
const mastra = new Mastra({
  agents: {
    research: researchAgent,
    script: scriptAgent,
    screenshot: screenshotAgent,
    compose: composeAgent
  },
  workflows: {
    "video-generation-workflow": videoGenerationWorkflow
  }
});

"use strict";

export { mastra };
