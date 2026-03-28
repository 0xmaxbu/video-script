import { z } from "zod";
import {
  SceneHighlightSchema,
  CodeHighlightSchema,
  AnnotationSchema,
} from "./visual.js";
import {
  VisualTypeEnum,
  PositionSchema,
  AnimationConfigSchema,
} from "./shared.js";

export const SceneNarrativeType = z.enum(["intro", "feature", "code", "outro"]);
export type SceneNarrativeType = z.infer<typeof SceneNarrativeType>;

// Ken Burns waypoint (shared, web-page pan uses scale < 1 for overview)
export const KenBurnsWaypointSchema = z.object({
  focalX: z.number().min(0).max(1).default(0.5),
  focalY: z.number().min(0).max(1).default(0.5),
  scale: z.number().min(0.01).max(5),
  holdFrames: z.number().int().min(0).default(0),
  travelFrames: z.number().int().min(1).optional(), // frames to travel FROM here TO next waypoint (default 12)
});
export type KenBurnsWaypoint = z.infer<typeof KenBurnsWaypointSchema>;

export const VisualLayerSchema = z.object({
  id: z.string(),
  type: VisualTypeEnum,
  position: PositionSchema,
  content: z.string(),
  animation: AnimationConfigSchema,
  // Natural (pixel) dimensions of the source image — enables web-page pan mode
  naturalSize: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
  kenBurnsWaypoints: z.array(KenBurnsWaypointSchema).optional(),
  // D-02: Annotation overlays scoped to this layer (circles, arrows, boxes, etc.)
  annotations: z.array(AnnotationSchema).optional(),
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
  // D-02: Annotation overlays (circles, arrows, boxes, etc.)
  annotations: z.array(AnnotationSchema).optional(),
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
