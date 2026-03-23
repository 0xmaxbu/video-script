import { z } from "zod";

// Annotation types
export const AnnotationTypeEnum = z.enum([
  "circle",
  "underline",
  "arrow",
  "box",
  "highlight",
  "number",
  "crossout",
  "checkmark",
]);
export type AnnotationType = z.infer<typeof AnnotationTypeEnum>;

export const AnnotationColorEnum = z.enum([
  "attention",
  "highlight",
  "info",
  "success",
]);
export type AnnotationColor = z.infer<typeof AnnotationColorEnum>;

// Annotation target positioning
// Supports both text/region/code-line targeting AND direct x/y coordinates for rendering
export const AnnotationTargetSchema = z.object({
  type: z.enum(["text", "region", "code-line"]),
  // Text matching for text targets
  textMatch: z.string().optional(),
  // Code line number for code-line targets
  lineNumber: z.number().int().positive().optional(),
  // Region positioning for region targets
  region: z
    .enum(["top-left", "top-right", "center", "bottom-left", "bottom-right"])
    .optional(),
  // Direct x/y coordinates for renderer use (populated at render time)
  x: z.number().optional(),
  y: z.number().optional(),
});
export type AnnotationTarget = z.infer<typeof AnnotationTargetSchema>;

export const AnnotationSchema = z.object({
  type: AnnotationTypeEnum,
  target: AnnotationTargetSchema,
  style: z.object({
    color: AnnotationColorEnum,
    size: z.enum(["small", "medium", "large"]),
  }),
  narrationBinding: z.object({
    triggerText: z.string(),
    segmentIndex: z.number().int().nonnegative(),
    appearAt: z.number().nonnegative(),
  }),
});
export type Annotation = z.infer<typeof AnnotationSchema>;

// SceneHighlight type (for script highlights)
export const SceneHighlightSchema = z.object({
  text: z.string(),
  segmentIndex: z.number().int().nonnegative(),
  charStart: z.number().int().nonnegative(),
  charEnd: z.number().int().nonnegative(),
  timeInScene: z.number().nonnegative(),
  importance: z.enum(["critical", "high", "medium"]),
  annotationSuggestion: z.enum([
    "circle",
    "underline",
    "highlight",
    "number",
  ]),
  reason: z.string(),
});
export type SceneHighlight = z.infer<typeof SceneHighlightSchema>;

// CodeHighlight type (for code annotations)
export const CodeHighlightSchema = z.object({
  codeLine: z.number().int().positive(),
  codeText: z.string(),
  explanation: z.string(),
  timeInScene: z.number().nonnegative(),
  annotationType: z.enum(["circle", "underline", "arrow", "number"]),
});
export type CodeHighlight = z.infer<typeof CodeHighlightSchema>;

// Annotation colors runtime values
export const ANNOTATION_COLORS = {
  attention: "#FF3B30",
  highlight: "#FFCC00",
  info: "#007AFF",
  success: "#34C759",
} as const;
export type AnnotationColorValue =
  (typeof ANNOTATION_COLORS)[AnnotationColor];
