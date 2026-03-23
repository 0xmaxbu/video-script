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

// VisualLayer schema
export const VisualLayerSchema = z.object({
  id: z.string(),
  type: z.enum(["screenshot", "code", "text", "diagram", "image"]),
  position: PositionSchema,
  content: z.string(),
  animation: AnimationConfigSchema,
});
export type VisualLayer = z.infer<typeof VisualLayerSchema>;

// SceneTransition schema
export const SceneTransitionSchema = z.object({
  type: z.enum(["fade", "slide", "wipe", "flip", "clockWipe", "iris", "none"]),
  duration: z.number().min(0).max(1),
});
export type SceneTransition = z.infer<typeof SceneTransitionSchema>;

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
  sourceRef: z.string().optional(),
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
