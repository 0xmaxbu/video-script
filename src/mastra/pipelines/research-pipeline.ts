import { webFetchTool } from "../tools/web-fetch.js";
import { validateFetchedContent } from "../tools/validators/input-validator.js";
import { researchAgent } from "../agents/research-agent.js";
import { evaluateQualityAsync } from "../agents/quality-agent.js";
import { withRetry } from "../../utils/retry.js";

export interface TopicInput {
  url: string;
  key: string;
}

export interface ResearchPipelineInput {
  title: string;
  links: Array<TopicInput>;
  document?: string;
}

export interface TopicResult {
  topicKey: string;
  url: string;
  researchMarkdown: string;
  validationFailures?: Array<{ name: string; reason: string }>;
}

export interface ResearchPipelineOutput {
  title: string;
  topicResults: Array<TopicResult>;
  totalTopics: number;
}

/**
 * Complete research pipeline with TOPIC SPLITTING (D-08)
 * Each link/topic is processed independently with its own research + quality evaluation
 * Per D-08: 多 topic 分开处理 - 每个 topic 独立生成研究 + 脚本
 *
 * Per D-09: 3 retries on failure, then fail with specific error
 * Per D-10: Input validation before passing to agent
 * Per D-11: Quality evaluation runs async, does not block
 */
export async function runResearchPipeline(
  input: ResearchPipelineInput,
  options: { maxRetries?: number } = {}
): Promise<ResearchPipelineOutput> {
  const maxRetries = options.maxRetries ?? 3;
  const retryOptions = { maxRetries, initialDelayMs: 1000, maxDelayMs: 5000, factor: 2 };

  // D-08: Process each topic independently
  const topicResults: Array<TopicResult> = [];

  for (const link of input.links) {
    // Step 1: Fetch this topic's content
    const fetchResult = await withRetry(
      async () => {
        const result = await webFetchTool.execute({ url: link.url });
        return result;
      },
      retryOptions
    );

    // Step 2: Validate fetched content (D-10)
    const validation = validateFetchedContent(fetchResult.content, fetchResult.url);

    let validationFailures: Array<{ name: string; reason: string }> | undefined;
    if (!validation.valid) {
      validationFailures = validation.failures;
      if (maxRetries > 0) {
        // Retry logic handled by withRetry above, but if still invalid, record failures
        console.warn(`[Research Pipeline] Validation warnings for ${link.url}:`, validation.failures);
      }
    }

    // Step 3: Run research agent for this topic (independent research per D-08)
    const researchResult = await researchAgent.run(
      `Title: ${link.key}\n\nURL: ${link.url}\n\nContent:\n${fetchResult.title}\n${fetchResult.content}`
    );

    const researchMarkdown = researchResult.text();

    // Step 4: Quality evaluation for this topic (non-blocking per D-11)
    evaluateQualityAsync(
      researchMarkdown,
      (score) => {
        console.log(`[Research Pipeline] Quality score for "${link.key}": ${score.qualityScore}`);
      },
      (error) => {
        console.warn(`[Research Pipeline] Quality evaluation failed for "${link.key}": ${error.message}`);
      }
    );

    topicResults.push({
      topicKey: link.key,
      url: link.url,
      researchMarkdown,
      validationFailures,
    });
  }

  return {
    title: input.title,
    topicResults,
    totalTopics: topicResults.length,
  };
}
