/**
 * Tests for text-position-extractor
 *
 * Verifies that extractTextPositions correctly finds elements on a page
 * and returns their bounding box coordinates.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "http";
import {
  extractTextPositions,
  resolveAnnotationPositions,
  type TextPositionRequest,
} from "../text-position-extractor.js";
import type { Annotation } from "@video-script/types";

// Simple HTTP server to serve test HTML
let server: Server;
let baseUrl: string;

const TEST_HTML = `
<!DOCTYPE html>
<html>
<head><style>
  body { margin: 0; padding: 20px; font-size: 16px; }
  .header { position: absolute; top: 50px; left: 100px; }
  .content { position: absolute; top: 300px; left: 200px; }
  .footer { position: absolute; top: 800px; left: 400px; }
</style></head>
<body>
  <div class="header">USB-C Fast Charging</div>
  <div class="content">The new TypeScript 5.4 features include closures</div>
  <div class="footer">Copyright 2024</div>
</body>
</html>
`;

beforeAll(async () => {
  server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(TEST_HTML);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const addr = server.address();
  if (addr && typeof addr === "object") {
    baseUrl = `http://localhost:${addr.port}`;
  }
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("extractTextPositions", () => {
  it("finds a single text match and returns coordinates", async () => {
    const targets: TextPositionRequest[] = [
      { textMatch: "USB-C" },
    ];

    const results = await extractTextPositions(baseUrl, targets);

    expect(results).toHaveLength(1);
    expect(results[0].textMatch).toBe("USB-C");
    expect(results[0].found).toBe(true);
    expect(results[0].x).toBeDefined();
    expect(results[0].y).toBeDefined();
    // The element is at top: 50px, so y should be near 50
    expect(results[0].y!).toBeGreaterThan(30);
    expect(results[0].y!).toBeLessThan(150);
    // The element is at left: 100px, so x should be > 100
    expect(results[0].x!).toBeGreaterThan(50);
  });

  it("finds multiple text matches at different positions", async () => {
    const targets: TextPositionRequest[] = [
      { textMatch: "USB-C" },
      { textMatch: "TypeScript 5.4" },
      { textMatch: "Copyright" },
    ];

    const results = await extractTextPositions(baseUrl, targets);

    expect(results).toHaveLength(3);

    // All should be found
    expect(results.every((r) => r.found)).toBe(true);

    // USB-C (top: 50px) should be above TypeScript (top: 300px)
    const usbResult = results.find((r) => r.textMatch === "USB-C")!;
    const tsResult = results.find((r) => r.textMatch === "TypeScript 5.4")!;
    expect(usbResult.y!).toBeLessThan(tsResult.y!);

    // Copyright (top: 800px) should be below both
    const copyrightResult = results.find(
      (r) => r.textMatch === "Copyright",
    )!;
    expect(copyrightResult.y!).toBeGreaterThan(tsResult.y!);
  });

  it("returns found: false for text not on the page", async () => {
    const targets: TextPositionRequest[] = [
      { textMatch: "NONEXISTENT_TEXT_XYZ_12345" },
    ];

    const results = await extractTextPositions(baseUrl, targets);

    expect(results).toHaveLength(1);
    expect(results[0].found).toBe(false);
    expect(results[0].x).toBeUndefined();
    expect(results[0].y).toBeUndefined();
  });

  it("handles mix of found and not-found targets", async () => {
    const targets: TextPositionRequest[] = [
      { textMatch: "USB-C" },
      { textMatch: "NONEXISTENT_XYZ" },
    ];

    const results = await extractTextPositions(baseUrl, targets);

    expect(results).toHaveLength(2);
    expect(results[0].found).toBe(true);
    expect(results[1].found).toBe(false);
  });

  it("returns empty array for empty targets", async () => {
    const results = await extractTextPositions(baseUrl, []);
    expect(results).toHaveLength(0);
  });
});

describe("resolveAnnotationPositions", () => {
  it("populates x/y on annotations with textMatch targets", async () => {
    const scenes: Array<{ id: string; annotations: Annotation[] }> = [
      {
        id: "scene-1",
        annotations: [
          {
            type: "circle",
            target: {
              type: "text",
              textMatch: "USB-C",
            },
            style: { color: "attention", size: "medium" },
            narrationBinding: {
              triggerText: "USB-C charging",
              segmentIndex: 0,
              appearAt: 2,
            },
          },
        ],
      },
    ];

    const sourceUrls = new Map<string, string[]>();
    sourceUrls.set("scene-1", [baseUrl]);

    await resolveAnnotationPositions(scenes, sourceUrls);

    expect(scenes[0].annotations[0].target.x).toBeDefined();
    expect(scenes[0].annotations[0].target.y).toBeDefined();
    expect(scenes[0].annotations[0].target.x).toBeGreaterThan(0);
    expect(scenes[0].annotations[0].target.y).toBeGreaterThan(0);
  });

  it("skips annotations that already have x/y coordinates", async () => {
    const scenes: Array<{ id: string; annotations: Annotation[] }> = [
      {
        id: "scene-1",
        annotations: [
          {
            type: "circle",
            target: {
              type: "text",
              textMatch: "USB-C",
              x: 500,
              y: 300,
            },
            style: { color: "attention", size: "medium" },
            narrationBinding: {
              triggerText: "USB-C",
              segmentIndex: 0,
              appearAt: 2,
            },
          },
        ],
      },
    ];

    const sourceUrls = new Map<string, string[]>();
    sourceUrls.set("scene-1", [baseUrl]);

    await resolveAnnotationPositions(scenes, sourceUrls);

    // Should NOT overwrite existing coordinates
    expect(scenes[0].annotations[0].target.x).toBe(500);
    expect(scenes[0].annotations[0].target.y).toBe(300);
  });

  it("skips annotations with region targets", async () => {
    const scenes: Array<{ id: string; annotations: Annotation[] }> = [
      {
        id: "scene-1",
        annotations: [
          {
            type: "circle",
            target: {
              type: "region",
              region: "top-left",
            },
            style: { color: "attention", size: "medium" },
            narrationBinding: {
              triggerText: "something",
              segmentIndex: 0,
              appearAt: 2,
            },
          },
        ],
      },
    ];

    const sourceUrls = new Map<string, string[]>();
    sourceUrls.set("scene-1", [baseUrl]);

    await resolveAnnotationPositions(scenes, sourceUrls);

    // Region targets should not get x/y populated
    expect(scenes[0].annotations[0].target.x).toBeUndefined();
    expect(scenes[0].annotations[0].target.y).toBeUndefined();
  });

  it("handles scenes without annotations gracefully", async () => {
    const scenes: Array<{ id: string; annotations?: Annotation[] }> = [
      {
        id: "scene-1",
      },
    ];

    const sourceUrls = new Map<string, string[]>();
    sourceUrls.set("scene-1", [baseUrl]);

    // Should not throw
    await resolveAnnotationPositions(scenes, sourceUrls);
  });

  it("tries multiple URLs when first fails", async () => {
    const scenes: Array<{ id: string; annotations: Annotation[] }> = [
      {
        id: "scene-1",
        annotations: [
          {
            type: "circle",
            target: {
              type: "text",
              textMatch: "USB-C",
            },
            style: { color: "attention", size: "medium" },
            narrationBinding: {
              triggerText: "USB-C",
              segmentIndex: 0,
              appearAt: 2,
            },
          },
        ],
      },
    ];

    const sourceUrls = new Map<string, string[]>();
    // First URL is invalid, second is valid
    sourceUrls.set("scene-1", [
      "http://invalid-host-that-does-not-exist.local",
      baseUrl,
    ]);

    await resolveAnnotationPositions(scenes, sourceUrls, { timeout: 8000 });

    // Should have fallen back to the working URL
    expect(scenes[0].annotations[0].target.x).toBeDefined();
    expect(scenes[0].annotations[0].target.y).toBeDefined();
  }, 15000);
});
