// =============================================================================
// Research Types - Re-export from @video-script/types
// =============================================================================
// D-04a: src/types re-exports unified types from @video-script/types
// This ensures main and renderer use the same schema definitions.
// =============================================================================

// Re-export unified types from @video-script/types
export {
  ResearchInputSchema,
  type ResearchInput,
  ResearchSegmentSchema,
  type ResearchSegment,
  ResearchOutputSchema,
  type ResearchOutput,
} from "@video-script/types";

// Additional relationship tags for D-02 (local to main process)
export const RelationshipTagEnum = z.enum(["原因", "对比", "示例", "注意事项"]);
export type RelationshipTag = z.infer<typeof RelationshipTagEnum>;

import { z } from "zod";
