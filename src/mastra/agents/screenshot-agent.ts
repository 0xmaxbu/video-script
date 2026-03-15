import { Agent } from '@mastra/core/agent';

export const screenshotAgent = new Agent({
  id: 'screenshot-agent',
  name: 'Screenshot Agent',
  instructions: 'Screenshot agent for capturing web pages and code',
  model: 'openai/gpt-4-turbo',
});
