import { z } from "zod";

import { ScreenshotSpecSchema, CodeSpecSchema } from "./index.js";
export { ScreenshotSpecSchema, CodeSpecSchema };

export const ScreenshotConfigSchema = z.object({
  background: z.string().default("#1E1E1E"),
  width: z.number().int().positive().default(1920),
  fontSize: z.number().int().positive().default(14),
  fontFamily: z.string().default("Fira Code"),
});
export type ScreenshotConfig = z.infer<typeof ScreenshotConfigSchema>;

export const EffectSchema = z.object({
  type: z.enum(["codeHighlight", "textFadeIn", "sceneFade", "codeZoom"]),
  lines: z.array(z.number().int().positive()).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  duration: z.number().positive().optional(),
  direction: z.enum(["up", "down", "left", "right"]).optional(),
  stagger: z.number().positive().optional(),
  scale: z.number().positive().optional(),
  anchor: z.tuple([z.number(), z.number()]).optional(),
});
export type Effect = z.infer<typeof EffectSchema>;

export const TransitionSchema = z.object({
  from: z.number().int().positive(),
  to: z.number().int().positive(),
  type: z.enum(["sceneFade"]),
  duration: z.number().min(0.1),
});
export type Transition = z.infer<typeof TransitionSchema>;

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
  scenes: z.array(SceneScriptSchema).min(1),
  transitions: z.array(TransitionSchema).optional(),
});
export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;
