import { Agent } from '@mastra/core/agent';

export const researchAgent = new Agent({
  id: 'research-agent',
  name: 'Research Agent',
  instructions: 'Research agent for collecting and analyzing web content',
  model: 'openai/gpt-4-turbo',
});
