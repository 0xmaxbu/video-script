/**
 * script-quality-agent.ts
 *
 * LLM-as-judge script quality evaluator using Mastra Agent.
 *
 * Per D-05, D-06: results are informational only — non-gating.
 * Per D-07: evaluates three dimensions per scene using LLM:
 *   1. 内容深度 (Content Depth) — 是否解释 WHY，是否有类比
 *   2. 具体性 (Specificity) — 版本号、具体 API、具体示例
 *   3. 覆盖度 (Coverage) — 是否覆盖话题核心要点
 *
 * Falls back to heuristic evaluation if LLM call fails.
 */

import { Agent } from "@mastra/core/agent";
import type {
  ScriptQualitySection,
  SceneScriptQualityResult,
  QualityStatus,
} from "../../../types/quality.js";
import type { SceneScript } from "../../../types/script.js";

// ─── Mastra Agent (LLM-as-judge) ────────────────────────────────────────────

export const scriptQualityAgent = new Agent({
  id: "script-quality-agent",
  name: "Script Quality Agent",
  instructions: `You are a script quality evaluator for technical tutorial videos.

You evaluate each scene's narration across 3 dimensions and return a structured JSON assessment.

## Evaluation Dimensions

1. **内容深度 (Content Depth)**: Does the narration explain WHY, not just WHAT? Are there analogies, comparisons, or rationale? Score "ok" if explanations include reasoning; "warning" if it merely lists facts without context.

2. **具体性 (Specificity)**: Does the narration include specific version numbers, API names, code examples, or concrete details? Score "ok" if specific; "warning" if vague (e.g., "新版本" instead of "TypeScript 5.4").

3. **覆盖度 (Coverage)**: Does the narration cover the core points for this topic? Score "ok" if main concepts are addressed; "warning" if significant gaps exist.

## Output Format

You MUST respond with ONLY valid JSON (no markdown, no explanation outside the JSON):

{
  "scenes": [
    {
      "sceneId": "scene-001",
      "depthStatus": "ok" | "warning" | "error",
      "depthNote": "Brief explanation",
      "specificityStatus": "ok" | "warning" | "error",
      "specificityNote": "Brief explanation",
      "coverageStatus": "ok" | "warning" | "error",
      "coverageNote": "Brief explanation",
      "score": 0-10,
      "note": "One-sentence summary"
    }
  ]
}

## Scoring Guide
- 8-10: Excellent — all 3 dimensions are strong
- 5-7: Acceptable — minor gaps in 1 dimension
- 0-4: Needs improvement — significant gaps in 2+ dimensions
`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
});

// ─── Heuristic fallback ──────────────────────────────────────────────────────

function heuristicDepth(narration: string): {
  status: QualityStatus;
  note?: string;
} {
  // Check for reasoning words (Chinese + English)
  const depthWords =
    /因为|所以|原因|原理|为什么|why|because|reason|由于|意味着|相当于|类比|比喻|举个例子|例如|比如|也就是说|换句话说/;
  if (depthWords.test(narration)) return { status: "ok" };
  return {
    status: "warning",
    note: "Narration lacks depth — no explanations of WHY or analogies found.",
  };
}

function heuristicSpecificity(narration: string): {
  status: QualityStatus;
  note?: string;
} {
  // Check for version numbers, API names, code patterns
  const specificityPatterns =
    /\d+\.\d+|v\d+|API|SDK|npm|import |from |class |function |\`.*\`|http|\.com|\.org|typescript|javascript|python|react|node/;
  if (specificityPatterns.test(narration)) return { status: "ok" };
  return {
    status: "warning",
    note: "Narration is vague — lacks specific version numbers, API names, or code references.",
  };
}

function heuristicCoverage(narration: string): {
  status: QualityStatus;
  note?: string;
} {
  const wc = narration.trim().split(/\s+/).filter(Boolean).length;
  if (wc < 20) {
    return {
      status: "warning",
      note: `Narration very short (${wc} words) — may not cover the topic adequately.`,
    };
  }
  return { status: "ok" };
}

function worstStatus(statuses: QualityStatus[]): QualityStatus {
  if (statuses.includes("error")) return "error";
  if (statuses.includes("warning")) return "warning";
  return "ok";
}

// ─── LLM evaluation ─────────────────────────────────────────────────────────

interface LlmSceneResult {
  sceneId: string;
  depthStatus: QualityStatus;
  depthNote?: string;
  specificityStatus: QualityStatus;
  specificityNote?: string;
  coverageStatus: QualityStatus;
  coverageNote?: string;
  score: number;
  note?: string;
}

interface LlmEvalResult {
  scenes: LlmSceneResult[];
}

/**
 * Check if an LLM API key is available.
 * Skip LLM evaluation if no key is configured — fall back to heuristics.
 */
function hasLlmKey(): boolean {
  const hasOpenai = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasMinimax = !!process.env.MINIMAX_CN_API_KEY;
  return hasOpenai || hasAnthropic || hasMinimax;
}

/**
 * Run LLM-as-judge evaluation on all scenes.
 * Returns parsed results or null if LLM fails.
 */
async function evaluateWithLLM(scenes: SceneScript[]): Promise<LlmEvalResult | null> {
  // Build evaluation prompt with all scenes
  const sceneTexts = scenes
    .map(
      (s) =>
        `## Scene: ${s.id} — ${s.title}\nDuration: ${s.duration}s\nNarration:\n${s.narration}`,
    )
    .join("\n\n");

  const prompt = `Evaluate the following ${scenes.length} video scenes. Respond with ONLY the JSON result.

${sceneTexts}`;

  const LLM_TIMEOUT_MS = 15_000;

  try {
    // Timeout — if LLM is slow or unavailable, fall back to heuristics
    const result = await Promise.race([
      scriptQualityAgent.generate(prompt),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), LLM_TIMEOUT_MS),
      ),
    ]);

    if (result === null) return null;

    // Parse JSON from the response — the LLM may wrap it in markdown
    const text = result.text.trim();
    let jsonStr = text;

    // Strip markdown code fences if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr) as LlmEvalResult;

    // Validate structure
    if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
      return null;
    }

    return parsed;
  } catch {
    // LLM call failed or returned invalid JSON — return null for fallback
    return null;
  }
}

// ─── Public evaluator ────────────────────────────────────────────────────────

/**
 * Evaluate script quality for all scenes using LLM-as-judge (D-07).
 * Falls back to heuristic evaluation if LLM fails.
 *
 * Per D-08: also checks heuristic minimum (narration ≥ 100 chars).
 */
export async function evaluateScriptQuality(
  scenes: SceneScript[],
): Promise<ScriptQualitySection> {
  const evaluatedAt = new Date().toISOString();

  // Try LLM evaluation first (skip if no API key available)
  const llmResult = hasLlmKey() ? await evaluateWithLLM(scenes) : null;

  if (llmResult) {
    // Merge LLM results with scene data
    const sceneResults: SceneScriptQualityResult[] = scenes.map((scene) => {
      const llmScene = llmResult.scenes.find((s) => s.sceneId === scene.id);

      // D-08 heuristic: narration too short
      const tooShort = scene.narration.length < 100;

      if (llmScene) {
        const result: SceneScriptQualityResult = {
          sceneId: scene.id,
          sceneTitle: scene.title,
          depthStatus: tooShort ? "warning" : llmScene.depthStatus,
          specificityStatus: llmScene.specificityStatus,
          coverageStatus: llmScene.coverageStatus,
        };
        const depthNoteText = tooShort
          ? `Narration too short (${scene.narration.length} chars). ${llmScene.depthNote ?? ""}`
          : llmScene.depthNote;
        if (depthNoteText) result.depthNote = depthNoteText;
        if (llmScene.specificityNote) result.specificityNote = llmScene.specificityNote;
        if (llmScene.coverageNote) result.coverageNote = llmScene.coverageNote;
        if (llmScene.score !== undefined) result.llmScore = llmScene.score;
        if (llmScene.note) result.llmNote = llmScene.note;
        return result;
      }

      // LLM didn't return this scene — use heuristic fallback
      const depth = heuristicDepth(scene.narration);
      const specificity = heuristicSpecificity(scene.narration);
      const coverage = heuristicCoverage(scene.narration);

      const result: SceneScriptQualityResult = {
        sceneId: scene.id,
        sceneTitle: scene.title,
        depthStatus: depth.status,
        specificityStatus: specificity.status,
        coverageStatus: coverage.status,
      };
      if (depth.note) result.depthNote = depth.note;
      if (specificity.note) result.specificityNote = specificity.note;
      if (coverage.note) result.coverageNote = coverage.note;
      return result;
    });

    const overallStatus = worstStatus(
      sceneResults.flatMap((s) => [
        s.depthStatus,
        s.specificityStatus,
        s.coverageStatus,
      ]),
    );

    return {
      evaluatedAt,
      overallStatus,
      scenes: sceneResults,
    };
  }

  // Fallback: heuristic-only evaluation
  const sceneResults: SceneScriptQualityResult[] = scenes.map((scene) => {
    const depth = heuristicDepth(scene.narration);
    const specificity = heuristicSpecificity(scene.narration);
    const coverage = heuristicCoverage(scene.narration);

    // D-08 heuristic: narration too short
    const tooShort = scene.narration.length < 100;

    const result: SceneScriptQualityResult = {
      sceneId: scene.id,
      sceneTitle: scene.title,
      depthStatus: tooShort ? "warning" : depth.status,
      specificityStatus: specificity.status,
      coverageStatus: coverage.status,
    };
    if (tooShort) {
      result.depthNote = `Narration too short (${scene.narration.length} chars, minimum 100).`;
    } else if (depth.note) {
      result.depthNote = depth.note;
    }
    if (specificity.note) result.specificityNote = specificity.note;
    if (coverage.note) result.coverageNote = coverage.note;
    return result;
  });

  const overallStatus = worstStatus(
    sceneResults.flatMap((s) => [
      s.depthStatus,
      s.specificityStatus,
      s.coverageStatus,
    ]),
  );

  return {
    evaluatedAt,
    overallStatus,
    scenes: sceneResults,
    evaluationError: "LLM evaluation failed — using heuristic fallback.",
  };
}
