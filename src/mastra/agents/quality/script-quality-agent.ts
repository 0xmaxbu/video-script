/**
 * script-quality-agent.ts
 *
 * Heuristic-based script quality evaluator (no LLM calls).
 *
 * Per D-05, D-06: results are informational only — non-gating.
 * Per D-07: evaluates three dimensions per scene:
 *   1. Narration clarity (length / sentence count heuristic)
 *   2. Visual layer alignment (scenes with visualLayers vs without)
 *   3. Duration appropriateness (narration word count vs duration)
 * Per D-08: produces a heuristic score 0-10 per scene.
 *
 * This evaluator is synchronous-compatible (returns a promise for uniformity),
 * and deliberately does not call any external LLM or vision provider.
 */

import type {
  ScriptQualitySection,
  SceneScriptQualityResult,
  QualityStatus,
} from "../../../types/quality.js";
import type { SceneScript } from "../../../types/script.js";

// ─── Heuristic helpers ────────────────────────────────────────────────────────

const WORDS_PER_SECOND = 2.5; // average speaking rate

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Clarity: narration should have at least 5 words and not be excessively long.
 */
function evaluateClarity(narration: string): {
  status: QualityStatus;
  note?: string;
} {
  const wc = wordCount(narration);
  if (wc < 5) {
    return {
      status: "warning",
      note: `Narration too short (${wc} words). Consider expanding.`,
    };
  }
  if (wc > 300) {
    return {
      status: "warning",
      note: `Narration very long (${wc} words). May exceed scene duration.`,
    };
  }
  return { status: "ok" };
}

/**
 * Alignment: scene should have at least 1 visual layer (unless type = outro/intro).
 */
function evaluateAlignment(scene: SceneScript): {
  status: QualityStatus;
  note?: string;
} {
  const hasLayers = scene.visualLayers && scene.visualLayers.length > 0;
  if (!hasLayers && scene.type !== "intro" && scene.type !== "outro") {
    return {
      status: "warning",
      note: "No visual layers — consider adding a screenshot or diagram.",
    };
  }
  return { status: "ok" };
}

/**
 * Duration: narration word count should be compatible with scene duration.
 * Expected words ≈ duration × WORDS_PER_SECOND
 */
function evaluateDuration(
  narration: string,
  durationSeconds: number,
): { status: QualityStatus; note?: string } {
  const wc = wordCount(narration);
  const expectedMax = durationSeconds * WORDS_PER_SECOND * 1.3; // 30% buffer
  const expectedMin = durationSeconds * WORDS_PER_SECOND * 0.3;

  if (wc > expectedMax) {
    return {
      status: "warning",
      note: `${wc} words may exceed ${durationSeconds}s duration (expected ≤${Math.round(expectedMax)}).`,
    };
  }
  if (wc < expectedMin && durationSeconds > 3) {
    return {
      status: "warning",
      note: `Only ${wc} words for ${durationSeconds}s — scene may feel slow.`,
    };
  }
  return { status: "ok" };
}

/**
 * D-08 heuristic score: average of dimension scores (0-10).
 * ok=10, warning=5, error=0
 */
function dimensionScore(status: QualityStatus): number {
  switch (status) {
    case "ok":
      return 10;
    case "warning":
      return 5;
    case "error":
      return 0;
  }
}

function worstStatus(statuses: QualityStatus[]): QualityStatus {
  if (statuses.includes("error")) return "error";
  if (statuses.includes("warning")) return "warning";
  return "ok";
}

// ─── Public evaluator ─────────────────────────────────────────────────────────

/**
 * Evaluate script quality for all scenes.
 * Returns a ScriptQualitySection (non-gating, heuristic-only).
 */
export async function evaluateScriptQuality(
  scenes: SceneScript[],
): Promise<ScriptQualitySection> {
  const evaluatedAt = new Date().toISOString();

  const sceneResults: SceneScriptQualityResult[] = scenes.map((scene) => {
    const clarity = evaluateClarity(scene.narration);
    const alignment = evaluateAlignment(scene);
    const duration = evaluateDuration(scene.narration, scene.duration);

    const score = Math.round(
      (dimensionScore(clarity.status) +
        dimensionScore(alignment.status) +
        dimensionScore(duration.status)) /
        3,
    );

    const result: SceneScriptQualityResult = {
      sceneId: scene.id,
      sceneTitle: scene.title,
      clarityStatus: clarity.status,
      alignmentStatus: alignment.status,
      durationStatus: duration.status,
      heuristicScore: score,
      heuristicNote:
        score >= 9
          ? "Looks good"
          : score >= 6
            ? "Acceptable"
            : "Needs attention",
    };
    if (clarity.note !== undefined) result.clarityNote = clarity.note;
    if (alignment.note !== undefined) result.alignmentNote = alignment.note;
    if (duration.note !== undefined) result.durationNote = duration.note;
    return result;
  });

  const overallStatus = worstStatus(
    sceneResults.flatMap((s) => [
      s.clarityStatus,
      s.alignmentStatus,
      s.durationStatus,
    ]),
  );

  return {
    evaluatedAt,
    overallStatus,
    scenes: sceneResults,
  };
}
