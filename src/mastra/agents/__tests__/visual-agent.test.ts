import { describe, it, expect } from "vitest";
import {
  recommendLayout,
  selectAnnotationColor,
  selectAnnotationType,
  generateVisualPrompt,
} from "../visual-agent.js";

describe("Visual Agent - Utility Functions", () => {
  describe("recommendLayout", () => {
    it("should recommend hero-fullscreen for intro", () => {
      expect(recommendLayout("intro", false)).toBe("hero-fullscreen");
    });

    it("should recommend code-focus for code scenes", () => {
      expect(recommendLayout("code", true)).toBe("code-focus");
    });

    it("should recommend split-horizontal for feature with code", () => {
      expect(recommendLayout("feature", true)).toBe("split-horizontal");
    });

    it("should recommend text-over-image for feature without code", () => {
      expect(recommendLayout("feature", false)).toBe("text-over-image");
    });

    it("should recommend bullet-list for outro", () => {
      expect(recommendLayout("outro", false)).toBe("bullet-list");
    });
  });

  describe("selectAnnotationColor", () => {
    it("should select attention for critical importance", () => {
      expect(selectAnnotationColor("critical")).toBe("attention");
    });

    it("should select highlight for high importance", () => {
      expect(selectAnnotationColor("high")).toBe("highlight");
    });

    it("should select info for medium importance", () => {
      expect(selectAnnotationColor("medium")).toBe("info");
    });
  });

  describe("selectAnnotationType", () => {
    it("should pass through annotation suggestions", () => {
      expect(selectAnnotationType("circle")).toBe("circle");
      expect(selectAnnotationType("underline")).toBe("underline");
      expect(selectAnnotationType("highlight")).toBe("highlight");
      expect(selectAnnotationType("number")).toBe("number");
    });
  });

  describe("generateVisualPrompt", () => {
    const sampleScript = { scenes: [{ id: "s1", type: "intro" }] };
    const sampleResearch = "# Research\n\nSome research content.";

    it("should include script and research content in prompt", () => {
      const prompt = generateVisualPrompt(sampleScript, sampleResearch);
      expect(prompt).toContain("intro");
      expect(prompt).toContain("Some research content");
    });

    it("should not include Previously Used Layouts section when usedLayouts is empty", () => {
      const prompt = generateVisualPrompt(sampleScript, sampleResearch);
      expect(prompt).not.toContain("Previously Used Layouts");
    });

    it("should not include Previously Used Layouts section when usedLayouts is not provided", () => {
      const prompt = generateVisualPrompt(
        sampleScript,
        sampleResearch,
        undefined,
      );
      expect(prompt).not.toContain("Previously Used Layouts");
    });

    it("should include Previously Used Layouts section when usedLayouts is non-empty", () => {
      const prompt = generateVisualPrompt(sampleScript, sampleResearch, [
        "hero-fullscreen",
      ]);
      expect(prompt).toContain("Previously Used Layouts");
      expect(prompt).toContain("hero-fullscreen");
    });

    it("should list all used layouts in the section", () => {
      const usedLayouts = ["hero-fullscreen", "code-focus", "split-horizontal"];
      const prompt = generateVisualPrompt(
        sampleScript,
        sampleResearch,
        usedLayouts,
      );
      expect(prompt).toContain("hero-fullscreen");
      expect(prompt).toContain("code-focus");
      expect(prompt).toContain("split-horizontal");
    });

    it("should instruct agent not to repeat used layouts", () => {
      const prompt = generateVisualPrompt(sampleScript, sampleResearch, [
        "hero-fullscreen",
      ]);
      // Should contain instruction to avoid used layouts
      expect(prompt).toMatch(/do not|avoid|different/i);
    });
  });
});
