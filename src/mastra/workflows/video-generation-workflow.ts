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

const mapStep = createStep({
  id: "map-script-output",
  inputSchema: ScriptOutputSchema,
  outputSchema: ScriptOutputSchema.extend({
    _skipReview: z.boolean().optional(),
  }),
  execute: async ({ inputData }) => {
    const mappedScenes = inputData.scenes.map((scene, index) => {
      const duration =
        scene.duration ??
        (scene.startTime !== undefined && scene.endTime !== undefined
          ? scene.endTime - scene.startTime
          : 30);

      const visualType = scene.visualType ?? "text";
      const type =
        visualType === "code"
          ? "code"
          : visualType === "screenshot"
            ? "feature"
            : index === 0
              ? "intro"
              : index === inputData.scenes.length - 1
                ? "outro"
                : "feature";

      return {
        id: String(scene.id ?? index + 1),
        type: type as "intro" | "feature" | "code" | "outro",
        title: scene.title,
        narration: scene.narration,
        duration,
        startTime: scene.startTime,
        endTime: scene.endTime,
        visualType,
        visualContent: scene.visualContent,
        screenshot: scene.screenshot,
        code: scene.code,
      };
    });

    return {
      title: inputData.title,
      totalDuration:
        inputData.totalDuration ??
        mappedScenes.reduce((sum, s) => sum + s.duration, 0),
      scenes: mappedScenes,
    };
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

    const skipReview =
      inputData._skipReview ?? process.env.VIDEO_SCRIPT_SKIP_REVIEW === "true";
    if (skipReview) {
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
    mapStep,
    humanReviewStep,
    screenshotStep,
    composeStep,
  ],
}).commit();
