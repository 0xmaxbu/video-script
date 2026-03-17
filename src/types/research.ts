import { z } from "zod";

export const ResearchLinkSchema = z.object({
  url: z.string().url(),
  key: z.string(),
});

export type ResearchLink = z.infer<typeof ResearchLinkSchema>;

export const ResearchSegmentSchema = z.object({
  order: z.number().int().positive(),
  sentence: z.string().min(1),
  keyContent: z.string(),
  links: z.array(ResearchLinkSchema).min(1),
});

export type ResearchSegment = z.infer<typeof ResearchSegmentSchema>;

export const ResearchOutputSchema = z.object({
  title: z.string().min(1),
  segments: z.array(ResearchSegmentSchema).min(1).max(20),
});

export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;
