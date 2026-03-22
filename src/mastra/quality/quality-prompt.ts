export const QUALITY_EVALUATION_PROMPT = `Evaluate the following research content across three dimensions:

1. **内容深度 (Content Depth)**: Does it provide thorough explanations or just surface-level summaries? Score 5 for deep analysis with examples, 1 for generic summaries.

2. **逻辑连贯性 (Logical Coherence)**: Does it preserve logical flow or is it disjointed? Score 5 for well-structured narrative, 1 for random collection of facts.

3. **幻觉检测 (Hallucination Detection)**: Are claims supported by the sources? Score 5 for fully supported claims, 1 for many unsupported or contradictory claims.

Content to evaluate:
---
{content}
---

Output format (JSON only, no markdown):
{
  "scores": {
    "depth": 1-5,
    "coherence": 1-5,
    "hallucination": 1-5
  },
  "qualityScore": number (average of three scores),
  "warnings": ["list of specific issues if any"],
  "details": "brief explanation of scoring rationale"
}`;

export function buildQualityPrompt(content: string): string {
  return QUALITY_EVALUATION_PROMPT.replace("{content}", content);
}
