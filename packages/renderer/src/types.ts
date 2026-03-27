import { z } from "zod";

// =============================================================================
// Renderer Types (zod v3 for Remotion compatibility)
// =============================================================================
// Note: The main process uses zod v4 while renderer uses zod v3 for Remotion.
// These schemas are defined locally for zod v3 runtime compatibility.
// The schema structure matches @video-script/types for data flow consistency.
// =============================================================================

// ScreenshotConfigSchema - renderer-specific with maxLines, padding, theme
export const ScreenshotConfigSchema = z.object({
  background: z.string().default("#1E1E1E"),
  width: z.number().int().positive().default(1920),
  fontSize: z.number().int().positive().default(14),
  fontFamily: z.string().default("Fira Code"),
  // D-03: Renderer-specific fields
  maxLines: z.number().int().positive().optional(),
  padding: z.number().int().optional(),
  theme: z.string().optional(),
});
export type ScreenshotConfig = z.infer<typeof ScreenshotConfigSchema>;

// Scene narrative type enum
export const SceneNarrativeType = z.enum(["intro", "feature", "code", "outro"]);
export type SceneNarrativeType = z.infer<typeof SceneNarrativeType>;

// Position schema
export const PositionSchema = z.object({
  x: z.union([z.number().min(0), z.enum(["left", "center", "right"])]),
  y: z.union([z.number().min(0), z.enum(["top", "center", "bottom"])]),
  width: z.union([z.number().min(0), z.literal("auto"), z.literal("full")]),
  height: z.union([z.number().min(0), z.literal("auto"), z.literal("full")]),
  zIndex: z.number().default(0),
});

// Animation config
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

// Ken Burns waypoint for multi-focal animation
// scale ≥ 1 for traditional Ken Burns; scale < 1 allowed for web-page overview
export const KenBurnsWaypointSchema = z.object({
  focalX: z.number().min(0).max(1).default(0.5), // 0=left, 0.5=center, 1=right
  focalY: z.number().min(0).max(1).default(0.5), // 0=top, 0.5=center, 1=bottom
  scale: z.number().min(0.01).max(5), // zoom level; <1 = overview for tall pages
  holdFrames: z.number().int().min(0).default(0), // frames to linger at this waypoint
  travelFrames: z.number().int().min(1).optional(), // frames to travel FROM here TO next waypoint (default 12)
});
export type KenBurnsWaypoint = z.infer<typeof KenBurnsWaypointSchema>;

// CalloutContent schema (for parsing the JSON content field of callout layers)
export const CalloutContentSchema = z.object({
  text: z.string().min(1),
  style: z.enum(["highlight", "box", "arrow-label"]),
  arrowDirection: z.enum(["left", "right", "up", "down"]).optional(),
});
export type CalloutContent = z.infer<typeof CalloutContentSchema>;

// VisualLayer schema
export const VisualLayerSchema = z.object({
  id: z.string(),
  type: z.enum(["screenshot", "code", "text", "diagram", "image", "callout"]),
  position: PositionSchema,
  content: z.string(),
  animation: AnimationConfigSchema,
  kenBurnsWaypoints: z.array(KenBurnsWaypointSchema).optional(),
  // Natural (pixel) dimensions of the source image — enables web-page pan mode
  naturalSize: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
});
export type VisualLayer = z.infer<typeof VisualLayerSchema>;

// SceneTransition schema
export const SceneTransitionSchema = z.object({
  type: z.enum(["fade", "slide", "wipe", "flip", "clockWipe", "iris", "none"]),
  duration: z.number().min(0).max(1),
});
export type SceneTransition = z.infer<typeof SceneTransitionSchema>;

// D-02: AnnotationTarget schema
export const AnnotationTargetSchema = z.object({
  type: z.enum(["text", "region", "code-line"]),
  textMatch: z.string().optional(),
  lineNumber: z.number().int().positive().optional(),
  region: z
    .enum(["top-left", "top-right", "center", "bottom-left", "bottom-right"])
    .optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});
export type AnnotationTarget = z.infer<typeof AnnotationTargetSchema>;

// D-02: Annotation schema
export const AnnotationSchema = z.object({
  type: z.enum([
    "circle",
    "underline",
    "arrow",
    "box",
    "highlight",
    "number",
    "crossout",
    "checkmark",
  ]),
  target: AnnotationTargetSchema,
  style: z.object({
    color: z.enum(["attention", "highlight", "info", "success"]),
    size: z.enum(["small", "medium", "large"]),
  }),
  narrationBinding: z.object({
    triggerText: z.string(),
    segmentIndex: z.number().int().nonnegative(),
    appearAt: z.number().nonnegative(),
  }),
});
export type Annotation = z.infer<typeof AnnotationSchema>;
export type AnnotationColor = "attention" | "highlight" | "info" | "success";

// D-02: SceneHighlight schema (for script highlights)
export const SceneHighlightSchema = z.object({
  text: z.string(),
  segmentIndex: z.number().int().nonnegative(),
  charStart: z.number().int().nonnegative(),
  charEnd: z.number().int().nonnegative(),
  timeInScene: z.number().nonnegative(),
  importance: z.enum(["critical", "high", "medium"]),
  annotationSuggestion: z.enum(["circle", "underline", "highlight", "number"]),
  reason: z.string(),
});
export type SceneHighlight = z.infer<typeof SceneHighlightSchema>;

// D-02: CodeHighlight schema (for code annotations)
export const CodeHighlightSchema = z.object({
  codeLine: z.number().int().positive(),
  codeText: z.string(),
  explanation: z.string(),
  timeInScene: z.number().nonnegative(),
  annotationType: z.enum(["circle", "underline", "arrow", "number"]),
});
export type CodeHighlight = z.infer<typeof CodeHighlightSchema>;

// D-02: Layout template enum for agent-driven layout selection
export const LayoutTemplateEnum = z.enum([
  "hero-fullscreen",
  "split-horizontal",
  "split-vertical",
  "text-over-image",
  "code-focus",
  "comparison",
  "bullet-list",
  "quote",
  "inline", // explicit fallback per D-02b
]);
export type LayoutTemplate = z.infer<typeof LayoutTemplateEnum>;

// D-02: Unified SceneScriptSchema with highlights and codeHighlights
export const SceneScriptSchema = z.object({
  id: z.string(),
  type: SceneNarrativeType,
  title: z.string(),
  narration: z.string(),
  duration: z.number().positive(),
  visualLayers: z.array(VisualLayerSchema).optional(),
  transition: SceneTransitionSchema.optional(),
  // D-02a: highlights from script agent
  highlights: z.array(SceneHighlightSchema).optional(),
  // D-02a: codeHighlights - marks code line annotations
  codeHighlights: z.array(CodeHighlightSchema).optional(),
  // D-02: Annotation overlays (circles, arrows, boxes, etc.)
  annotations: z.array(AnnotationSchema).optional(),
  sourceRef: z.string().optional(),
  // D-02: Optional layout template selection
  layoutTemplate: LayoutTemplateEnum.optional(),
  // VIS-13: Optional progress indicator for multi-step tutorial scenes
  progressIndicator: z
    .object({
      enabled: z.boolean(),
      total: z.number().int().min(1),
      current: z.number().int().min(1),
    })
    .optional(),
});
export type SceneScript = z.infer<typeof SceneScriptSchema>;

export const ScriptOutputSchema = z.object({
  title: z.string(),
  totalDuration: z.number().positive(),
  scenes: z.array(SceneScriptSchema),
});
export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;

// =============================================================================
// Renderer-specific effect schemas
// =============================================================================

const CodeHighlightEffectSchema = z.object({
  type: z.literal("codeHighlight"),
  lines: z.array(z.number().int().positive()),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  duration: z.number().min(0.1).max(10),
});

const CodeZoomEffectSchema = z.object({
  type: z.literal("codeZoom"),
  scale: z.number().min(0.1).max(5.0),
  anchor: z.array(z.number().min(0).max(1)).length(2),
  duration: z.number().min(0.1).max(10),
});

const CodePanEffectSchema = z.object({
  type: z.literal("codePan"),
  from: z.array(z.number()).length(2),
  to: z.array(z.number()).length(2),
  duration: z.number().min(0.1).max(10),
});

const CodeTypeEffectSchema = z.object({
  type: z.literal("codeType"),
  speed: z.number().min(1).max(200),
  cursorBlink: z.boolean().optional(),
});

const TextFadeInEffectSchema = z.object({
  type: z.literal("textFadeIn"),
  direction: z.enum(["up", "down", "left", "right"]),
  stagger: z.number().min(0).max(1),
});

const TextSlideInEffectSchema = z.object({
  type: z.literal("textSlideIn"),
  direction: z.enum(["up", "down", "left", "right"]),
  distance: z.number().min(0).max(500),
});

const TextZoomInEffectSchema = z.object({
  type: z.literal("textZoomIn"),
  scale: z.number().min(0.1).max(3.0),
});

export const EffectSchema = z.discriminatedUnion("type", [
  CodeHighlightEffectSchema,
  CodeZoomEffectSchema,
  CodePanEffectSchema,
  CodeTypeEffectSchema,
  TextFadeInEffectSchema,
  TextSlideInEffectSchema,
  TextZoomInEffectSchema,
  z.object({
    type: z.literal("sceneFade"),
    duration: z.number().min(0.1).max(5),
  }),
  z.object({
    type: z.literal("sceneSlide"),
    direction: z.enum(["up", "down", "left", "right"]),
    duration: z.number().min(0.1).max(5),
  }),
  z.object({
    type: z.literal("sceneZoom"),
    fromScale: z.number().min(0.1).max(2.0),
    toScale: z.number().min(0.1).max(2.0),
    anchor: z.array(z.number().min(0).max(1)).length(2),
    duration: z.number().min(0.1).max(5),
  }),
]);

export type Effect = z.infer<typeof EffectSchema>;

export const TransitionSchema = z.object({
  from: z.number().int().positive(),
  to: z.number().int().positive(),
  type: z.enum(["sceneFade", "sceneSlide", "sceneZoom"]),
  duration: z.number().min(0.1).max(5),
});

export type Transition = z.infer<typeof TransitionSchema>;
