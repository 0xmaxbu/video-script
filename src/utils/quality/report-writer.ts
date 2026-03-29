/**
 * Report writer — entire-file overwrite of quality-report.md.
 *
 * Per D-09: both Script Quality and Screenshot Quality write to the same file.
 * Second call overwrites the entire file (not append).
 *
 * The writer is the only place that serializes QualityReport → markdown.
 * Producers must not build their own markdown strings.
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import type {
  QualityReport,
  QualityStatus,
  ScriptQualitySection,
  ScreenshotQualitySection,
  QualityErrorRecord,
} from "../../types/quality.js";

// ─── Status rendering ─────────────────────────────────────────────────────────

function statusEmoji(status: QualityStatus): string {
  switch (status) {
    case "ok":
      return "✅";
    case "warning":
      return "⚠️";
    case "error":
      return "❌";
  }
}

function statusLabel(status: QualityStatus): string {
  return `${statusEmoji(status)} ${status.toUpperCase()}`;
}

// ─── Section serializers ──────────────────────────────────────────────────────

function serializeScriptSection(section: ScriptQualitySection): string {
  const lines: string[] = [
    "## Script Quality",
    "",
    `**Overall:** ${statusLabel(section.overallStatus)}  `,
    `**Evaluated:** ${section.evaluatedAt}`,
    "",
  ];

  if (section.evaluationError) {
    lines.push(`> **Evaluation Error:** ${section.evaluationError}`, "");
  }

  if (section.scenes.length === 0) {
    lines.push("_No scenes evaluated._", "");
    return lines.join("\n");
  }

  for (const scene of section.scenes) {
    lines.push(`### Scene: ${scene.sceneTitle} (\`${scene.sceneId}\`)`);
    lines.push("");
    lines.push(
      `| Dimension | Status | Note |`,
      `|-----------|--------|------|`,
      `| 内容深度 (Depth) | ${statusLabel(scene.depthStatus)} | ${scene.depthNote ?? ""} |`,
      `| 具体性 (Specificity) | ${statusLabel(scene.specificityStatus)} | ${scene.specificityNote ?? ""} |`,
      `| 覆盖度 (Coverage) | ${statusLabel(scene.coverageStatus)} | ${scene.coverageNote ?? ""} |`,
    );
    if (scene.llmScore !== undefined) {
      lines.push(
        "",
        `**LLM score:** ${scene.llmScore}/10${scene.llmNote ? ` — ${scene.llmNote}` : ""}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function serializeScreenshotSection(section: ScreenshotQualitySection): string {
  const lines: string[] = [
    "## Screenshot Quality",
    "",
    `**Overall:** ${statusLabel(section.overallStatus)}  `,
    `**Evaluated:** ${section.evaluatedAt}`,
    "",
  ];

  if (section.evaluationError) {
    lines.push(`> **Evaluation Error:** ${section.evaluationError}`, "");
  }

  if (section.layers.length === 0) {
    lines.push("_No layers evaluated._", "");
    return lines.join("\n");
  }

  lines.push(
    `| Scene | Layer | Found | Relevance | Visual |`,
    `|-------|-------|-------|-----------|--------|`,
  );

  for (const layer of section.layers) {
    lines.push(
      `| ${layer.sceneId} | ${layer.layerId} | ${layer.fileFound ? "✅" : "❌"} | ${statusLabel(layer.relevanceStatus)}${layer.relevanceNote ? ` — ${layer.relevanceNote}` : ""} | ${statusLabel(layer.visualStatus)}${layer.visualNote ? ` — ${layer.visualNote}` : ""} |`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

function serializeErrors(errors: QualityErrorRecord[]): string {
  if (errors.length === 0) return "";
  const lines = ["## Evaluation Errors", ""];
  for (const err of errors) {
    lines.push(`- **[${err.step}]** \`${err.timestamp}\` — ${err.message}`);
  }
  lines.push("");
  return lines.join("\n");
}

// ─── Main writer ──────────────────────────────────────────────────────────────

/**
 * Serialize a QualityReport to markdown and overwrite quality-report.md entirely.
 *
 * @param report  - The full report state (may have only scriptQuality, or both)
 * @param reportPath - Absolute path to quality-report.md
 */
export function writeQualityReport(
  report: QualityReport,
  reportPath: string,
): void {
  const sections: string[] = [
    `# Quality Report`,
    "",
    `**Generated:** ${report.generatedAt}  `,
    `**Output dir:** \`${report.outputDir}\``,
    "",
  ];

  if (report.scriptQuality) {
    sections.push(serializeScriptSection(report.scriptQuality));
  }

  if (report.screenshotQuality) {
    sections.push(serializeScreenshotSection(report.screenshotQuality));
  }

  const errSection = serializeErrors(report.errors);
  if (errSection) {
    sections.push(errSection);
  }

  const content = sections.join("\n");
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, content, "utf-8");
}
