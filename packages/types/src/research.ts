import { z } from "zod";

// Research input schema
export const ResearchInputSchema = z.object({
  title: z.string().min(1),
  links: z.array(z.string().url()).optional(),
  document: z.string().optional(),
  documentFile: z.string().optional(),
});
export type ResearchInput = z.infer<typeof ResearchInputSchema>;

// Research segment schema per RES-03
// keyContent is flexible Record<string, string> to support AI-extracted key-value pairs
export const ResearchSegmentSchema = z.object({
  order: z.number().int().positive(),
  sentence: z.string(),
  keyContent: z.record(z.string(), z.string()),
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
