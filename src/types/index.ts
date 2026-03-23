// =============================================================================
// Main Process Types Index
// =============================================================================
// D-04a: src/types re-exports unified types from @video-script/types
// This ensures main and renderer use the same schema definitions.
// Local architecture-specific types (NewSceneSchema, VisualPlanSchema, etc.)
// are in ./visual.ts and re-exported here.
// =============================================================================

// Re-export unified types from @video-script/types
export * from "@video-script/types";

// Re-export local architecture-specific types (not in @video-script/types)
export * from "./visual.js";
