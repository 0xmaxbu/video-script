import { describe, it, expect } from "vitest";
import {
  DEFAULT_SELECTORS,
  isInformationalScreenshot,
  getSelectors,
  generateFilename,
  parseMediaResources,
} from "../screenshot-agent.js";

describe("Screenshot Agent - Utility Functions", () => {
  describe("DEFAULT_SELECTORS", () => {
    it("should have selectors for all informational types", () => {
      expect(DEFAULT_SELECTORS.headline).toBeDefined();
      expect(DEFAULT_SELECTORS.article).toBeDefined();
      expect(DEFAULT_SELECTORS.documentation).toBeDefined();
      expect(DEFAULT_SELECTORS.codeSnippet).toBeDefined();
      expect(DEFAULT_SELECTORS.changelog).toBeDefined();
      expect(DEFAULT_SELECTORS.feature).toBeDefined();
    });

    it("should have multiple fallback selectors for each type", () => {
      for (const type of Object.keys(DEFAULT_SELECTORS)) {
        expect(DEFAULT_SELECTORS[type].length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe("isInformationalScreenshot", () => {
    it("should return true for informational types", () => {
      expect(isInformationalScreenshot("headline")).toBe(true);
      expect(isInformationalScreenshot("article")).toBe(true);
      expect(isInformationalScreenshot("documentation")).toBe(true);
      expect(isInformationalScreenshot("codeSnippet")).toBe(true);
      expect(isInformationalScreenshot("changelog")).toBe(true);
      expect(isInformationalScreenshot("feature")).toBe(true);
    });

    it("should return false for decorative types", () => {
      expect(isInformationalScreenshot("hero")).toBe(false);
      expect(isInformationalScreenshot("ambient")).toBe(false);
    });
  });

  describe("getSelectors", () => {
    it("should return custom selector when provided", () => {
      const selectors = getSelectors("headline", ".custom-title");
      expect(selectors).toEqual([".custom-title"]);
    });

    it("should return default selectors for informational types", () => {
      const selectors = getSelectors("headline");
      expect(selectors).toContain("h1");
      expect(selectors.length).toBeGreaterThan(1);
    });

    it("should return empty array for decorative types", () => {
      const selectors = getSelectors("hero");
      expect(selectors).toEqual([]);
    });
  });

  describe("generateFilename", () => {
    it("should generate correct filename format", () => {
      const filename = generateFilename("scene-1", "shot-1");
      expect(filename).toBe("scene-1-shot-1.png");
    });

    it("should handle different IDs", () => {
      expect(generateFilename("intro", "main")).toBe("intro-main.png");
      expect(generateFilename("scene-code-1", "code-block")).toBe(
        "scene-code-1-code-block.png",
      );
    });
  });

  describe("parseMediaResources", () => {
    it("should extract all resources from visual plan", () => {
      const visualPlan = {
        scenes: [
          {
            sceneId: "scene-1",
            mediaResources: [
              { id: "shot-1", type: "hero", url: "https://example.com" },
            ],
          },
          {
            sceneId: "scene-2",
            mediaResources: [
              { id: "shot-2", type: "headline", url: "https://example.com/blog", selector: "h1" },
            ],
          },
        ],
      };

      const resources = parseMediaResources(visualPlan);

      expect(resources).toHaveLength(2);
      expect(resources[0].sceneId).toBe("scene-1");
      expect(resources[0].filename).toBe("scene-1-shot-1.png");
      expect(resources[1].selector).toBe("h1");
    });

    it("should handle empty scenes", () => {
      const visualPlan = {
        scenes: [],
      };

      const resources = parseMediaResources(visualPlan);
      expect(resources).toHaveLength(0);
    });

    it("should handle scenes with no resources", () => {
      const visualPlan = {
        scenes: [
          { sceneId: "scene-1", mediaResources: [] },
        ],
      };

      const resources = parseMediaResources(visualPlan);
      expect(resources).toHaveLength(0);
    });
  });
});
