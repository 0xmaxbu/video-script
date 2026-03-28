/**
 * Quality report schema — non-gating, human-review-only.
 *
 * Status values:  ok | warning | error
 * Never: pass | fail | gate
 *
 * Per D-05, D-06: quality evals are informational only.
 * Per D-09: Script Quality and Screenshot Quality both write into
 * the same quality-report.md (first script, then screenshot overwrites entire file).
 */

// ─── Status types ─────────────────────────────────────────────────────────────

/** Non-gating status for any individual check result */
export type QualityStatus = "ok" | "warning" | "error";

// ─── Script Quality (D-07 three dimensions) ─────────────────────────────────

/** Per-scene script quality result */
export interface SceneScriptQualityResult {
  sceneId: string;
  sceneTitle: string;
  /** Dimension 1: narration clarity */
  clarityStatus: QualityStatus;
  clarityNote?: string;
  /** Dimension 2: visual layer alignment */
  alignmentStatus: QualityStatus;
  alignmentNote?: string;
  /** Dimension 3: duration appropriateness */
  durationStatus: QualityStatus;
  durationNote?: string;
  /** Overall heuristic score 0-10 (D-08) */
  heuristicScore?: number;
  heuristicNote?: string;
}

/** Aggregated script quality section */
export interface ScriptQualitySection {
  /** Timestamp of evaluation */
  evaluatedAt: string;
  /** Overall script status (worst of all scenes) */
  overallStatus: QualityStatus;
  scenes: SceneScriptQualityResult[];
  /** Any evaluation-level error (e.g. LLM call failed) */
  evaluationError?: string;
}

// ─── Screenshot Quality ───────────────────────────────────────────────────────

/** Per-layer screenshot quality match result */
export interface LayerScreenshotMatchResult {
  sceneId: string;
  layerId: string;
  /** Whether a screenshot file was found */
  fileFound: boolean;
  /** Content relevance status */
  relevanceStatus: QualityStatus;
  relevanceNote?: string;
  /** Visual quality status (blur, layout, etc.) */
  visualStatus: QualityStatus;
  visualNote?: string;
}

/** Aggregated screenshot quality section */
export interface ScreenshotQualitySection {
  evaluatedAt: string;
  overallStatus: QualityStatus;
  layers: LayerScreenshotMatchResult[];
  /** Any evaluation-level error (e.g. vision provider call failed) */
  evaluationError?: string;
}

// ─── Error record ─────────────────────────────────────────────────────────────

/** Non-fatal error recorded to report (never thrown to main flow) */
export interface QualityErrorRecord {
  step: "script" | "screenshot";
  message: string;
  /** ISO 8601 */
  timestamp: string;
}

// ─── Full report state ────────────────────────────────────────────────────────

/**
 * The in-memory representation of quality-report.md.
 * Both script and screenshot write through this type before serializing.
 */
export interface QualityReport {
  /** ISO 8601 — when this report state was last built */
  generatedAt: string;
  /** Absolute path to the output directory */
  outputDir: string;
  /** Present once create step has run */
  scriptQuality?: ScriptQualitySection;
  /** Present once resume step has run */
  screenshotQuality?: ScreenshotQualitySection;
  /** Accumulated non-fatal errors from either step */
  errors: QualityErrorRecord[];
}
