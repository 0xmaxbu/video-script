import { z } from "zod";

// Quality dimension scores (1-5 scale)
export const QualityDimensionSchema = z.object({
  depth: z.number().int().min(1).max(5).describe("Content depth: thorough explanations vs surface-level"),
  coherence: z.number().int().min(1).max(5).describe("Logical coherence: well-structured flow vs disjointed"),
  hallucination: z.number().int().min(1).max(5).describe("Hallucination detection: claims supported by sources vs unsupported claims"),
});

export type QualityDimension = z.infer<typeof QualityDimensionSchema>;

// Quality score output
export const QualityScoreSchema = z.object({
  scores: QualityDimensionSchema,
  qualityScore: z.number().min(1).max(5).describe("Overall quality score (average of dimensions)"),
  warnings: z.array(z.string()).describe("List of potential issues detected"),
  details: z.string().optional().describe("Detailed explanation of scoring"),
});

export type QualityScore = z.infer<typeof QualityScoreSchema>;

// Minimum quality threshold (per D-11: warns at minimum, does not block)
export const MINIMUM_QUALITY_THRESHOLD = 3.0;
