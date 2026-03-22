import { describe, it, expect } from "vitest";

import {
  // 信息重要性
  InfoPriorityEnum,
  InfoPriority,

  // 截图类型
  ScreenshotTypeEnum,
  ScreenshotType,
  ScreenshotResourceSchema,
  ScreenshotResource,

  // 标注系统
  AnnotationTypeEnum,
  AnnotationType,
  AnnotationColorEnum,
  AnnotationColor,
  AnnotationTargetSchema,
  AnnotationSchema,
  Annotation,

  // 布局模板
  LayoutTemplateEnum,
  LayoutTemplate,

  // 动画预设
  AnimationPresetEnum,

  // 新的 Script 输出
  NarrationSegmentSchema,
  SceneHighlightSchema,
  CodeHighlightSchema,
  NewSceneSchema,
  NewScriptOutputSchema,

  // Visual 输出
  NarrationBindingSchema,
  TextElementSchema,
  VisualSceneSchema,
  VisualPlanSchema,
} from "../visual.js";

describe("Info Priority Types", () => {
  it("should have correct priority levels", () => {
    const priorities = InfoPriorityEnum.options;
    expect(priorities).toContain("essential");
    expect(priorities).toContain("important");
    expect(priorities).toContain("supporting");
    expect(priorities).toContain("skip");
  });

  it("should validate essential priority", () => {
    const result = InfoPriorityEnum.safeParse("essential");
    expect(result.success).toBe(true);
  });

  it("should reject invalid priority", () => {
    const result = InfoPriorityEnum.safeParse("critical");
    expect(result.success).toBe(false);
  });
});

describe("Screenshot Types", () => {
  it("should have decorative screenshot types", () => {
    const types = ScreenshotTypeEnum.options;
    expect(types).toContain("hero");
    expect(types).toContain("ambient");
  });

  it("should have informational screenshot types", () => {
    const types = ScreenshotTypeEnum.options;
    expect(types).toContain("headline");
    expect(types).toContain("article");
    expect(types).toContain("documentation");
    expect(types).toContain("codeSnippet");
    expect(types).toContain("changelog");
    expect(types).toContain("feature");
  });

  it("should validate ScreenshotResource with selector", () => {
    const resource = {
      id: "shot-1",
      type: "headline" as ScreenshotType,
      url: "https://example.com",
      selector: "h1, .headline",
      role: "primary" as const,
    };

    const result = ScreenshotResourceSchema.safeParse(resource);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.selector).toBe("h1, .headline");
    }
  });

  it("should validate ScreenshotResource without selector (decorative)", () => {
    const resource = {
      id: "shot-2",
      type: "hero" as ScreenshotType,
      url: "https://example.com",
      role: "background" as const,
    };

    const result = ScreenshotResourceSchema.safeParse(resource);
    expect(result.success).toBe(true);
  });
});

describe("Annotation Types", () => {
  it("should have all annotation types", () => {
    const types = AnnotationTypeEnum.options;
    expect(types).toContain("circle");
    expect(types).toContain("underline");
    expect(types).toContain("arrow");
    expect(types).toContain("highlight");
    expect(types).toContain("box");
    expect(types).toContain("number");
    expect(types).toContain("crossout");
    expect(types).toContain("checkmark");
  });

  it("should have fixed color scheme", () => {
    const colors = AnnotationColorEnum.options;
    expect(colors).toContain("attention"); // red
    expect(colors).toContain("highlight"); // yellow
    expect(colors).toContain("info"); // blue
    expect(colors).toContain("success"); // green
  });

  it("should validate AnnotationTarget with text match", () => {
    const target = {
      type: "text" as const,
      textMatch: "闭包类型收窄",
    };

    const result = AnnotationTargetSchema.safeParse(target);
    expect(result.success).toBe(true);
  });

  it("should validate AnnotationTarget with code line", () => {
    const target = {
      type: "code-line" as const,
      lineNumber: 5,
    };

    const result = AnnotationTargetSchema.safeParse(target);
    expect(result.success).toBe(true);
  });

  it("should validate complete Annotation with timing", () => {
    const annotation = {
      type: "circle" as AnnotationType,
      target: {
        type: "text" as const,
        textMatch: "重要概念",
      },
      style: {
        color: "attention" as AnnotationColor,
        size: "medium" as const,
      },
      narrationBinding: {
        triggerText: "这里有一个重要概念",
        segmentIndex: 0,
        appearAt: 2.5,
      },
    };

    const result = AnnotationSchema.safeParse(annotation);
    expect(result.success).toBe(true);
  });
});

describe("Layout Templates", () => {
  it("should have 8 layout templates", () => {
    const templates = LayoutTemplateEnum.options;
    expect(templates).toHaveLength(8);
  });

  it("should have expected layout templates", () => {
    const templates = LayoutTemplateEnum.options;
    expect(templates).toContain("hero-fullscreen");
    expect(templates).toContain("split-horizontal");
    expect(templates).toContain("split-vertical");
    expect(templates).toContain("text-over-image");
    expect(templates).toContain("code-focus");
    expect(templates).toContain("comparison");
    expect(templates).toContain("bullet-list");
    expect(templates).toContain("quote");
  });
});

describe("Animation Presets", () => {
  it("should have animation presets", () => {
    const presets = AnimationPresetEnum.options;
    expect(presets).toContain("fast");
    expect(presets).toContain("medium");
    expect(presets).toContain("slow");
    expect(presets).toContain("dramatic");
  });
});

describe("New Script Output (with narration timeline)", () => {
  it("should validate NarrationSegment", () => {
    const segment = {
      text: "TypeScript 5.4 带来了一个重要更新",
      startTime: 0,
      endTime: 3.5,
    };

    const result = NarrationSegmentSchema.safeParse(segment);
    expect(result.success).toBe(true);
  });

  it("should validate SceneHighlight with position info", () => {
    const highlight = {
      text: "闭包中的类型收窄",
      segmentIndex: 0,
      charStart: 10,
      charEnd: 18,
      timeInScene: 1.5,
      importance: "critical" as const,
      annotationSuggestion: "circle" as const,
      reason: "这是核心新特性",
    };

    const result = SceneHighlightSchema.safeParse(highlight);
    expect(result.success).toBe(true);
  });

  it("should validate CodeHighlight", () => {
    const codeHighlight = {
      codeLine: 5,
      codeText: "typeof x === 'string'",
      explanation: "这里进行类型守卫",
      timeInScene: 3.0,
      annotationType: "underline" as const,
    };

    const result = CodeHighlightSchema.safeParse(codeHighlight);
    expect(result.success).toBe(true);
  });

  it("should validate complete NewSceneSchema with narration timeline", () => {
    const scene = {
      id: "scene-1",
      type: "feature" as const,
      title: "闭包类型收窄",
      duration: 10,
      narration: {
        fullText: "TypeScript 5.4 带来了一个重要更新——闭包中的类型收窄",
        estimatedDuration: 10,
        segments: [
          { text: "TypeScript 5.4 带来了一个重要更新", startTime: 0, endTime: 4 },
          { text: "闭包中的类型收窄", startTime: 4, endTime: 10 },
        ],
      },
      highlights: [
        {
          text: "闭包中的类型收窄",
          segmentIndex: 1,
          charStart: 0,
          charEnd: 8,
          timeInScene: 4,
          importance: "critical" as const,
          annotationSuggestion: "highlight" as const,
          reason: "核心特性",
        },
      ],
      codeHighlights: [],
      sourceRef: "[1]",
    };

    const result = NewSceneSchema.safeParse(scene);
    expect(result.success).toBe(true);
  });

  it("should validate NewScriptOutputSchema", () => {
    const script = {
      title: "TypeScript 5.4 新特性",
      totalDuration: 60,
      scenes: [
        {
          id: "scene-1",
          type: "intro" as const,
          title: "开场",
          duration: 10,
          narration: {
            fullText: "欢迎观看本期视频",
            estimatedDuration: 10,
            segments: [{ text: "欢迎观看本期视频", startTime: 0, endTime: 10 }],
          },
          highlights: [],
          codeHighlights: [],
          sourceRef: "",
        },
      ],
    };

    const result = NewScriptOutputSchema.safeParse(script);
    expect(result.success).toBe(true);
  });
});

describe("Visual Plan Output", () => {
  it("should validate NarrationBinding", () => {
    const binding = {
      triggerText: "闭包类型收窄",
      segmentIndex: 1,
      appearAt: 4.5,
    };

    const result = NarrationBindingSchema.safeParse(binding);
    expect(result.success).toBe(true);
  });

  it("should validate TextElement", () => {
    const element = {
      content: "TypeScript 5.4",
      role: "title" as const,
      position: "top" as const,
      narrationBinding: {
        triggerText: "TypeScript 5.4",
        segmentIndex: 0,
        appearAt: 0,
      },
    };

    const result = TextElementSchema.safeParse(element);
    expect(result.success).toBe(true);
  });

  it("should validate complete VisualSceneSchema", () => {
    const visualScene = {
      sceneId: "scene-1",
      layoutTemplate: "code-focus" as LayoutTemplate,
      narrationTimeline: {
        text: "TypeScript 5.4 带来了闭包类型收窄",
        duration: 10,
        segments: [
          { text: "TypeScript 5.4 带来了", startTime: 0, endTime: 4 },
          { text: "闭包类型收窄", startTime: 4, endTime: 10 },
        ],
      },
      mediaResources: [
        {
          id: "shot-1",
          type: "codeSnippet" as ScreenshotType,
          url: "https://example.com",
          selector: "pre code",
          role: "primary" as const,
          narrationBinding: {
            triggerText: "代码",
            segmentIndex: 0,
            appearAt: 1,
          },
        },
      ],
      textElements: [
        {
          content: "闭包类型收窄",
          role: "title" as const,
          position: "top" as const,
          narrationBinding: {
            triggerText: "闭包类型收窄",
            segmentIndex: 1,
            appearAt: 4,
          },
        },
      ],
      annotations: [
        {
          type: "circle" as AnnotationType,
          target: {
            type: "code-line" as const,
            lineNumber: 5,
          },
          style: {
            color: "attention" as AnnotationColor,
            size: "medium" as const,
          },
          narrationBinding: {
            triggerText: "类型守卫",
            segmentIndex: 1,
            appearAt: 5,
          },
        },
      ],
      animationPreset: "medium" as const,
      transition: {
        type: "fade" as const,
        duration: 0.5,
      },
    };

    const result = VisualSceneSchema.safeParse(visualScene);
    expect(result.success).toBe(true);
  });

  it("should validate complete VisualPlanSchema", () => {
    const visualPlan = {
      scenes: [
        {
          sceneId: "scene-1",
          layoutTemplate: "hero-fullscreen" as LayoutTemplate,
          narrationTimeline: {
            text: "欢迎观看",
            duration: 5,
            segments: [{ text: "欢迎观看", startTime: 0, endTime: 5 }],
          },
          mediaResources: [],
          textElements: [],
          annotations: [],
          animationPreset: "fast" as const,
          transition: { type: "fade" as const, duration: 0.3 },
        },
      ],
    };

    const result = VisualPlanSchema.safeParse(visualPlan);
    expect(result.success).toBe(true);
  });
});
