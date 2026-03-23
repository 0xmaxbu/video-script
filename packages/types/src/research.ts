import { z } from "zod";

// Research segment schema per RES-03
export const ResearchSegmentSchema = z.object({
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
});
export type ResearchSegment = z.infer<typeof ResearchSegmentSchema>;

// Research output schema per RES-01
export const ResearchOutputSchema = z.object({
  title: z.string(),
  segments: z.array(ResearchSegmentSchema),
});
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;
