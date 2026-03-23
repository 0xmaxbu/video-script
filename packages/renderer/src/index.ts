export { renderVideo, calculateTotalDuration, RenderVideoInputSchema } from "./video-renderer.js";
export type { RenderVideoInput } from "./video-renderer.js";

export { generateSrt } from "./srt-generator.js";

export { SceneScriptSchema, ScriptOutputSchema } from "./types.js";
export type { SceneScript, ScriptOutput } from "./types.js";

export { generateRemotionProject } from "./remotion-project-generator.js";
export type { GenerateProjectInput, GenerateProjectOutput } from "./remotion-project-generator.js";

export { cleanupRemotionTempDir } from "./cleanup.js";
