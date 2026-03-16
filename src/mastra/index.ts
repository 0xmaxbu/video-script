import { Mastra } from "@mastra/core";
import { researchAgent } from "./agents/research-agent.js";
import { scriptAgent } from "./agents/script-agent.js";
import { screenshotAgent } from "./agents/screenshot-agent.js";
import { composeAgent } from "./agents/compose-agent.js";
import { videoGenerationWorkflow } from "./workflows/video-generation-workflow.js";

export const mastra = new Mastra({
  agents: {
    research: researchAgent,
    script: scriptAgent,
    screenshot: screenshotAgent,
    compose: composeAgent,
  },
  workflows: {
    "video-generation-workflow": videoGenerationWorkflow,
  },
});

export * from "./agents/index.js";
export * from "./workflows/index.js";
export * from "./tools/index.js";
