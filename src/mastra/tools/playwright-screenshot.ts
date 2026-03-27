import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { withRetry } from "../../utils/retry.js";

export interface SemanticRegion {
  name: string;
  selector: string;
}

export interface PageStructure {
  headings: string[];
  links: string[];
  codeBlocks: string[];
  semanticRegions: SemanticRegion[];
}

export type ContentTypeHint = "documentation" | "code" | "article";

export const playwrightScreenshotTool = createTool({
  id: "playwright-screenshot",
  description: "Capture a screenshot of a webpage using Playwright",
  inputSchema: z.object({
    url: z.string().url("Invalid URL format"),
    selector: z
      .string()
      .optional()
      .describe("CSS selector to capture a specific element directly"),
    zoomToSelector: z
      .string()
      .optional()
      .describe(
        "CSS selector to zoom into: captures full page then crops to element bounding box using sharp",
      ),
    darkMode: z
      .boolean()
      .optional()
      .describe(
        "Emulate dark color scheme via prefers-color-scheme media query (default: false)",
      ),
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
    imagePath: z
      .string()
      .describe(
        "Path to the saved PNG screenshot (always local file path, ORB-safe)",
      ),
    url: z.string().describe("The URL that was captured"),
    success: z.boolean().describe("Whether the screenshot was successful"),
  }),
  execute: async ({
    url,
    selector,
    zoomToSelector,
    darkMode = false,
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

          // D-01: Dark mode emulation via prefers-color-scheme
          if (darkMode) {
            await page.emulateMedia({ colorScheme: "dark" });
          }

          await page.goto(url, { waitUntil: "load", timeout: 60000 });

          if (selector) {
            // Direct element capture (existing behavior)
            await page.waitForSelector(selector, { timeout: 10000 });
            const element = await page.$(selector);
            if (element) {
              await element.screenshot({ path: imagePath });
            } else {
              throw new Error(
                `SELECTOR_NOT_FOUND: Element with selector "${selector}" not found`,
              );
            }
          } else if (zoomToSelector) {
            // D-02: Zoom-to-region: full-page capture + sharp crop to element bounding box
            const fullPagePath = join(outputDir, `_full_${Date.now()}.png`);
            await page.screenshot({ path: fullPagePath, fullPage: true });

            await page.waitForSelector(zoomToSelector, { timeout: 10000 });
            const element = await page.$(zoomToSelector);
            if (!element) {
              throw new Error(
                `SELECTOR_NOT_FOUND: Element with selector "${zoomToSelector}" not found`,
              );
            }

            const boundingBox = await element.boundingBox();
            if (!boundingBox) {
              throw new Error(
                `BOUNDING_BOX_FAILED: Could not get bounding box for "${zoomToSelector}"`,
              );
            }

            const padding = 16;
            const left = Math.max(0, Math.floor(boundingBox.x - padding));
            const top = Math.max(0, Math.floor(boundingBox.y - padding));
            const width = Math.floor(boundingBox.width + padding * 2);
            const height = Math.floor(boundingBox.height + padding * 2);

            await sharp(fullPagePath)
              .extract({ left, top, width, height })
              .toFile(imagePath);

            // Clean up full-page temp file
            const { unlinkSync } = await import("fs");
            try {
              unlinkSync(fullPagePath);
            } catch {
              // Non-critical cleanup failure
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
            if (
              error.message.includes("SELECTOR_NOT_FOUND") ||
              error.message.includes("BOUNDING_BOX_FAILED")
            ) {
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

export async function analyzePageStructure(
  url: string,
  contentTypeHint?: ContentTypeHint,
): Promise<PageStructure> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    });
    await page.goto(url, { waitUntil: "load", timeout: 60000 });

    const structure = await page.evaluate((hint?: string) => {
      const getTextContent = (el: Element | null): string => {
        return el?.textContent?.trim() || "";
      };

      const headings: string[] = [];
      document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
        const text = getTextContent(h);
        if (text) headings.push(text);
      });

      const links: string[] = [];
      document.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
          links.push(href);
        }
      });

      const codeBlocks: string[] = [];
      document.querySelectorAll("pre, code").forEach((code) => {
        const text = getTextContent(code);
        if (text && text.length > 20) {
          codeBlocks.push(text.substring(0, 200));
        }
      });

      const semanticRegions: Array<{ name: string; selector: string }> = [];

      const regionSelectors: Record<string, string[]> = {
        documentation: [
          "article",
          ".content",
          ".markdown-body",
          ".docs-content",
          "main",
        ],
        code: ["pre", "code", ".highlight", ".code-block", ".syntax-highlight"],
        article: ["article", "main", ".content", ".post-body"],
      };

      const selectorsToTry =
        hint && regionSelectors[hint]
          ? regionSelectors[hint]
          : [
              "article",
              "main",
              ".content",
              ".docs-content",
              ".markdown-body",
              "pre",
              "code",
            ];

      for (const selector of selectorsToTry) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const text = getTextContent(el);
          if (text && text.length > 100) {
            semanticRegions.push({
              name: `${selector}: ${text.substring(0, 50)}...`,
              selector: selector,
            });
          }
        });
      }

      return { headings, links, codeBlocks, semanticRegions };
    }, contentTypeHint);

    return {
      headings: structure.headings || [],
      links: structure.links || [],
      codeBlocks: structure.codeBlocks || [],
      semanticRegions:
        structure.semanticRegions?.map(
          (r: { name: string; selector: string }) => ({
            name: r.name,
            selector: r.selector,
          }),
        ) || [],
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("net::ERR_NAME_NOT_RESOLVED")) {
        throw new Error(`INVALID_URL: URL could not be resolved - ${url}`);
      }
      if (error.message.includes("Timeout")) {
        throw new Error(`TIMEOUT: Page load exceeded 60 seconds for ${url}`);
      }
      throw new Error(`Failed to analyze page structure: ${error.message}`);
    }
    throw new Error("Failed to analyze page structure: Unknown error");
  } finally {
    await browser.close();
  }
}
