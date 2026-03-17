import { Mastra } from "@mastra/core";
import { researchAgent } from "./agents/research-agent.js";
import { scriptAgent } from "./agents/script-agent.js";
import { screenshotAgent } from "./agents/screenshot-agent.js";
import { composeAgent } from "./agents/compose-agent.js";

export const mastra = new Mastra({
  agents: {
    research: researchAgent,
    script: scriptAgent,
    screenshot: screenshotAgent,
    compose: composeAgent,
  },
});

export * from "./agents/index.js";
export * from "./tools/index.js";
