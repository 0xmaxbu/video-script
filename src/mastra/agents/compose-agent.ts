import { Agent } from '@mastra/core/agent';

export const composeAgent = new Agent({
  id: 'compose-agent',
  name: 'Compose Agent',
  instructions: 'Compose agent for generating Remotion projects',
  model: 'openai/gpt-4-turbo',
});
