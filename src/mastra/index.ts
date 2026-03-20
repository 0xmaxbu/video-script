import { Mastra } from "@mastra/core";
import { Workspace } from "@mastra/core/workspace";
import { LocalFilesystem } from "@mastra/core/workspace";
import { researchAgent } from "./agents/research-agent.js";
import { scriptAgent } from "./agents/script-agent.js";
import { screenshotAgent } from "./agents/screenshot-agent.js";
import { composeAgent } from "./agents/compose-agent.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skillsPath = path.resolve(__dirname, "../../.agents/skills");

const workspace = new Workspace({
  name: "video-script-workspace",
  filesystem: new LocalFilesystem({ basePath: process.cwd() }),
  skills: [skillsPath],
});

export const mastra = new Mastra({
  agents: {
    research: researchAgent,
    script: scriptAgent,
    screenshot: screenshotAgent,
    compose: composeAgent,
  },
  workspace,
});

export * from "./agents/index.js";
export * from "./tools/index.js";
