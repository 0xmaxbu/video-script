import { ScriptOutput, ScriptOutputSchema } from "../types/script.js";

export interface JSONParseResult {
  success: boolean;
  data?: ScriptOutput;
  error?: string;
  candidatesTried: number;
  bestScore: number;
}

function scoreCandidate(obj: Record<string, unknown>): number {
  let score = 0;
  if (obj.title) score += 10;
  if (obj.totalDuration) score += 5;
  if (Array.isArray(obj.scenes)) {
    score += obj.scenes.length * 100;
  }
  return score;
}

function extractBalancedJson(str: string): string | null {
  let braceCount = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "{") braceCount++;
    else if (str[i] === "}") braceCount--;
    if (braceCount === 0) {
      return str.substring(0, i + 1);
    }
  }
  return null;
}

export function parseScriptFromLLMOutput(textContent: string): JSONParseResult {
  const blocks = textContent.split(/```json\s*/).slice(1);
  let bestCandidate: Record<string, unknown> | null = null;
  let bestScore = 0;
  let candidatesTried = 0;

  for (const block of blocks) {
    const jsonStr = block.split("```")[0].trim();
    if (!jsonStr) continue;

    candidatesTried++;

    try {
      const candidate = JSON.parse(jsonStr);
      const score = scoreCandidate(candidate);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    } catch {
      const fixed = extractBalancedJson(jsonStr);
      if (fixed) {
        try {
          const candidate = JSON.parse(fixed);
          const score = scoreCandidate(candidate);
          if (score > bestScore) {
            bestScore = score;
            bestCandidate = candidate;
          }
        } catch {
          // Still invalid
        }
      }
    }
  }

  if (!bestCandidate) {
    return {
      success: false,
      error: "No valid JSON found",
      candidatesTried,
      bestScore: 0,
    };
  }

  try {
    const validated = ScriptOutputSchema.parse(bestCandidate);
    return {
      success: true,
      data: validated,
      candidatesTried,
      bestScore,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Validation failed",
      candidatesTried,
      bestScore,
    };
  }
}
