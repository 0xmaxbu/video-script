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
  type: z.enum(["fade", "slide", "wipe", "none"]),
  duration: z.number().min(0),
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
