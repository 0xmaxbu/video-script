export {
  renderVideo,
  calculateTotalDuration,
  RenderVideoInputSchema,
  RenderVideoOutputSchema,
} from "./video-renderer.js";
export type { RenderVideoInput, RenderVideoOutput } from "./video-renderer.js";

export {
  generateSrt,
  GenerateSrtInputSchema,
  GenerateSrtOutputSchema,
} from "./srt-generator.js";
export type { GenerateSrtInput, GenerateSrtOutput } from "./srt-generator.js";

export { SceneSchema, ScriptOutputSchema } from "./types.js";
export type { Scene, ScriptOutput, CodeSpec } from "./types.js";

export { generateRemotionProject } from "./remotion-project-generator.js";
export type {
  GenerateProjectInput,
  GenerateProjectOutput,
} from "./remotion-project-generator.js";

export { cleanupRemotionTempDir } from "./cleanup.js";
