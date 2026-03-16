import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { researchAgent } from "../agents/research-agent.js";
import { scriptAgent } from "../agents/script-agent.js";
import { screenshotAgent } from "../agents/screenshot-agent.js";
import { composeAgent } from "../agents/compose-agent.js";
import {
  ResearchInputSchema,
  ResearchOutputSchema,
  ScriptOutputSchema,
} from "../../types/index.js";

const researchStep = createStep(researchAgent, {
  structuredOutput: {
    schema: ResearchOutputSchema,
  },
});

const scriptStep = createStep(scriptAgent, {
  structuredOutput: {
    schema: ScriptOutputSchema,
  },
});

const HumanReviewInputSchema = ScriptOutputSchema.extend({
  _skipReview: z.boolean().optional(),
});

const humanReviewStep = createStep({
  id: "human-review",
  inputSchema: HumanReviewInputSchema,
  outputSchema: ScriptOutputSchema,
  resumeSchema: ScriptOutputSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    if (resumeData) {
      return resumeData as z.infer<typeof ScriptOutputSchema>;
    }

    if (inputData._skipReview) {
      const { _skipReview, ...scriptData } = inputData;
      return scriptData as z.infer<typeof ScriptOutputSchema>;
    }

    await suspend(inputData, {
      resumeLabel: "script-approved",
    });
    return inputData;
  },
});

const screenshotStep = createStep(screenshotAgent, {
  structuredOutput: {
    schema: z.object({
      success: z.boolean(),
      screenshotDir: z.string(),
      resources: z.array(
        z.object({
          sceneId: z.string(),
          imagePath: z.string().optional(),
          highlightedHtml: z.string().optional(),
        }),
      ),
    }),
  },
});

const composeStep = createStep(composeAgent, {
  structuredOutput: {
    schema: z.object({
      projectPath: z.string(),
      videoPath: z.string().optional(),
      videoConfig: z.object({
        resolution: z.string(),
        fps: z.number(),
        duration: z.number(),
      }),
      readyForRender: z.boolean(),
      warnings: z.array(z.string()).optional(),
    }),
  },
});

export const videoGenerationWorkflow = createWorkflow({
  id: "video-generation-workflow",
  inputSchema: ResearchInputSchema,
  outputSchema: z.object({
    projectPath: z.string(),
    videoPath: z.string().optional(),
    videoConfig: z.object({
      resolution: z.string(),
      fps: z.number(),
      duration: z.number(),
    }),
    warnings: z.array(z.string()).optional(),
  }),
  steps: [
    researchStep,
    scriptStep,
    humanReviewStep,
    screenshotStep,
    composeStep,
  ],
}).commit();
