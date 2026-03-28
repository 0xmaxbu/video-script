/**
 * quality-hook-extraction.test.ts
 *
 * Verifies that `augmentScreenshotLayers` and `generateWebPageWaypoints`
 * are exported from src/utils/augment-screenshot-layers.ts and behave
 * correctly — not defined inline in src/cli/index.ts.
 *
 * Tests are pure-logic (no sharp I/O), covering the waypoint generator only.
 * The augmentScreenshotLayers function is validated for its public contract
 * without real image files.
 */

import { describe, it, expect } from "vitest";
import {
  generateWebPageWaypoints,
  augmentScreenshotLayers,
} from "../../utils/augment-screenshot-layers.js";

describe("generateWebPageWaypoints", () => {
  const FPS = 30;

  it("exports generateWebPageWaypoints as a named export", () => {
    expect(typeof generateWebPageWaypoints).toBe("function");
  });

  it("returns a single static waypoint when image fits in frame (h ≤ 1080)", () => {
    const waypoints = generateWebPageWaypoints(1920, 1080, 5, FPS);
    expect(waypoints).toHaveLength(1);
    expect(waypoints[0].focalX).toBe(0.5);
    expect(waypoints[0].focalY).toBe(0.5);
    expect(waypoints[0].holdFrames).toBe(150); // 5 * 30
    expect(waypoints[0].travelFrames).toBeUndefined();
  });

  it("returns a single static waypoint for portrait images smaller than 1080px tall", () => {
    const waypoints = generateWebPageWaypoints(800, 600, 3, FPS);
    expect(waypoints).toHaveLength(1);
  });

  it("returns overview + N section waypoints for tall pages", () => {
    // 3240 px → ceil(3240/1080) = 3 sections → 1 overview + 3 section = 4
    const waypoints = generateWebPageWaypoints(1920, 3240, 10, FPS);
    expect(waypoints.length).toBe(4);
  });

  it("overview waypoint uses overview scale (< 1 for tall images)", () => {
    const waypoints = generateWebPageWaypoints(1920, 3240, 10, FPS);
    const overview = waypoints[0];
    expect(overview.scale).toBeLessThan(1);
  });

  it("section waypoints use scale = 1.0", () => {
    const waypoints = generateWebPageWaypoints(1920, 3240, 10, FPS);
    for (const wp of waypoints.slice(1)) {
      expect(wp.scale).toBe(1.0);
    }
  });

  it("all section waypoints have travelFrames defined", () => {
    const waypoints = generateWebPageWaypoints(1920, 3240, 10, FPS);
    // Overview waypoint has travelFrames (zoom from overview to first section)
    expect(waypoints[0].travelFrames).toBeDefined();
    // Section waypoints also have travelFrames
    for (const wp of waypoints.slice(1)) {
      expect(wp.travelFrames).toBeDefined();
    }
  });

  it("caps effective height at MAX_WEB_HEIGHT (5400) for very tall pages", () => {
    // 10800 px → capped to 5400 → ceil(5400/1080) = 5 sections
    const waypoints = generateWebPageWaypoints(1920, 10800, 20, FPS);
    expect(waypoints.length).toBe(6); // 1 overview + 5 sections
  });

  it("focalY values stay within [0, 1]", () => {
    const waypoints = generateWebPageWaypoints(1920, 5400, 20, FPS);
    for (const wp of waypoints) {
      expect(wp.focalY).toBeGreaterThanOrEqual(0);
      expect(wp.focalY).toBeLessThanOrEqual(1);
    }
  });

  it("total holdFrames across all waypoints is close to totalFrames", () => {
    const duration = 10;
    const fps = 30;
    const totalFrames = duration * fps; // 300
    const waypoints = generateWebPageWaypoints(1920, 3240, duration, fps);
    const sumHold = waypoints.reduce((s, w) => s + w.holdFrames, 0);
    // Sum of holds should be meaningfully less than total (travel frames take up some)
    expect(sumHold).toBeLessThanOrEqual(totalFrames);
    expect(sumHold).toBeGreaterThan(0);
  });
});

describe("augmentScreenshotLayers", () => {
  it("exports augmentScreenshotLayers as a named export", () => {
    expect(typeof augmentScreenshotLayers).toBe("function");
  });

  it("returns scenes unchanged when there are no visual layers", async () => {
    const scenes = [
      {
        id: "scene-1",
        type: "intro" as const,
        title: "Intro",
        narration: "Hello",
        duration: 5,
        visualLayers: [],
      },
    ];
    const result = await augmentScreenshotLayers(scenes, {}, 30);
    expect(result).toHaveLength(1);
    expect(result[0].visualLayers).toHaveLength(0);
  });

  it("returns scenes unchanged when no screenshot layer has a matching image path", async () => {
    const scenes = [
      {
        id: "scene-1",
        type: "feature" as const,
        title: "Feature",
        narration: "See this",
        duration: 5,
        visualLayers: [
          {
            id: "layer-1",
            type: "screenshot" as const,
            content: "https://example.com",
            position: {
              x: "center" as const,
              y: "center" as const,
              width: "full" as const,
              height: "full" as const,
              zIndex: 0,
            },
            animation: {
              enter: "fadeIn" as const,
              enterDelay: 0,
              exit: "none" as const,
            },
          },
        ],
      },
    ];
    // No image path provided → layer is returned as-is (no naturalSize injected)
    const result = await augmentScreenshotLayers(scenes, {}, 30);
    expect(result[0].visualLayers![0]).not.toHaveProperty("naturalSize");
  });

  it("leaves non-screenshot layers completely untouched", async () => {
    const scenes = [
      {
        id: "scene-1",
        type: "code" as const,
        title: "Code",
        narration: "Look at this code",
        duration: 5,
        visualLayers: [
          {
            id: "layer-code",
            type: "code" as const,
            content: "const x = 1;",
            position: {
              x: "center" as const,
              y: "center" as const,
              width: "full" as const,
              height: "full" as const,
              zIndex: 0,
            },
            animation: {
              enter: "fadeIn" as const,
              enterDelay: 0,
              exit: "none" as const,
            },
          },
        ],
      },
    ];
    const result = await augmentScreenshotLayers(scenes, {}, 30);
    expect(result[0].visualLayers![0].type).toBe("code");
    expect(result[0].visualLayers![0]).not.toHaveProperty("naturalSize");
  });
});
