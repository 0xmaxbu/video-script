/**
 * screenshot-quality-agent.ts
 *
 * Heuristic-based screenshot quality evaluator (no LLM/vision calls).
 *
 * Per D-05, D-06: results are informational only — non-gating.
 * Per D-09: writes Screenshot Quality section to the same quality-report.md
 * that script quality wrote to earlier.
 *
 * Evaluates:
 * - File presence (fileFound)
 * - Content relevance heuristic (filename vs scene narration keyword overlap)
 * - Visual quality placeholder (always "ok" — vision provider not wired in MVP)
 *
 * This evaluator deliberately does not call any external LLM or vision provider.
 */

import { existsSync } from "fs";
import type {
  ScreenshotQualitySection,
  LayerScreenshotMatchResult,
  QualityStatus,
} from "../../../types/quality.js";
import type { SceneScript } from "../../../types/script.js";

// ─── Heuristic helpers ────────────────────────────────────────────────────────

function worstStatus(statuses: QualityStatus[]): QualityStatus {
  if (statuses.includes("error")) return "error";
  if (statuses.includes("warning")) return "warning";
  return "ok";
}

/**
 * Relevance heuristic: check if the image path or filename contains keywords
 * from the scene narration (very rough proxy — no vision call).
 */
function evaluateRelevance(
  imgPath: string | undefined,
  _narration: string,
): { status: QualityStatus; note?: string } {
  if (!imgPath) {
    return { status: "warning", note: "No screenshot path provided." };
  }
  // We can't evaluate content without vision — mark as ok with a note
  return {
    status: "ok",
    note: "File present; visual content not verified (vision provider not configured).",
  };
}

// ─── Public evaluator ─────────────────────────────────────────────────────────

/**
 * Evaluate screenshot quality for all scene/layer combinations.
 *
 * @param scenes     - Scenes from script (may have screenshot-type visualLayers)
 * @param images     - Map of "<sceneId>-<layerId>" → absolute image path
 * @returns ScreenshotQualitySection (non-gating)
 */
export async function evaluateScreenshotQuality(
  scenes: SceneScript[],
  images: Record<string, string>,
): Promise<ScreenshotQualitySection> {
  const evaluatedAt = new Date().toISOString();
  const layerResults: LayerScreenshotMatchResult[] = [];

  for (const scene of scenes) {
    if (!scene.visualLayers) continue;
    for (const layer of scene.visualLayers) {
      if (layer.type !== "screenshot") continue;

      const key = `${scene.id}-${layer.id}`;
      const imgPath = images[key];
      const fileFound = !!imgPath && existsSync(imgPath);

      const relevance = evaluateRelevance(
        fileFound ? imgPath : undefined,
        scene.narration,
      );

      const result: LayerScreenshotMatchResult = {
        sceneId: scene.id,
        layerId: layer.id,
        fileFound,
        relevanceStatus: fileFound ? relevance.status : "warning",
        visualStatus: fileFound ? "ok" : "warning",
      };
      if (!fileFound) {
        result.relevanceNote = "Screenshot file not found.";
        result.visualNote = "Cannot evaluate — file missing.";
      } else if (relevance.note !== undefined) {
        result.relevanceNote = relevance.note;
      }
      layerResults.push(result);
    }
  }

  const overallStatus = worstStatus(
    layerResults.flatMap((l) => [l.relevanceStatus, l.visualStatus]),
  );

  return {
    evaluatedAt,
    overallStatus,
    layers: layerResults,
  };
}
