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
