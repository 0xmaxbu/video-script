import { describe, it, expect } from "vitest";
import {
  adaptScriptForRenderer,
  adaptSceneForRenderer,
} from "../scene-adapter.js";
import type { SceneScript } from "../../types/script.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(
  __dirname,
  "..",
  "..",
  "mastra",
  "agents",
  "__tests__",
  "fixtures",
);

function loadFixture(name: string) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf-8"));
}

const baseScene: SceneScript = {
  id: "scene-1",
  type: "intro",
  title: "Test",
  narration: "Test narration",
  duration: 10,
  visualLayers: [],
};

describe("adaptSceneForRenderer", () => {
  it("converts mediaResources to visualLayers with type screenshot", () => {
    const visualScene = {
      sceneId: "scene-1",
      mediaResources: [
        {
          id: "hero-image",
          type: "hero" as const,
          url: "https://example.com/hero.png",
          role: "primary" as const,
          narrationBinding: {
            triggerText: "welcome",
            segmentIndex: 0,
            appearAt: 0,
          },
        },
      ],
    };
    const result = adaptSceneForRenderer(baseScene, visualScene);
    expect(result.visualLayers).toHaveLength(1);
    expect(result.visualLayers![0].type).toBe("screenshot");
    expect(result.visualLayers![0].content).toBe(
      "https://example.com/hero.png",
    );
    expect(result.visualLayers![0].animation.enterDelay).toBe(0);
  });

  it("converts textElements to visualLayers with type text", () => {
    const visualScene = {
      sceneId: "scene-1",
      textElements: [
        {
          content: "Welcome",
          role: "title" as const,
          position: "top" as const,
          narrationBinding: {
            triggerText: "welcome",
            segmentIndex: 0,
            appearAt: 1.5,
          },
        },
      ],
    };
    const result = adaptSceneForRenderer(baseScene, visualScene);
    expect(result.visualLayers).toHaveLength(1);
    expect(result.visualLayers![0].type).toBe("text");
    expect(result.visualLayers![0].content).toBe("Welcome");
    expect(result.visualLayers![0].position.x).toBe("center");
    expect(result.visualLayers![0].position.y).toBe("top");
  });

  it("maps all 5 text positions correctly", () => {
    const positions: Array<{
      pos: "top" | "center" | "bottom" | "left" | "right";
      expectX: string;
      expectY: string;
    }> = [
      { pos: "left", expectX: "left", expectY: "center" },
      { pos: "right", expectX: "right", expectY: "center" },
      { pos: "top", expectX: "center", expectY: "top" },
      { pos: "center", expectX: "center", expectY: "center" },
      { pos: "bottom", expectX: "center", expectY: "bottom" },
    ];
    for (const { pos, expectX, expectY } of positions) {
      const visualScene = {
        sceneId: "scene-1",
        textElements: [
          {
            content: "Test",
            role: "bullet" as const,
            position: pos,
            narrationBinding: {
              triggerText: "test",
              segmentIndex: 0,
              appearAt: 0,
            },
          },
        ],
      };
      const result = adaptSceneForRenderer(baseScene, visualScene);
      expect(result.visualLayers![0].position.x).toBe(expectX);
      expect(result.visualLayers![0].position.y).toBe(expectY);
    }
  });

  it("preserves existing visualLayers when no visualScene data", () => {
    const sceneWithLayers: SceneScript = {
      ...baseScene,
      visualLayers: [
        {
          id: "existing",
          type: "code",
          position: {
            x: 0,
            y: 0,
            width: "full",
            height: "full",
            zIndex: 1,
          },
          content: "code()",
          animation: { enter: "none", enterDelay: 0, exit: "none" },
        },
      ],
    };
    const result = adaptSceneForRenderer(sceneWithLayers, {
      sceneId: "scene-1",
    });
    expect(result.visualLayers).toHaveLength(1);
    expect(result.visualLayers![0].id).toBe("existing");
  });

  it("merges both mediaResources and textElements", () => {
    const visualScene = {
      sceneId: "scene-1",
      mediaResources: [
        {
          id: "img1",
          type: "hero" as const,
          url: "https://example.com/img.png",
          role: "primary" as const,
          narrationBinding: {
            triggerText: "img",
            segmentIndex: 0,
            appearAt: 0,
          },
        },
      ],
      textElements: [
        {
          content: "Title",
          role: "title" as const,
          position: "top" as const,
          narrationBinding: {
            triggerText: "title",
            segmentIndex: 0,
            appearAt: 0,
          },
        },
      ],
    };
    const result = adaptSceneForRenderer(baseScene, visualScene);
    expect(result.visualLayers).toHaveLength(2);
    expect(result.visualLayers![0].type).toBe("screenshot");
    expect(result.visualLayers![1].type).toBe("text");
  });
});

describe("adaptScriptForRenderer", () => {
  it("merges visual.json mediaResources + textElements into visualLayers", () => {
    const script = loadFixture("sample-script.json");
    const visualPlan = loadFixture("sample-visual.json");
    const result = adaptScriptForRenderer(script, visualPlan);
    expect(result.scenes).toHaveLength(2);
    expect(result.scenes[0].visualLayers).toBeDefined();
    expect(result.scenes[0].visualLayers!.length).toBeGreaterThanOrEqual(1);
    expect(result.scenes[0].layoutTemplate).toBe("hero-fullscreen");
    expect(result.scenes[1].layoutTemplate).toBe("split-vertical");
  });

  it("without visual.json preserves existing visualLayers", () => {
    const script = loadFixture("sample-script.json");
    const result = adaptScriptForRenderer(script, undefined);
    expect(result.scenes).toHaveLength(2);
    expect(result.scenes[0].visualLayers).toEqual([]);
  });

  it("recalculates totalDuration from scene durations", () => {
    const script = loadFixture("sample-script.json");
    const result = adaptScriptForRenderer(script, undefined);
    expect(result.totalDuration).toBe(20);
  });
});
