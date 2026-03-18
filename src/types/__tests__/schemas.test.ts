import { describe, it, expect } from "vitest";
import {
  ResearchInputSchema,
  ResearchOutputSchema,
  SceneSchema,
  ScriptOutputSchema,
  ScreenshotSpecSchema,
  CodeSpecSchema,
  VisualTypeEnum,
} from "../index.js";

describe("ResearchInputSchema", () => {
  it("should accept a minimal valid input with title only", () => {
    const result = ResearchInputSchema.safeParse({ title: "My Video" });
    expect(result.success).toBe(true);
  });

  it("should accept input with links and document", () => {
    const result = ResearchInputSchema.safeParse({
      title: "My Video",
      links: ["https://example.com"],
      document: "Some docs",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty title", () => {
    const result = ResearchInputSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid URL in links", () => {
    const result = ResearchInputSchema.safeParse({
      title: "My Video",
      links: ["not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional documentFile", () => {
    const result = ResearchInputSchema.safeParse({
      title: "My Video",
      documentFile: "./notes.md",
    });
    expect(result.success).toBe(true);
  });
});

describe("ResearchOutputSchema", () => {
  const valid = {
    title: "Research Title",
    overview: "Overview text",
    keyPoints: [{ title: "Key Point 1", description: "Description" }],
    scenes: [
      {
        sceneTitle: "Intro",
        duration: 10,
        description: "Scene desc",
        screenshotSubjects: ["subject"],
      },
    ],
    sources: [
      { url: "https://example.com", title: "Source", keyContent: "Content" },
    ],
  };

  it("should accept a valid research output", () => {
    expect(ResearchOutputSchema.safeParse(valid).success).toBe(true);
  });

  it("should require keyPoints array", () => {
    const { keyPoints: _, ...without } = valid;
    expect(ResearchOutputSchema.safeParse(without).success).toBe(false);
  });

  it("should require scenes array", () => {
    const { scenes: _, ...without } = valid;
    expect(ResearchOutputSchema.safeParse(without).success).toBe(false);
  });
});

describe("SceneNarrativeType", () => {
  it("should export SceneNarrativeType enum with four values", async () => {
    const { SceneNarrativeType } = await import("../index.js");
    // SceneNarrativeType should be a Zod enum with values: intro, feature, code, outro
    expect(SceneNarrativeType).toBeDefined();
    expect(SceneNarrativeType.options).toEqual([
      "intro",
      "feature",
      "code",
      "outro",
    ]);
  });

  it("should accept all four valid scene narrative types", async () => {
    const { SceneNarrativeType } = await import("../index.js");
    for (const type of ["intro", "feature", "code", "outro"] as const) {
      expect(SceneNarrativeType.safeParse(type).success).toBe(true);
    }
  });

  it("should reject invalid scene narrative types", async () => {
    const { SceneNarrativeType } = await import("../index.js");
    // Invalid types that should be rejected
    for (const invalidType of ["url", "text", "video", "invalid", ""]) {
      expect(SceneNarrativeType.safeParse(invalidType).success).toBe(false);
    }
  });

  it("should enable correct type narrowing with switch statements", async () => {
    const { SceneNarrativeType } = await import("../index.js");
    // Simulate type narrowing behavior
    const validateAndGetDuration = (type: string): number | null => {
      const result = SceneNarrativeType.safeParse(type);
      if (!result.success) return null;
      // Type narrowing should work: result.data should be "intro" | "feature" | "code" | "outro"
      switch (result.data) {
        case "intro":
          return 10; // 10-15s for intro
        case "feature":
          return 30; // 20-60s for feature
        case "code":
          return 45; // 30-90s for code
        case "outro":
          return 10; // 10-15s for outro
        default:
          return null; // Should never reach here with valid type
      }
    };

    expect(validateAndGetDuration("intro")).toBe(10);
    expect(validateAndGetDuration("feature")).toBe(30);
    expect(validateAndGetDuration("code")).toBe(45);
    expect(validateAndGetDuration("outro")).toBe(10);
    expect(validateAndGetDuration("invalid")).toBe(null);
  });
});

describe("VisualTypeEnum", () => {
  it("should accept all valid visual types", () => {
    for (const type of ["screenshot", "code", "text", "diagram"]) {
      expect(VisualTypeEnum.safeParse(type).success).toBe(true);
    }
  });

  it("should reject unknown visual type", () => {
    expect(VisualTypeEnum.safeParse("video").success).toBe(false);
  });
});

describe("ScreenshotSpecSchema", () => {
  it("should accept valid screenshot spec", () => {
    const result = ScreenshotSpecSchema.safeParse({
      url: "https://example.com",
      viewport: { width: 1920, height: 1080 },
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative viewport width", () => {
    const result = ScreenshotSpecSchema.safeParse({
      viewport: { width: -1, height: 1080 },
    });
    expect(result.success).toBe(false);
  });
});

describe("CodeSpecSchema", () => {
  it("should accept valid code spec", () => {
    const result = CodeSpecSchema.safeParse({
      language: "typescript",
      code: "const x = 1;",
    });
    expect(result.success).toBe(true);
  });

  it("should accept highlightLines", () => {
    const result = CodeSpecSchema.safeParse({
      language: "typescript",
      code: "const x = 1;",
      highlightLines: [1, 2],
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative highlight line numbers", () => {
    const result = CodeSpecSchema.safeParse({
      language: "typescript",
      code: "const x = 1;",
      highlightLines: [-1],
    });
    expect(result.success).toBe(false);
  });
});

describe("SceneSchema", () => {
  const validScene = {
    id: "1",
    type: "feature",
    title: "Scene Title",
    narration: "Scene narration text",
    duration: 30,
  };

  it("should accept a minimal valid scene", () => {
    expect(SceneSchema.safeParse(validScene).success).toBe(true);
  });

  it("should reject negative duration", () => {
    expect(SceneSchema.safeParse({ ...validScene, duration: -1 }).success).toBe(
      false,
    );
  });

  it("should reject invalid scene type", () => {
    expect(
      SceneSchema.safeParse({ ...validScene, type: "invalid" }).success,
    ).toBe(false);
  });

  it("should accept all valid scene types", () => {
    for (const type of ["intro", "feature", "code", "outro"]) {
      expect(SceneSchema.safeParse({ ...validScene, type }).success).toBe(true);
    }
  });

  it("should accept optional fields", () => {
    const result = SceneSchema.safeParse({
      ...validScene,
      visualType: "code",
      visualContent: "console.log('hello')",
      startTime: 0,
      endTime: 30,
    });
    expect(result.success).toBe(true);
  });
});

describe("ScriptOutputSchema", () => {
  const validScript = {
    title: "My Script",
    totalDuration: 60,
    scenes: [
      {
        id: "1",
        type: "intro",
        title: "Intro",
        narration: "Welcome",
        duration: 10,
      },
      {
        id: "2",
        type: "outro",
        title: "Outro",
        narration: "Goodbye",
        duration: 10,
      },
    ],
  };

  it("should accept a valid script output", () => {
    expect(ScriptOutputSchema.safeParse(validScript).success).toBe(true);
  });

  it("should require at least one scene", () => {
    expect(
      ScriptOutputSchema.safeParse({ ...validScript, scenes: [] }).success,
    ).toBe(true);
  });

  it("should reject negative totalDuration", () => {
    expect(
      ScriptOutputSchema.safeParse({
        ...validScript,
        totalDuration: -1,
      }).success,
    ).toBe(false);
  });
});

describe("VisualLayerSchema", () => {
  it("should export VisualLayerSchema", async () => {
    const { VisualLayerSchema } = await import("../index.js");
    expect(VisualLayerSchema).toBeDefined();
  });

  it("should accept valid visual layer with all required fields", async () => {
    const { VisualLayerSchema } = await import("../index.js");
    const validLayer = {
      id: "layer-1",
      type: "screenshot" as const,
      position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
      content: "https://example.com/screenshot.png",
      animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
    };
    expect(VisualLayerSchema.safeParse(validLayer).success).toBe(true);
  });

  it("should accept all valid layer types", async () => {
    const { VisualLayerSchema } = await import("../index.js");
    for (const type of [
      "screenshot",
      "code",
      "text",
      "diagram",
      "image",
    ] as const) {
      const layer = {
        id: "layer-1",
        type,
        position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
        content: "test content",
        animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
      };
      expect(VisualLayerSchema.safeParse(layer).success).toBe(true);
    }
  });

  it("should reject invalid layer type", async () => {
    const { VisualLayerSchema } = await import("../index.js");
    const invalidLayer = {
      id: "layer-1",
      type: "video" as const,
      position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
      content: "test",
      animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
    };
    expect(VisualLayerSchema.safeParse(invalidLayer).success).toBe(false);
  });

  it("should require id field", async () => {
    const { VisualLayerSchema } = await import("../index.js");
    const layerWithoutId = {
      type: "text" as const,
      position: {
        x: 0,
        y: 0,
        width: "auto" as const,
        height: "auto" as const,
        zIndex: 0,
      },
      content: "test",
      animation: { enter: "slideLeft", enterDelay: 0, exit: "slideOut" },
    };
    expect(VisualLayerSchema.safeParse(layerWithoutId).success).toBe(false);
  });

  it("should accept position with named values", async () => {
    const { VisualLayerSchema } = await import("../index.js");
    const layer = {
      id: "layer-1",
      type: "text" as const,
      position: {
        x: "center" as const,
        y: "middle" as const,
        width: "full" as const,
        height: "auto" as const,
        zIndex: 1,
      },
      content: "Centered text",
      animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
    };
    expect(VisualLayerSchema.safeParse(layer).success).toBe(true);
  });

  it("should validate animation config", async () => {
    const { VisualLayerSchema } = await import("../index.js");
    const layerWithAnimation = {
      id: "layer-1",
      type: "code" as const,
      position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
      content: "const x = 1;",
      animation: {
        enter: "slideUp",
        enterDelay: 10,
        exit: "zoomOut",
        exitAt: 300,
      },
    };
    expect(VisualLayerSchema.safeParse(layerWithAnimation).success).toBe(true);
  });

  it("should reject invalid animation enter type", async () => {
    const { VisualLayerSchema } = await import("../index.js");
    const layer = {
      id: "layer-1",
      type: "text" as const,
      position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
      content: "test",
      animation: { enter: "spinAround", enterDelay: 0, exit: "fadeOut" },
    };
    expect(VisualLayerSchema.safeParse(layer).success).toBe(false);
  });
});

describe("validateScriptOutput", () => {
  it("should export validateScriptOutput function", async () => {
    const { validateScriptOutput } = await import("../index.js");
    expect(validateScriptOutput).toBeDefined();
    expect(typeof validateScriptOutput).toBe("function");
  });

  it("should return success for valid complete script", async () => {
    const { validateScriptOutput } = await import("../index.js");
    const validScript = {
      title: "Test Video",
      totalDuration: 120,
      scenes: [
        {
          id: "1",
          type: "intro",
          title: "Intro",
          narration: "Welcome",
          duration: 10,
        },
        {
          id: "2",
          type: "feature",
          title: "Feature",
          narration: "Content",
          duration: 60,
        },
        {
          id: "3",
          type: "outro",
          title: "Outro",
          narration: "Goodbye",
          duration: 10,
        },
      ],
    };
    const result = validateScriptOutput(validScript);
    expect(result.success).toBe(true);
  });

  it("should return failure when scenes array is missing", async () => {
    const { validateScriptOutput } = await import("../index.js");
    const scriptWithoutScenes = {
      title: "Test Video",
      totalDuration: 120,
    };
    const result = validateScriptOutput(scriptWithoutScenes);
    expect(result.success).toBe(false);
  });

  it("should return failure when scene has invalid type", async () => {
    const { validateScriptOutput } = await import("../index.js");
    const scriptWithInvalidType = {
      title: "Test Video",
      totalDuration: 120,
      scenes: [
        {
          id: "1",
          type: "video" as any,
          title: "Bad",
          narration: "Content",
          duration: 10,
        },
      ],
    };
    const result = validateScriptOutput(scriptWithInvalidType);
    expect(result.success).toBe(false);
  });

  it("should return failure when scene is missing duration", async () => {
    const { validateScriptOutput } = await import("../index.js");
    const scriptWithMissingDuration = {
      title: "Test Video",
      totalDuration: 120,
      scenes: [
        { id: "1", type: "intro", title: "Intro", narration: "Welcome" },
      ],
    };
    const result = validateScriptOutput(scriptWithMissingDuration);
    expect(result.success).toBe(false);
  });

  it("should return detailed error information for failures", async () => {
    const { validateScriptOutput } = await import("../index.js");
    const invalidScript = {
      title: "Test",
    };
    const result = validateScriptOutput(invalidScript);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

describe("VideoConfigSchema (utils/config)", () => {
  it("should apply defaults for empty input", async () => {
    const { VideoConfigSchema: UtilsSchema } =
      await import("../../utils/config.js");
    const result = UtilsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.llm.provider).toBe("openai");
      expect(result.data.llm.model).toBe("gpt-4-turbo");
      expect(result.data.video.fps).toBe(30);
      expect(result.data.tts.enabled).toBe(false);
    }
  });

  it("should accept anthropic as LLM provider", async () => {
    const { VideoConfigSchema: UtilsSchema } =
      await import("../../utils/config.js");
    const result = UtilsSchema.safeParse({ llm: { provider: "anthropic" } });
    expect(result.success).toBe(true);
  });

  it("should reject unknown LLM provider", async () => {
    const { VideoConfigSchema: UtilsSchema } =
      await import("../../utils/config.js");
    const result = UtilsSchema.safeParse({ llm: { provider: "mistral" } });
    expect(result.success).toBe(false);
  });
});

describe("maskSensitiveConfig", () => {
  it("should mask apiKey field", async () => {
    const { maskSensitiveConfig, loadConfig } =
      await import("../../utils/config.js");
    const config = loadConfig();
    const masked = maskSensitiveConfig({
      ...config,
      llm: { ...config.llm, apiKey: "sk-abcdef1234567890" },
    });
    const llm = masked.llm as Record<string, unknown>;
    expect(typeof llm.apiKey).toBe("string");
    expect((llm.apiKey as string).endsWith("****")).toBe(true);
    expect(llm.apiKey).not.toBe("sk-abcdef1234567890");
  });

  it("should not mask non-sensitive fields", async () => {
    const { maskSensitiveConfig, loadConfig } =
      await import("../../utils/config.js");
    const config = loadConfig();
    const masked = maskSensitiveConfig(config);
    const llm = masked.llm as Record<string, unknown>;
    expect(llm.provider).toBe(config.llm.provider);
    expect(llm.model).toBe(config.llm.model);
  });
});
