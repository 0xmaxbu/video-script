import { Agent } from "@mastra/core/agent";
import { QualityScoreSchema, MINIMUM_QUALITY_THRESHOLD } from "../quality/quality-schemas.js";
import { buildQualityPrompt } from "../quality/quality-prompt.js";

export const qualityAgent = new Agent({
  id: "quality-agent",
  name: "Quality Evaluation Agent",
  instructions: `You are a quality evaluation agent. Evaluate research content for:
1. Content depth (thorough vs surface-level)
2. Logical coherence (well-structured vs disjointed)
3. Hallucination detection (supported vs unsupported claims)

Output ONLY valid JSON matching the schema.`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
});

/**
 * Evaluate research content quality (non-blocking per D-11)
 * @param content - Research markdown content to evaluate
 * @param onComplete - Callback with QualityScore when evaluation completes
 * @param onError - Error handler
 */
export function evaluateQualityAsync(
  content: string,
  onComplete?: (score: QualityScore) => void,
  onError?: (error: Error) => void
): void {
  const prompt = buildQualityPrompt(content);

  qualityAgent
    .run(prompt)
    .then((result) => {
      try {
        const parsed = JSON.parse(result.text());
        const validated = QualityScoreSchema.parse(parsed);

        if (validated.qualityScore < MINIMUM_QUALITY_THRESHOLD) {
          console.warn(
            `[Quality Agent] Score ${validated.qualityScore} below threshold ${MINIMUM_QUALITY_THRESHOLD}`
          );
        }

        onComplete?.(validated);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    })
    .catch((err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    });
}
