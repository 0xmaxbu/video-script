import { describe, it, expect } from "vitest";
import {
  ResearchLinkSchema,
  ResearchSegmentSchema,
  ResearchOutputSchema,
} from "../research.js";
import {
  ScreenshotConfigSchema,
  EffectSchema,
  TransitionSchema,
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
    keyContent: '{"concept":"generics"}',
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

  it("should accept keyContent as a string (JSON serialized)", () => {
    expect(
      ResearchSegmentSchema.safeParse({
        ...validSegment,
        keyContent: '{"some":"data"}',
      }).success,
    ).toBe(true);
  });
});

describe("ResearchOutputSchema", () => {
  const validSegment = {
    order: 1,
    sentence: "A sentence",
    keyContent: "{}",
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

// ─── EffectSchema ─────────────────────────────────────────────────────────────

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
        color: "red", // not a valid #RRGGBB
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
        anchor: [0.5], // should be length 2
        duration: 1,
      }).success,
    ).toBe(false);
  });
});

// ─── TransitionSchema ─────────────────────────────────────────────────────────

describe("TransitionSchema", () => {
  it("should accept a valid transition", () => {
    expect(
      TransitionSchema.safeParse({
        from: 1,
        to: 2,
        type: "sceneFade",
        duration: 0.3,
      }).success,
    ).toBe(true);
  });

  it("should reject invalid transition type", () => {
    expect(
      TransitionSchema.safeParse({
        from: 1,
        to: 2,
        type: "wipe",
        duration: 0.3,
      }).success,
    ).toBe(false);
  });

  it("should reject duration below 0.1", () => {
    expect(
      TransitionSchema.safeParse({
        from: 1,
        to: 2,
        type: "sceneFade",
        duration: 0.05,
      }).success,
    ).toBe(false);
  });

  it("should reject negative from/to values", () => {
    expect(
      TransitionSchema.safeParse({
        from: 0,
        to: 1,
        type: "sceneFade",
        duration: 0.5,
      }).success,
    ).toBe(false);
  });
});

// ─── SceneScriptSchema ────────────────────────────────────────────────────────

describe("SceneScriptSchema", () => {
  const validScene = {
    order: 1,
    segmentOrder: 1,
    type: "url" as const,
    content: "https://typescriptlang.org",
  };

  it("should accept a minimal valid scene (url type)", () => {
    expect(SceneScriptSchema.safeParse(validScene).success).toBe(true);
  });

  it("should accept a text scene with effects", () => {
    expect(
      SceneScriptSchema.safeParse({
        ...validScene,
        type: "text",
        content: "Some narration text",
        effects: [{ type: "textFadeIn", direction: "up", stagger: 0.1 }],
      }).success,
    ).toBe(true);
  });

  it("should reject invalid scene type", () => {
    expect(
      SceneScriptSchema.safeParse({ ...validScene, type: "video" }).success,
    ).toBe(false);
  });

  it("should reject order = 0", () => {
    expect(
      SceneScriptSchema.safeParse({ ...validScene, order: 0 }).success,
    ).toBe(false);
  });
});

// ─── ScriptOutputSchema ───────────────────────────────────────────────────────

describe("ScriptOutputSchema", () => {
  const validScene = {
    order: 1,
    segmentOrder: 1,
    type: "url" as const,
    content: "https://example.com",
  };

  it("should accept a minimal valid script", () => {
    expect(
      ScriptOutputSchema.safeParse({
        title: "My Script",
        scenes: [validScene],
      }).success,
    ).toBe(true);
  });

  it("should reject empty scenes array", () => {
    expect(
      ScriptOutputSchema.safeParse({
        title: "My Script",
        scenes: [],
      }).success,
    ).toBe(false);
  });

  it("should enforce max 30 scenes", () => {
    const scenes = Array.from({ length: 31 }, (_, i) => ({
      ...validScene,
      order: i + 1,
    }));
    expect(
      ScriptOutputSchema.safeParse({
        title: "My Script",
        scenes,
      }).success,
    ).toBe(false);
  });

  it("should accept exactly 30 scenes", () => {
    const scenes = Array.from({ length: 30 }, (_, i) => ({
      ...validScene,
      order: i + 1,
    }));
    expect(
      ScriptOutputSchema.safeParse({
        title: "My Script",
        scenes,
      }).success,
    ).toBe(true);
  });

  it("should accept optional transitions", () => {
    expect(
      ScriptOutputSchema.safeParse({
        title: "My Script",
        scenes: [validScene],
        transitions: [{ from: 1, to: 2, type: "sceneFade", duration: 0.3 }],
      }).success,
    ).toBe(true);
  });
});
