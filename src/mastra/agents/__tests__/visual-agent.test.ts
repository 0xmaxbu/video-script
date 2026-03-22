import { describe, it, expect } from "vitest";
import {
  recommendLayout,
  selectAnnotationColor,
  selectAnnotationType,
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
});
