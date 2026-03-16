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

const ScreenshotOutputSchema = z.object({
  success: z.boolean(),
  screenshotDir: z.string(),
  resources: z.array(
    z.object({
      sceneId: z.string(),
      imagePath: z.string().optional(),
      highlightedHtml: z.string().optional(),
    }),
  ),
});

const screenshotStep = createStep(screenshotAgent, {
  structuredOutput: {
    schema: ScreenshotOutputSchema,
  },
});

const ComposeOutputSchema = z.object({
  projectPath: z.string(),
  videoPath: z.string().optional(),
  videoConfig: z.object({
    resolution: z.string(),
    fps: z.number(),
    duration: z.number(),
  }),
  readyForRender: z.boolean(),
  warnings: z.array(z.string()).optional(),
});

const composeStep = createStep(composeAgent, {
  structuredOutput: {
    schema: ComposeOutputSchema,
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
})
  .map(async ({ inputData }) => {
    const linksText = inputData.links?.length
      ? `\n\n参考链接:\n${inputData.links.map((l) => `- ${l}`).join("\n")}`
      : "";
    const docText = inputData.document
      ? `\n\n参考文档:\n${inputData.document}`
      : "";

    return {
      prompt: `请研究以下主题并生成视频脚本大纲:\n\n标题: ${inputData.title}${linksText}${docText}`,
    };
  })
  .then(researchStep)
  .map(async ({ inputData }) => {
    const keyPointsText = inputData.keyPoints
      .map((kp) => `- ${kp.title}: ${kp.description}`)
      .join("\n");
    const scenesText = inputData.scenes
      .map((s) => `- ${s.sceneTitle} (${s.duration}s): ${s.description}`)
      .join("\n");

    return {
      prompt: `基于以下研究结果，生成详细的视频脚本:\n\n标题: ${inputData.title}\n概述: ${inputData.overview}\n\n关键点:\n${keyPointsText}\n\n建议场景:\n${scenesText}`,
    };
  })
  .then(scriptStep)
  .then(mapStep)
  .then(humanReviewStep)
  .map(async ({ inputData }) => {
    const scenesText = inputData.scenes
      .map(
        (s) =>
          `- 场景 ${s.id}: ${s.title} (${s.duration}s)\n  类型: ${s.visualType}\n  内容: ${s.visualContent ?? "无"}`,
      )
      .join("\n");

    return {
      prompt: `为以下视频场景生成截图素材:\n\n标题: ${inputData.title}\n总时长: ${inputData.totalDuration}s\n\n场景列表:\n${scenesText}`,
    };
  })
  .then(screenshotStep)
  .map(async ({ inputData }) => {
    const resourcesText = inputData.resources
      .map(
        (r) =>
          `- 场景 ${r.sceneId}: ${r.imagePath ? `图片: ${r.imagePath}` : "代码高亮"} `,
      )
      .join("\n");

    return {
      prompt: `根据以下素材生成 Remotion 视频项目:\n\n截图目录: ${inputData.screenshotDir}\n资源列表:\n${resourcesText}`,
    };
  })
  .then(composeStep)
  .map(async ({ inputData }) => ({
    projectPath: inputData.projectPath,
    videoPath: inputData.videoPath,
    videoConfig: inputData.videoConfig,
    warnings: inputData.warnings,
  }))
  .commit();
