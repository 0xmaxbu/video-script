import { ScriptOutputSchema, VisualLayerSchema } from "./index.js";

export function validateScriptOutput(input: unknown) {
  return ScriptOutputSchema.safeParse(input);
}

export function validateVisualLayer(input: unknown) {
  return VisualLayerSchema.safeParse(input);
}
