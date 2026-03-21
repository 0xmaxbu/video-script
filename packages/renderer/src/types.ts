import { z } from "zod";

export const ScreenshotConfigSchema = z.object({
  background: z.string().default("#1E1E1E"),
  maxLines: z.number().int().positive().optional(),
  width: z.number().int().positive().default(1920),
  fontSize: z.number().int().positive().default(14),
  fontFamily: z.string().default("Fira Code"),
  padding: z.number().int().optional(),
  theme: z.string().optional(),
});

export type ScreenshotConfig = z.infer<typeof ScreenshotConfigSchema>;

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

// New unified scene types
export const SceneNarrativeType = z.enum(["intro", "feature", "code", "outro"]);
export type SceneNarrativeType = z.infer<typeof SceneNarrativeType>;

export const PositionSchema = z.object({
  x: z.union([z.number(), z.enum(["left", "center", "right"])]),
  y: z.union([z.number(), z.enum(["top", "center", "bottom"])]),
  width: z.union([z.number(), z.literal("auto"), z.literal("full")]),
  height: z.union([z.number(), z.literal("auto"), z.literal("full")]),
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
  type: z.enum(["screenshot", "code", "text", "diagram", "image"]),
  position: PositionSchema,
  content: z.string(),
  animation: AnimationConfigSchema,
});
export type VisualLayer = z.infer<typeof VisualLayerSchema>;

export const SceneTransitionSchema = z.object({
  type: z.enum(["fade", "slide", "wipe", "flip", "clockWipe", "iris", "none"]),
  duration: z.number().min(0).max(1),
});
export type SceneTransition = z.infer<typeof SceneTransitionSchema>;

export const SceneScriptSchema = z.object({
  id: z.string(),
  type: SceneNarrativeType,
  title: z.string(),
  narration: z.string(),
  duration: z.number().positive(),
  visualLayers: z.array(VisualLayerSchema).optional(),
  transition: SceneTransitionSchema.optional(),
});
export type SceneScript = z.infer<typeof SceneScriptSchema>;

export const ScriptOutputSchema = z.object({
  title: z.string(),
  totalDuration: z.number().positive(),
  scenes: z.array(SceneScriptSchema),
});
export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;
