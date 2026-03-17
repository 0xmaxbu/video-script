import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { withRetry } from "../../utils/retry.js";

export const playwrightScreenshotTool = createTool({
  id: "playwright-screenshot",
  description: "Capture a screenshot of a webpage using Playwright",
  inputSchema: z.object({
    url: z.string().url("Invalid URL format"),
    selector: z
      .string()
      .optional()
      .describe("CSS selector to capture a specific element"),
    viewport: z
      .object({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .optional()
      .describe("Viewport size (defaults to 1920x1080)"),
    outputDir: z
      .string()
      .optional()
      .describe(
        "Output directory for screenshots (defaults to ./output/screenshots)",
      ),
    filename: z
      .string()
      .optional()
      .describe("Output filename (e.g., scene-001.png)"),
  }),
  outputSchema: z.object({
    imagePath: z.string().describe("Path to the saved PNG screenshot"),
    url: z.string().describe("The URL that was captured"),
    success: z.boolean().describe("Whether the screenshot was successful"),
  }),
  execute: async ({
    url,
    selector,
    viewport = { width: 1920, height: 1080 },
    outputDir = "./output/screenshots",
    filename,
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
          await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

          if (selector) {
            await page.waitForSelector(selector, { timeout: 10000 });
            const element = await page.$(selector);
            if (element) {
              await element.screenshot({ path: imagePath });
            } else {
              throw new Error(
                `SELECTOR_NOT_FOUND: Element with selector "${selector}" not found`,
              );
            }
          } else {
            await page.screenshot({ path: imagePath, fullPage: true });
          }

          return {
            imagePath,
            url,
            success: true,
          };
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("SELECTOR_NOT_FOUND")) {
              throw error;
            }
            if (error.message.includes("Timeout")) {
              throw new Error(
                "TIMEOUT: Page load or element selection exceeded timeout",
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
      { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 5000, factor: 2 },
    );
  },
});
