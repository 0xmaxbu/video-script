import { z } from "zod";

export {
  SceneNarrativeType,
  SceneSchema,
  SceneTransitionSchema,
  VisualLayerSchema,
  VisualTypeEnum,
  AnimationConfigSchema,
  PositionSchema,
  ScriptOutputSchema as UnifiedScriptOutputSchema,
  ScreenshotSpecSchema,
  CodeSpecSchema,
} from "./index.js";

export const ScreenshotConfigSchema = ScreenshotSpecSchema;
export type ScreenshotConfig = z.infer<typeof ScreenshotSpecSchema>;
export const EffectSchema: z.ZodType<unknown> = z.any();
export type Effect = unknown;
export const TransitionSchema = SceneTransitionSchema;
export type Transition = z.infer<typeof SceneTransitionSchema>;

export const SceneScriptSchema = z.object({
  id: z.string(),
  type: z.enum(["intro", "feature", "code", "outro"]),
  title: z.string(),
  narration: z.string(),
  duration: z.number().positive(),
  visualLayers: z.array(z.unknown()).optional(),
});
export type SceneScript = z.infer<typeof SceneScriptSchema>;

export const ScriptOutputSchema = z.object({
  title: z.string(),
  totalDuration: z.number().positive(),
  scenes: z.array(SceneScriptSchema),
});
export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;
