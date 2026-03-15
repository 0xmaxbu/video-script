import { Agent } from '@mastra/core/agent';

export const scriptAgent = new Agent({
  id: 'script-agent',
  name: 'Script Agent',
  instructions: 'Script agent for generating video scripts and timelines',
  model: 'openai/gpt-4-turbo',
});
