/**
 * Text Position Extractor
 *
 * Uses Playwright to find element positions on a web page that match given
 * text strings. Returns bounding box coordinates that can be injected into
 * annotation targets for precise positioning.
 *
 * This bridges the gap between the script agent's textMatch annotations and
 * the renderer's need for pixel coordinates. The Playwright browser context
 * has full DOM access, so we can locate text nodes and get their bounding
 * boxes relative to the viewport.
 */

import { chromium } from "playwright";
import type { Annotation } from "@video-script/types";

export interface TextPositionRequest {
  /** The text to search for on the page (from annotation.target.textMatch) */
  textMatch: string;
}

export interface TextPositionResult {
  /** The textMatch that was searched for */
  textMatch: string;
  /** Whether the text was found on the page */
  found: boolean;
  /** Center x coordinate of the matched element (pixels, in page coordinates) */
  x?: number;
  /** Center y coordinate of the matched element (pixels, in page coordinates) */
  y?: number;
  /** Width of the matched element bounding box */
  width?: number;
  /** Height of the matched element bounding box */
  height?: number;
}

/**
 * Extract bounding box positions for text strings on a web page.
 *
 * Opens the page in Playwright, searches the DOM for elements containing
 * each textMatch string, and returns the center coordinates of their
 * bounding boxes.
 *
 * The coordinates are in page pixels (not viewport pixels), which means
 * they work correctly with the renderer's web-page pan mode (naturalSize)
 * where annotations are rendered inside the same transform group as the
 * full-page screenshot.
 *
 * For traditional Ken Burns mode (screenshot scaled to fit 1920x1080),
 * coordinates are normalized to the 1920x1080 viewport.
 *
 * @param url - The page URL to extract positions from
 * @param targets - Array of text strings to locate
 * @param options - Optional: viewport size, fullPage capture mode
 */
export async function extractTextPositions(
  url: string,
  targets: TextPositionRequest[],
  options?: {
    viewport?: { width: number; height: number };
    fullPage?: boolean;
    timeout?: number;
  },
): Promise<TextPositionResult[]> {
  if (targets.length === 0) return [];

  const viewport = options?.viewport ?? { width: 1920, height: 1080 };
  const timeout = options?.timeout ?? 10000;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport });
    await page.goto(url, { waitUntil: "load", timeout });

    // Evaluate all text positions in a single page.evaluate call for efficiency
    const results: TextPositionResult[] = await page.evaluate(
      ({ targets, fullPage }) => {
        return targets.map((target: { textMatch: string }) => {
          const searchText = target.textMatch;

          // Strategy 1: Find element whose direct text content contains the search text
          // We walk all visible elements and find the smallest one that contains the text.
          const allElements = document.querySelectorAll("*");
          let bestElement: Element | null = null;
          let bestArea = Infinity;

          for (const el of allElements) {
            // Skip hidden elements
            const style = window.getComputedStyle(el);
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              style.opacity === "0"
            ) {
              continue;
            }

            // Check if this element's DIRECT text content contains the search text
            // (not just inherited from children)
            const directText = Array.from(el.childNodes)
              .filter((node) => node.nodeType === Node.TEXT_NODE)
              .map((node) => node.textContent || "")
              .join("");

            const fullText = el.textContent || "";

            // Element must contain the text
            if (!fullText.includes(searchText)) continue;

            // Prefer elements where the text is in direct text nodes (more precise)
            const hasDirectText = directText.includes(searchText);

            const rect = el.getBoundingClientRect();
            const area = rect.width * rect.height;

            // Skip zero-size elements
            if (area === 0) continue;

            // Prefer: (1) elements with direct text match, (2) smallest elements
            const score = hasDirectText ? 0 : 1;
            const weightedArea = area + score * 1000000;

            if (weightedArea < bestArea) {
              bestArea = weightedArea;
              bestElement = el;
            }
          }

          if (!bestElement) {
            return { textMatch: searchText, found: false };
          }

          const rect = bestElement.getBoundingClientRect();

          // If the element's text is longer than the search text, try to find
          // the specific text range within the element for more precise positioning.
          // This handles cases where the element contains a paragraph and we
          // only want to highlight a specific phrase within it.
          const elementText = bestElement.textContent || "";
          let xOffset = 0;
          let matchWidth = rect.width;

          if (
            elementText.length > searchText.length * 2 &&
            rect.width > 200
          ) {
            // The text is much longer than our target. Estimate position within
            // the element based on character offset.
            const charIndex = elementText.indexOf(searchText);
            if (charIndex >= 0) {
              const relativeOffset = charIndex / elementText.length;
              const matchEnd =
                (charIndex + searchText.length) / elementText.length;
              xOffset = rect.width * relativeOffset;
              matchWidth = rect.width * (matchEnd - relativeOffset);
            }
          }

          // For fullPage screenshots, we need coordinates relative to the
          // document, not the viewport. getBoundingClientRect returns viewport
          // coordinates, so we add scroll offsets.
          const scrollX = fullPage ? window.scrollX : 0;
          const scrollY = fullPage ? window.scrollY : 0;

          // Return the center of the matched region
          const cx = rect.left + scrollX + xOffset + matchWidth / 2;
          const cy = rect.top + scrollY + rect.height / 2;

          return {
            textMatch: searchText,
            found: true,
            x: Math.round(cx),
            y: Math.round(cy),
            width: Math.round(matchWidth),
            height: Math.round(rect.height),
          };
        });
      },
      { targets, fullPage: options?.fullPage ?? false },
    );

    return results;
  } catch (error) {
    // If extraction fails, return not-found for all targets
    return targets.map((t) => ({
      textMatch: t.textMatch,
      found: false,
    }));
  } finally {
    await browser.close();
  }
}

/**
 * Resolve annotation targets to pixel coordinates by extracting text positions
 * from the source page.
 *
 * This function takes scenes with annotations that have textMatch targets,
 * opens the source page, finds the element positions, and injects x/y
 * coordinates into the annotation targets.
 *
 * Only modifies annotations that have type="text" and no existing x/y.
 *
 * @param scenesWithAnnotations - Scenes that may have annotations needing resolution
 * @param sourceUrls - Map of sceneId to source URL for position extraction
 */
export async function resolveAnnotationPositions(
  scenesWithAnnotations: Array<{
    id: string;
    annotations?: Annotation[] | undefined;
  }>,
  sourceUrls: Map<string, string[]>,
  options?: { timeout?: number },
): Promise<void> {
  // Group annotations by scene to batch position extraction
  for (const scene of scenesWithAnnotations) {
    if (!scene.annotations || scene.annotations.length === 0) continue;

    const urls = sourceUrls.get(scene.id);
    if (!urls || urls.length === 0) continue;

    // Collect all text targets that need resolution
    const textTargets: TextPositionRequest[] = [];
    const annotationIndices: number[] = [];

    for (let i = 0; i < scene.annotations.length; i++) {
      const ann = scene.annotations[i];
      if (
        ann.target.type === "text" &&
        ann.target.textMatch &&
        ann.target.x === undefined &&
        ann.target.y === undefined
      ) {
        textTargets.push({ textMatch: ann.target.textMatch });
        annotationIndices.push(i);
      }
    }

    if (textTargets.length === 0) continue;

    // Try each URL until we find positions
    for (const url of urls) {
      try {
        const positions = await extractTextPositions(url, textTargets, {
          ...(options?.timeout !== undefined && { timeout: options.timeout }),
        });

        let foundAny = false;
        for (let j = 0; j < positions.length; j++) {
          const pos = positions[j];
          const annIndex = annotationIndices[j];

          if (pos.found && pos.x !== undefined && pos.y !== undefined) {
            (scene.annotations[annIndex].target as { x?: number; y?: number }).x = pos.x;
            (scene.annotations[annIndex].target as { x?: number; y?: number }).y = pos.y;
            foundAny = true;
          }
        }

        if (foundAny) break; // Found positions with this URL, no need to try others
      } catch {
        // Try next URL
        continue;
      }
    }
  }
}
