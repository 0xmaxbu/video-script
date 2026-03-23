/**
 * Visual Architecture Types - Main Process Specific
 *
 * 核心原则：视觉服从口播
 * - 所有视觉元素的时机绑定到口播时间轴
 * - 标注、截图、文字的出现由口播内容触发
 *
 * NOTE: Shared types (Annotation, SceneHighlight, CodeHighlight, etc.)
 * are now in @video-script/types. This file only contains main-process-specific types.
 */

import { z } from "zod";
import {
  AnnotationSchema,
  SceneHighlightSchema,
  CodeHighlightSchema,
  type AnnotationColor,
} from "@video-script/types";

// Re-export for backward compatibility
export {
  AnnotationSchema,
  AnnotationTypeEnum,
  AnnotationColorEnum,
  AnnotationTargetSchema,
  SceneHighlightSchema,
  CodeHighlightSchema,
  ANNOTATION_COLORS,
  type Annotation,
  type AnnotationType,
  type AnnotationColor,
  type AnnotationTarget,
  type SceneHighlight,
  type CodeHighlight,
  type AnnotationColorValue,
} from "@video-script/types";

// ============================================================================
// 信息重要性分级
// ============================================================================

export const InfoPriorityEnum = z.enum([
  "essential", // 核心特性、关键变化 - 必须进入视频
  "important", // 重要改进、实用功能 - 必须进入视频
  "supporting", // 背景信息、细节说明 - 跳过
  "skip", // 次要内容、重复信息 - 跳过
]);
export type InfoPriority = z.infer<typeof InfoPriorityEnum>;

// ============================================================================
// 截图类型
// ============================================================================

export const ScreenshotTypeEnum = z.enum([
  // 装饰性截图 (背景)
  "hero", // 首页/产品页大图
  "ambient", // 氛围图

  // 信息性截图 (前景)
  "headline", // 新闻标题/公告
  "article", // 文章段落
  "documentation", // 文档页面
  "codeSnippet", // 代码块
  "changelog", // 更新日志
  "feature", // 功能特性列表
]);
export type ScreenshotType = z.infer<typeof ScreenshotTypeEnum>;

export const ScreenshotResourceSchema = z.object({
  id: z.string(),
  type: ScreenshotTypeEnum,
  url: z.string().url(),
  selector: z.string().optional(), // AI 动态判断，信息性截图必须有
  role: z.enum(["primary", "secondary", "background"]),
});
export type ScreenshotResource = z.infer<typeof ScreenshotResourceSchema>;

// ============================================================================
// 布局模板
// ============================================================================

export const LayoutTemplateEnum = z.enum([
  "hero-fullscreen", // 全屏大图 + 底部标题
  "split-horizontal", // 左右分屏 (50/50)
  "split-vertical", // 上下分屏 (60/40)
  "text-over-image", // 文字覆盖在图片上
  "code-focus", // 代码聚焦布局
  "comparison", // 对比布局
  "bullet-list", // 要点列表布局
  "quote", // 引用布局
]);
export type LayoutTemplate = z.infer<typeof LayoutTemplateEnum>;

// ============================================================================
// 动画预设
// ============================================================================

export const AnimationPresetEnum = z.enum([
  "fast", // 快节奏
  "medium", // 中等
  "slow", // 慢节奏
  "dramatic", // 戏剧性
]);
export type AnimationPreset = z.infer<typeof AnimationPresetEnum>;

// ============================================================================
// 新的 Script 输出 (包含口播时间轴)
// ============================================================================

// 口播分段
export const NarrationSegmentSchema = z.object({
  text: z.string(),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
});
export type NarrationSegment = z.infer<typeof NarrationSegmentSchema>;

// 新的场景 Schema
export const NewSceneSchema = z.object({
  id: z.string(),
  type: z.enum(["intro", "feature", "code", "outro"]),
  title: z.string(),
  duration: z.number().positive(),

  // 口播内容 - 核心输出
  narration: z.object({
    fullText: z.string(), // 完整口播文案
    estimatedDuration: z.number().positive(), // 预估时长（秒）
    segments: z.array(NarrationSegmentSchema), // 口播分段
  }),

  // 重点标记 - 供 Visual Agent 使用
  highlights: z.array(SceneHighlightSchema),

  // 代码相关重点
  codeHighlights: z.array(CodeHighlightSchema),

  // 来源引用
  sourceRef: z.string(), // 引用 research.md 中的序号
});
export type NewScene = z.infer<typeof NewSceneSchema>;

// 新的 Script 输出
export const NewScriptOutputSchema = z.object({
  title: z.string(),
  totalDuration: z.number().positive(),
  scenes: z.array(NewSceneSchema).min(1),
});
export type NewScriptOutput = z.infer<typeof NewScriptOutputSchema>;

// ============================================================================
// Visual Plan 输出
// ============================================================================

// 口播绑定
export const NarrationBindingSchema = z.object({
  triggerText: z.string(), // 口播触发文字
  segmentIndex: z.number().int().nonnegative(), // 对应口播分段索引
  appearAt: z.number().nonnegative(), // 出现时间点
});
export type NarrationBinding = z.infer<typeof NarrationBindingSchema>;

// 文字元素
export const TextElementSchema = z.object({
  content: z.string(),
  role: z.enum(["title", "subtitle", "bullet", "quote"]),
  position: z.enum(["top", "center", "bottom"]),
  narrationBinding: NarrationBindingSchema,
});
export type TextElement = z.infer<typeof TextElementSchema>;

// 口播时间轴（用于 Visual Plan）
export const NarrationTimelineSchema = z.object({
  text: z.string(),
  duration: z.number().positive(),
  segments: z.array(
    z.object({
      text: z.string(),
      startTime: z.number().nonnegative(),
      endTime: z.number().nonnegative(),
    }),
  ),
});
export type NarrationTimeline = z.infer<typeof NarrationTimelineSchema>;

// Visual 场景
export const VisualSceneSchema = z.object({
  sceneId: z.string(),
  layoutTemplate: LayoutTemplateEnum,

  // 口播时间轴
  narrationTimeline: NarrationTimelineSchema,

  // 媒体资源
  mediaResources: z.array(
    ScreenshotResourceSchema.extend({
      narrationBinding: NarrationBindingSchema,
    }),
  ),

  // 文字元素
  textElements: z.array(TextElementSchema),

  // 标注
  annotations: z.array(AnnotationSchema),

  // 动画预设
  animationPreset: AnimationPresetEnum,

  // 转场
  transition: z.object({
    type: z.enum(["fade", "slide", "wipe", "flip", "clockWipe", "iris", "none"]),
    duration: z.number().min(0).max(1),
  }),
});
export type VisualScene = z.infer<typeof VisualSceneSchema>;

// Visual Plan 完整输出
export const VisualPlanSchema = z.object({
  scenes: z.array(VisualSceneSchema),
});
export type VisualPlan = z.infer<typeof VisualPlanSchema>;
