import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { w as withRetry } from '../retry.mjs';
import 'ora';
import 'chalk';

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
    const retryOptions = { maxRetries: 3, initialDelayMs: 1e3, maxDelayMs: 5e3, factor: 2 };
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

export { webFetchTool };
