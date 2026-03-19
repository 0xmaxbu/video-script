import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { createSceneAccumulator, SceneAccumulator } from "../scene-accumulator";

describe("SceneAccumulator", () => {
  let accumulator: SceneAccumulator;
  let testDir: string;

  beforeEach(async () => {
    accumulator = createSceneAccumulator();
    testDir = path.join("/tmp", `scene-accumulator-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  describe("addScene", () => {
    it("should add a new scene", () => {
      const scene = {
        id: "scene-1",
        type: "intro" as const,
        title: "开场",
        narration: "欢迎观看",
        duration: 15,
      };
      const result = accumulator.addScene(scene);
      expect(result).toBe(true);
    });

    it("should return false when adding duplicate scene (幂等检查)", () => {
      const scene = {
        id: "scene-1",
        type: "intro" as const,
        title: "开场",
        narration: "欢迎观看",
        duration: 15,
      };
      accumulator.addScene(scene);
      const result = accumulator.addScene(scene);
      expect(result).toBe(false);
    });

    it("should not overwrite existing scene on duplicate (幂等检查)", () => {
      const scene1 = {
        id: "scene-1",
        type: "intro" as const,
        title: "开场",
        narration: "欢迎观看第一版",
        duration: 15,
      };
      const scene2 = {
        id: "scene-1",
        type: "intro" as const,
        title: "开场（修改版）",
        narration: "欢迎观看第二版",
        duration: 20,
      };
      accumulator.addScene(scene1);
      accumulator.addScene(scene2);
      const script = accumulator.getScript();
      expect(script?.scenes[0].title).toBe("开场");
      expect(script?.scenes[0].narration).toBe("欢迎观看第一版");
    });
  });

  describe("addVisualLayers", () => {
    it("should add visual layers to existing scene", () => {
      const scene = {
        id: "scene-1",
        type: "intro" as const,
        title: "开场",
        narration: "欢迎观看",
        duration: 15,
      };
      accumulator.addScene(scene);
      accumulator.addVisualLayers("scene-1", [
        {
          id: "layer-1",
          type: "screenshot",
          position: {
            x: "center",
            y: "center",
            width: "full",
            height: "auto",
            zIndex: 0,
          },
          content: "https://example.com",
          animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
        },
      ]);
      const script = accumulator.getScript();
      expect(script?.scenes[0].visualLayers).toHaveLength(1);
    });

    it("should not add visual layers to non-existent scene", () => {
      accumulator.addVisualLayers("non-existent", []);
      const script = accumulator.getScript();
      expect(script?.scenes[0].visualLayers).toBeUndefined();
    });
  });

  describe("savePartial (增量保存)", () => {
    it("should save partial script to file", async () => {
      const scene = {
        id: "scene-1",
        type: "intro" as const,
        title: "开场",
        narration: "欢迎观看",
        duration: 15,
      };
      accumulator.addScene(scene);
      const outputPath = path.join(testDir, "partial-script.json");
      await accumulator.savePartial(outputPath);
      const content = await fs.readFile(outputPath, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.scenes).toHaveLength(1);
    });

    it("should preserve all scenes after incremental saves", async () => {
      accumulator.addScene({
        id: "scene-1",
        type: "intro" as const,
        title: "开场",
        narration: "欢迎观看",
        duration: 15,
      });
      accumulator.addScene({
        id: "scene-2",
        type: "feature" as const,
        title: "功能介绍",
        narration: "这个功能是...",
        duration: 45,
      });
      const outputPath = path.join(testDir, "partial-script.json");
      await accumulator.savePartial(outputPath);
      const content = await fs.readFile(outputPath, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.scenes).toHaveLength(2);
    });
  });

  describe("getScript", () => {
    it("should return null when no scenes added", () => {
      expect(accumulator.getScript()).toBeNull();
    });

    it("should return script with scenes", () => {
      accumulator.addScene({
        id: "scene-1",
        type: "intro" as const,
        title: "开场",
        narration: "欢迎观看",
        duration: 15,
      });
      const script = accumulator.getScript();
      expect(script).not.toBeNull();
      expect(script?.scenes).toHaveLength(1);
    });
  });

  describe("reset", () => {
    it("should clear all scenes", () => {
      accumulator.addScene({
        id: "scene-1",
        type: "intro" as const,
        title: "开场",
        narration: "欢迎观看",
        duration: 15,
      });
      accumulator.reset();
      expect(accumulator.getScript()).toBeNull();
    });
  });

  describe("graceful degradation", () => {
    it("should handle empty visual layers gracefully", () => {
      const scene = {
        id: "scene-1",
        type: "intro" as const,
        title: "开场",
        narration: "欢迎观看",
        duration: 15,
        visualLayers: [],
      };
      accumulator.addScene(scene);
      expect(accumulator.getScript()?.scenes[0].visualLayers).toEqual([]);
    });
  });
});
