import { z } from "zod";

export const ResearchInputSchema = z.object({
  title: z.string().min(1),
  links: z.array(z.string().url()).optional(),
  document: z.string().optional(),
  documentFile: z.string().optional(),
});

export type ResearchInput = z.infer<typeof ResearchInputSchema>;

export const ResearchOutputSchema = z.object({
  title: z.string(),
  segments: z.array(
    z.object({
      order: z.number().int().positive(),
      sentence: z.string(),
      keyContent: z.object({
        concept: z.string(),
      }),
      links: z.array(
        z.object({
          url: z.string(),
          key: z.string(),
        }),
      ),
    }),
  ),
});

export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;

export const ScreenshotSpecSchema = z.object({
  url: z.string().url().optional(),
  selector: z.string().optional(),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

export type ScreenshotSpec = z.infer<typeof ScreenshotSpecSchema>;

export const CodeSpecSchema = z.object({
  language: z.string(),
  code: z.string(),
  highlightLines: z.array(z.number().int().positive()).optional(),
});

export type CodeSpec = z.infer<typeof CodeSpecSchema>;

export const VisualTypeEnum = z.enum([
  "screenshot",
  "code",
  "text",
  "diagram",
  "image",
]);

export const SceneNarrativeType = z.enum(["intro", "feature", "code", "outro"]);
export type SceneNarrativeType = z.infer<typeof SceneNarrativeType>;

export const PositionSchema = z.object({
  x: z.union([z.number().min(0), z.enum(["left", "center", "right"])]),
  y: z.union([z.number().min(0), z.enum(["top", "center", "bottom"])]),
  width: z.union([z.number().min(0), z.literal("auto"), z.literal("full")]),
  height: z.union([z.number().min(0), z.literal("auto"), z.literal("full")]),
  zIndex: z.number().default(0),
});

export const AnimationConfigSchema = z.object({
  enter: z.enum([
    "fadeIn",
    "slideLeft",
    "slideRight",
    "slideUp",
    "slideDown",
    "slideIn",
    "zoomIn",
    "typewriter",
    "none",
  ]),
  enterDelay: z.number().default(0),
  exit: z.enum(["fadeOut", "slideOut", "zoomOut", "none"]),
  exitAt: z.number().optional(),
});

export const VisualLayerSchema = z.object({
  id: z.string(),
  type: VisualTypeEnum,
  position: PositionSchema,
  content: z.string(),
  animation: AnimationConfigSchema,
});
export type VisualLayer = z.infer<typeof VisualLayerSchema>;

// SceneTransitionSchema must be defined before SceneSchema since SceneSchema references it
export const SceneTransitionSchema = z.object({
  type: z.enum(["fade", "slide", "wipe", "flip", "clockWipe", "iris", "none"]),
  duration: z.number().min(0).max(1),
});
export type SceneTransition = z.infer<typeof SceneTransitionSchema>;

// NEW unified SceneSchema with visualLayers (aligns with script.ts and renderer/types.ts)
export const SceneSchema = z.object({
  id: z.string(),
  type: SceneNarrativeType,
  title: z.string(),
  narration: z.string(),
  duration: z.number().positive(),
  visualLayers: z.array(VisualLayerSchema).optional(),
  transition: SceneTransitionSchema.optional(),
});

export type Scene = z.infer<typeof SceneSchema>;

export const ScriptOutputSchema = z.object({
  title: z.string(),
  totalDuration: z.number().positive(),
  scenes: z.array(SceneSchema),
});

export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;

export const VideoConfigSchema = z.object({
  aspectRatio: z.enum(["16:9", "9:16"]),
  fps: z.number().int().positive().default(30),
  outputDir: z.string(),
});

export type VideoConfig = z.infer<typeof VideoConfigSchema>;

export const ScreenshotAgentInputSchema = z.object({
  scenes: z.array(SceneSchema),
  outputDir: z.string(),
});

export type ScreenshotAgentInput = z.infer<typeof ScreenshotAgentInputSchema>;

export const ComposeAgentInputSchema = z.object({
  script: ScriptOutputSchema,
  screenshotDir: z.string(),
  outputDir: z.string(),
  config: VideoConfigSchema,
});

export type ComposeAgentInput = z.infer<typeof ComposeAgentInputSchema>;

export function validateScriptOutput(input: unknown) {
  return ScriptOutputSchema.safeParse(input);
}

export function validateVisualLayer(input: unknown) {
  return VisualLayerSchema.safeParse(input);
}

// ============================================================================
// 新架构类型 (Visual Architecture Redesign)
// ============================================================================

import {
  // 信息重要性
  InfoPriorityEnum,
  type InfoPriority,

  // 截图类型
  ScreenshotTypeEnum,
  type ScreenshotType,
  ScreenshotResourceSchema,
  type ScreenshotResource,

  // 标注系统
  AnnotationTypeEnum,
  type AnnotationType,
  AnnotationColorEnum,
  type AnnotationColor,
  AnnotationTargetSchema,
  type AnnotationTarget,
  AnnotationSchema,
  type Annotation,
  ANNOTATION_COLORS,
  type AnnotationColorValue,

  // 布局模板
  LayoutTemplateEnum,
  type LayoutTemplate,

  // 动画预设
  AnimationPresetEnum,
  type AnimationPreset,

  // 新的 Script 输出
  NarrationSegmentSchema,
  type NarrationSegment,
  SceneHighlightSchema,
  type SceneHighlight,
  CodeHighlightSchema,
  type CodeHighlight,
  NewSceneSchema,
  type NewScene,
  NewScriptOutputSchema,
  type NewScriptOutput,

  // Visual Plan 输出
  NarrationBindingSchema,
  type NarrationBinding,
  TextElementSchema,
  type TextElement,
  NarrationTimelineSchema,
  type NarrationTimeline,
  VisualSceneSchema,
  type VisualScene,
  VisualPlanSchema,
  type VisualPlan,
} from "./visual.js";

// 重新导出
export {
  InfoPriorityEnum,
  type InfoPriority,
  ScreenshotTypeEnum,
  type ScreenshotType,
  ScreenshotResourceSchema,
  type ScreenshotResource,
  AnnotationTypeEnum,
  type AnnotationType,
  AnnotationColorEnum,
  type AnnotationColor,
  AnnotationTargetSchema,
  type AnnotationTarget,
  AnnotationSchema,
  type Annotation,
  ANNOTATION_COLORS,
  type AnnotationColorValue,
  LayoutTemplateEnum,
  type LayoutTemplate,
  AnimationPresetEnum,
  type AnimationPreset,
  NarrationSegmentSchema,
  type NarrationSegment,
  SceneHighlightSchema,
  type SceneHighlight,
  CodeHighlightSchema,
  type CodeHighlight,
  NewSceneSchema,
  type NewScene,
  NewScriptOutputSchema,
  type NewScriptOutput,
  NarrationBindingSchema,
  type NarrationBinding,
  TextElementSchema,
  type TextElement,
  NarrationTimelineSchema,
  type NarrationTimeline,
  VisualSceneSchema,
  type VisualScene,
  VisualPlanSchema,
  type VisualPlan,
};

// 新的验证函数
export function validateVisualPlan(input: unknown) {
  return VisualPlanSchema.safeParse(input);
}

export function validateNewScriptOutput(input: unknown) {
  return NewScriptOutputSchema.safeParse(input);
}
