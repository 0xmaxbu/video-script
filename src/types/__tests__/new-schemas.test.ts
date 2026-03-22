import { describe, it, expect } from "vitest";
import {
  ResearchLinkSchema,
  ResearchSegmentSchema,
  ResearchOutputSchema,
} from "../research.js";
import {
  ScreenshotConfigSchema,
  EffectSchema,
  SceneScriptSchema,
  ScriptOutputSchema,
} from "../script.js";

describe("ResearchLinkSchema", () => {
  it("should accept a valid link", () => {
    expect(
      ResearchLinkSchema.safeParse({
        url: "https://example.com",
        key: "Example",
      }).success,
    ).toBe(true);
  });

  it("should reject invalid URL", () => {
    expect(
      ResearchLinkSchema.safeParse({ url: "not-a-url", key: "Bad" }).success,
    ).toBe(false);
  });

  it("should require key field", () => {
    expect(
      ResearchLinkSchema.safeParse({ url: "https://example.com" }).success,
    ).toBe(false);
  });
});

describe("ResearchSegmentSchema", () => {
  const validSegment = {
    order: 1,
    sentence: "TypeScript generics allow type-safe reuse.",
    keyContent: { concept: "generics" },
    links: [{ url: "https://typescriptlang.org", key: "TS Docs" }],
  };

  it("should accept a valid segment", () => {
    expect(ResearchSegmentSchema.safeParse(validSegment).success).toBe(true);
  });

  it("should reject order = 0 (must be positive)", () => {
    expect(
      ResearchSegmentSchema.safeParse({ ...validSegment, order: 0 }).success,
    ).toBe(false);
  });

  it("should reject empty sentence", () => {
    expect(
      ResearchSegmentSchema.safeParse({ ...validSegment, sentence: "" })
        .success,
    ).toBe(false);
  });

  it("should require at least one link", () => {
    expect(
      ResearchSegmentSchema.safeParse({ ...validSegment, links: [] }).success,
    ).toBe(false);
  });

  it("should accept keyContent as a plain object", () => {
    expect(
      ResearchSegmentSchema.safeParse({
        ...validSegment,
        keyContent: { some: "data" },
      }).success,
    ).toBe(true);
  });
});

describe("ResearchOutputSchema", () => {
  const validSegment = {
    order: 1,
    sentence: "A sentence",
    keyContent: { concept: "test" },
    links: [{ url: "https://example.com", key: "Source" }],
  };

  it("should accept a valid research output", () => {
    expect(
      ResearchOutputSchema.safeParse({
        title: "TypeScript Generics",
        segments: [validSegment],
      }).success,
    ).toBe(true);
  });

  it("should reject empty title", () => {
    expect(
      ResearchOutputSchema.safeParse({
        title: "",
        segments: [validSegment],
      }).success,
    ).toBe(false);
  });

  it("should reject empty segments array", () => {
    expect(
      ResearchOutputSchema.safeParse({
        title: "TypeScript Generics",
        segments: [],
      }).success,
    ).toBe(false);
  });

  it("should enforce max 20 segments", () => {
    const segments = Array.from({ length: 21 }, (_, i) => ({
      ...validSegment,
      order: i + 1,
    }));
    expect(
      ResearchOutputSchema.safeParse({
        title: "TypeScript Generics",
        segments,
      }).success,
    ).toBe(false);
  });

  it("should accept exactly 20 segments", () => {
    const segments = Array.from({ length: 20 }, (_, i) => ({
      ...validSegment,
      order: i + 1,
    }));
    expect(
      ResearchOutputSchema.safeParse({
        title: "TypeScript Generics",
        segments,
      }).success,
    ).toBe(true);
  });
});

describe("ScreenshotConfigSchema", () => {
  it("should apply defaults for empty input", () => {
    const result = ScreenshotConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.background).toBe("#1E1E1E");
      expect(result.data.width).toBe(1920);
      expect(result.data.fontSize).toBe(14);
      expect(result.data.fontFamily).toBe("Fira Code");
    }
  });

  it("should reject zero or negative width", () => {
    expect(ScreenshotConfigSchema.safeParse({ width: 0 }).success).toBe(false);
  });
});

describe("EffectSchema", () => {
  it("should accept codeHighlight effect", () => {
    expect(
      EffectSchema.safeParse({
        type: "codeHighlight",
        lines: [1, 2, 3],
        color: "#FF0000",
        duration: 2,
      }).success,
    ).toBe(true);
  });

  it("should accept textFadeIn effect", () => {
    expect(
      EffectSchema.safeParse({
        type: "textFadeIn",
        direction: "up",
        stagger: 0.1,
      }).success,
    ).toBe(true);
  });

  it("should accept sceneFade effect", () => {
    expect(
      EffectSchema.safeParse({
        type: "sceneFade",
        duration: 0.5,
      }).success,
    ).toBe(true);
  });

  it("should reject unknown effect type", () => {
    expect(
      EffectSchema.safeParse({ type: "wipeLeft", duration: 1 }).success,
    ).toBe(false);
  });

  it("should reject invalid hex color in codeHighlight", () => {
    expect(
      EffectSchema.safeParse({
        type: "codeHighlight",
        lines: [1],
        color: "red",
        duration: 1,
      }).success,
    ).toBe(false);
  });

  it("should reject textFadeIn with invalid direction", () => {
    expect(
      EffectSchema.safeParse({
        type: "textFadeIn",
        direction: "diagonal",
        stagger: 0.1,
      }).success,
    ).toBe(false);
  });

  it("should reject codeZoom with anchor not length 2", () => {
    expect(
      EffectSchema.safeParse({
        type: "codeZoom",
        scale: 1.5,
        anchor: [0.5],
        duration: 1,
      }).success,
    ).toBe(false);
  });
});

describe("SceneScriptSchema", () => {
  const validScene = {
    id: "scene-1",
    type: "intro" as const,
    title: "Introduction",
    narration: "Welcome to the video",
    duration: 10,
  };

  it("should accept a minimal valid scene with new schema", () => {
    expect(SceneScriptSchema.safeParse(validScene).success).toBe(true);
  });

  it("should accept a feature scene with visualLayers", () => {
    expect(
      SceneScriptSchema.safeParse({
        ...validScene,
        id: "feature-1",
        type: "feature",
        title: "Main Feature",
        duration: 30,
      }).success,
    ).toBe(true);
  });

  it("should reject invalid scene type", () => {
    expect(
      SceneScriptSchema.safeParse({ ...validScene, type: "video" as any })
        .success,
    ).toBe(false);
  });

  it("should reject missing required fields", () => {
    expect(
      SceneScriptSchema.safeParse({ id: "scene-1", type: "intro" as const })
        .success,
    ).toBe(false);
  });

  it("should accept scene with fade transition", () => {
    expect(
      SceneScriptSchema.safeParse({
        ...validScene,
        transition: { type: "fade", duration: 0.5 },
      }).success,
    ).toBe(true);
  });

  it("should accept scene with slide transition and direction", () => {
    expect(
      SceneScriptSchema.safeParse({
        ...validScene,
        transition: {
          type: "slide",
          duration: 0.3,
          direction: "from-left" as const,
        },
      }).success,
    ).toBe(true);
  });

  it("should accept scene with wipe transition", () => {
    expect(
      SceneScriptSchema.safeParse({
        ...validScene,
        transition: { type: "wipe", duration: 0.4 },
      }).success,
    ).toBe(true);
  });

  it("should accept scene with none transition", () => {
    expect(
      SceneScriptSchema.safeParse({
        ...validScene,
        transition: { type: "none", duration: 0 },
      }).success,
    ).toBe(true);
  });

  it("should accept scene without transition (optional)", () => {
    expect(SceneScriptSchema.safeParse(validScene).success).toBe(true);
  });

  it("should accept flip transition type (newly added)", () => {
    expect(
      SceneScriptSchema.safeParse({
        ...validScene,
        transition: { type: "flip", duration: 0.5 },
      }).success,
    ).toBe(true);
  });

  it("should reject truly invalid transition type", () => {
    expect(
      SceneScriptSchema.safeParse({
        ...validScene,
        transition: { type: "spin" as any, duration: 0.5 },
      }).success,
    ).toBe(false);
  });

  it("should reject negative transition duration", () => {
    expect(
      SceneScriptSchema.safeParse({
        ...validScene,
        transition: { type: "fade", duration: -0.5 },
      }).success,
    ).toBe(false);
  });
});

describe("ScriptOutputSchema", () => {
  const validScene = {
    id: "scene-1",
    type: "intro" as const,
    title: "Introduction",
    narration: "Welcome",
    duration: 10,
  };

  it("should accept a minimal valid script with new schema", () => {
    expect(
      ScriptOutputSchema.safeParse({
        title: "My Script",
        totalDuration: 60,
        scenes: [validScene],
      }).success,
    ).toBe(true);
  });

  it("should reject empty scenes array", () => {
    expect(
      ScriptOutputSchema.safeParse({
        title: "My Script",
        totalDuration: 60,
        scenes: [],
      }).success,
    ).toBe(false);
  });

  it("should accept script with scene-level transitions", () => {
    expect(
      ScriptOutputSchema.safeParse({
        title: "My Script",
        totalDuration: 60,
        scenes: [
          { ...validScene, transition: { type: "fade", duration: 0.5 } },
          {
            ...validScene,
            id: "scene-2",
            transition: { type: "slide", duration: 0.3 },
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("should reject top-level transitions array (old Schema A format)", () => {
    expect(
      ScriptOutputSchema.safeParse({
        title: "My Script",
        totalDuration: 60,
        scenes: [validScene],
        transitions: [{ from: 1, to: 2, type: "sceneFade", duration: 0.3 }],
      }).success,
    ).toBe(false);
  });
});
