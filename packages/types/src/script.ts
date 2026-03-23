import { z } from "zod";
import {
  SceneHighlightSchema,
  CodeHighlightSchema,
} from "./visual";
import {
  VisualTypeEnum,
  PositionSchema,
  AnimationConfigSchema,
} from "./shared";

export const SceneNarrativeType = z.enum(["intro", "feature", "code", "outro"]);
export type SceneNarrativeType = z.infer<typeof SceneNarrativeType>;

export const VisualLayerSchema = z.object({
  id: z.string(),
  type: VisualTypeEnum,
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

// D-02: Unified SceneScriptSchema with highlights and codeHighlights
export const SceneScriptSchema = z.object({
  id: z.string(),
  type: SceneNarrativeType,
  title: z.string(),
  narration: z.string(),
  duration: z.number().positive(),
  visualLayers: z.array(VisualLayerSchema).optional(),
  transition: SceneTransitionSchema.optional(),
  // D-02a: highlights from script agent - marks narration highlights with timing
  highlights: z.array(SceneHighlightSchema).optional(),
  // D-02a: codeHighlights - marks code line annotations with timing
  codeHighlights: z.array(CodeHighlightSchema).optional(),
  sourceRef: z.string().optional(),
});
export type SceneScript = z.infer<typeof SceneScriptSchema>;

export const ScriptOutputSchema = z
  .object({
    title: z.string(),
    totalDuration: z.number().positive(),
    scenes: z.array(SceneScriptSchema).min(1),
  })
  .strict();
export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;
