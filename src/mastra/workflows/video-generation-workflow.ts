import { Workflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const researchStep = createStep({
  id: 'research',
  inputSchema: z.object({ title: z.string() }),
  outputSchema: z.object({ summary: z.string() }),
  execute: async ({ inputData }) => {
    return { summary: `Research completed for: ${inputData.title}` };
  },
});

export const videoGenerationWorkflow = new Workflow({
  id: 'video-generation-workflow',
  inputSchema: z.object({ title: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  steps: [researchStep],
});
