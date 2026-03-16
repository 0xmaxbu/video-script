import { z } from "zod";

export const ResearchInputSchema = z.object({
  title: z.string().min(1),
  links: z.array(z.string().url()).optional(),
  document: z.string().optional(),
  documentFile: z.string().optional(),
});

export type ResearchInput = z.infer<typeof ResearchInputSchema>;

export const ResearchOutputSchema = z.object({
  title: z.string(),
  overview: z.string(),
  keyPoints: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    }),
  ),
  scenes: z.array(
    z.object({
      sceneTitle: z.string(),
      duration: z.number(),
      description: z.string(),
      screenshotSubjects: z.array(z.string()),
    }),
  ),
  sources: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      keyContent: z.string(),
    }),
  ),
});

export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;

export const ScreenshotSpecSchema = z.object({
  url: z.string().url().optional(),
  selector: z.string().optional(),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

export type ScreenshotSpec = z.infer<typeof ScreenshotSpecSchema>;

export const CodeSpecSchema = z.object({
  language: z.string(),
  code: z.string(),
  highlightLines: z.array(z.number().int().positive()).optional(),
});

export type CodeSpec = z.infer<typeof CodeSpecSchema>;

export const VisualTypeEnum = z.enum(["screenshot", "code", "text", "diagram"]);

export const SceneSchema = z.object({
  id: z.string(),
  type: z.enum(["intro", "feature", "code", "outro"]),
  title: z.string(),
  narration: z.string(),
  duration: z.number().positive(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  visualType: VisualTypeEnum.optional(),
  visualContent: z.string().optional(),
  screenshot: ScreenshotSpecSchema.optional(),
  code: CodeSpecSchema.optional(),
});

export type Scene = z.infer<typeof SceneSchema>;

export const ScriptOutputSchema = z.object({
  title: z.string(),
  totalDuration: z.number().positive(),
  scenes: z.array(SceneSchema),
});

export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;

export const VideoConfigSchema = z.object({
  aspectRatio: z.enum(["16:9", "9:16"]),
  fps: z.number().int().positive().default(30),
  outputDir: z.string(),
});

export type VideoConfig = z.infer<typeof VideoConfigSchema>;

export const ScreenshotAgentInputSchema = z.object({
  scenes: z.array(SceneSchema),
  outputDir: z.string(),
});

export type ScreenshotAgentInput = z.infer<typeof ScreenshotAgentInputSchema>;

export const ComposeAgentInputSchema = z.object({
  script: ScriptOutputSchema,
  screenshotDir: z.string(),
  outputDir: z.string(),
  config: VideoConfigSchema,
});

export type ComposeAgentInput = z.infer<typeof ComposeAgentInputSchema>;
