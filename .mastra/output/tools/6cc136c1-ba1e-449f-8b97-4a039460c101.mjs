import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { w as withRetry } from '../retry.mjs';
import 'ora';
import 'chalk';

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
    return withRetry(
      async () => {
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
      },
      { maxRetries: 3, initialDelayMs: 1e3, maxDelayMs: 5e3, factor: 2 }
    );
  }
});

export { playwrightScreenshotTool };
