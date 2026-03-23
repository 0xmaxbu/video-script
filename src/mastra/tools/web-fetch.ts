import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { withRetry } from "../../utils/retry.js";
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import Turndown from 'turndown';

// Turndown instance for HTML to Markdown conversion
const td = new Turndown();

function extractTitle(html: string): string {
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

export async function fetchAndExtract(url: string): Promise<{ content: string; title: string; url: string }> {
  const controller = new AbortController();
  const TIMEOUT_MS = 30000;
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
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

    // Parse HTML into DOM using linkedom
    const { document } = parseHTML(html);

    // Extract article content using Readability
    const reader = new Readability(document, { charThreshold: 0 });
    const article = reader.parse();

    if (!article) {
      throw new Error("READABILITY_FAILED");
    }

    // Convert to Markdown using Turndown
    if (!article.content) {
      throw new Error("READABILITY_FAILED: No content extracted");
    }
    const markdown = td.turndown(article.content);
    const title = article.title || extractTitle(html);

    return {
      content: markdown,
      title,
      url: response.url,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const webFetchTool = createTool({
  id: "web-fetch",
  description:
    "Fetch and extract content from a web page, converting HTML to Markdown format",
  inputSchema: z.object({
    url: z.string().url("Invalid URL format"),
  }),
  outputSchema: z.object({
    content: z.string().describe("Page content in Markdown format"),
    title: z.string().describe("Page title"),
    url: z.string().describe("Final URL after redirects"),
  }),
  execute: async ({ url }) => {
    const retryOptions =
      process.env.NODE_ENV === "test"
        ? { maxRetries: 0 }
        : { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 5000, factor: 2 };

    return withRetry(async () => {
      return fetchAndExtract(url);
    }, retryOptions);
  },
});
