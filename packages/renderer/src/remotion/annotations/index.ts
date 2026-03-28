/**
 * Annotation Components - Phase 3: Smooth Hand-Drawn Style
 *
 * Core principle: Real hand-drawn annotations are drawn FAST in one smooth stroke.
 * They are described by FEW parameters (ellipse ratio, tilt, curve direction),
 * NOT by per-point noise. There should be ZERO jitter/shaking.
 *
 * - Circle: tilted ellipse with random semi-axes and rotation angle
 * - Line: single cubic bezier with gentle curvature
 * - Underline: smooth bezier wave with few control points
 * - Rect: four smooth curved sides
 */

// Export all annotation components
export { Circle } from "./Circle.js";
export { Underline } from "./Underline.js";
export { Arrow } from "./Arrow.js";
export { Box } from "./Box.js";
export { Highlight } from "./Highlight.js";
export { Number } from "./Number.js";
export { AnnotationRenderer } from "./AnnotationRenderer.js";

// Color constants
export const ANNOTATION_COLORS = {
  attention: "#FF3B30",
  highlight: "#FFCC00",
  info: "#007AFF",
  success: "#34C759",
} as const;

export type AnnotationColor = keyof typeof ANNOTATION_COLORS;

/**
 * Get annotation color value
 */
export function getAnnotationColor(color: AnnotationColor): string {
  return ANNOTATION_COLORS[color];
}

/**
 * Deterministic seeded PRNG (Mulberry32)
 *
 * Returns a function that produces pseudo-random numbers in [0, 1).
 * Same seed always produces the same sequence -- essential for Remotion
 * which re-renders every frame (Math.random() would cause jitter).
 */
function createSeededRandom(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a smooth hand-drawn ellipse SVG path.
 *
 * Instead of many noisy points, we generate a TILTED ELLIPSE defined by:
 *   - Semi-major axis (slightly larger or smaller than base radius)
 *   - Semi-minor axis (slightly different from semi-major)
 *   - Rotation angle (slight tilt)
 *
 * This produces ONE smooth, continuous curve -- like someone drew a circle
 * quickly with a pen. No jitter because the path has no per-point noise.
 *
 * Returns an SVG path string (not points).
 */
export function generateHandDrawnEllipsePath(
  cx: number,
  cy: number,
  radius: number,
  seed: number = 42,
  irregularity: number = 0.12,
): string {
  const rand = createSeededRandom(seed);

  // Random semi-axes around the base radius
  const semiA = radius * (1 + (rand() - 0.5) * 2 * irregularity);
  const semiB = radius * (1 + (rand() - 0.5) * 2 * irregularity);
  // Random tilt angle (up to ~15 degrees)
  const tilt = (rand() - 0.5) * 0.5; // radians, max ~14.3 degrees

  // Generate ellipse points using parametric equation with rotation
  // Use ~60 segments for a smooth ellipse
  const segments = 60;
  const points: string[] = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;

    // Parametric ellipse point (before rotation)
    const ex = semiA * Math.cos(angle);
    const ey = semiB * Math.sin(angle);

    // Apply rotation
    const rx = ex * Math.cos(tilt) - ey * Math.sin(tilt);
    const ry = ex * Math.sin(tilt) + ey * Math.cos(tilt);

    const px = cx + rx;
    const py = cy + ry;

    if (i === 0) {
      points.push(`M ${px.toFixed(2)} ${py.toFixed(2)}`);
    } else {
      points.push(`L ${px.toFixed(2)} ${py.toFixed(2)}`);
    }
  }

  // Close the path explicitly to avoid gaps
  points.push("Z");
  return points.join(" ");
}

/**
 * Generate a smooth hand-drawn circle as points (for components that need points).
 *
 * Returns an array of {x, y} points that trace a tilted ellipse.
 * The last point equals the first point (closed shape).
 */
export function generateHandDrawnCirclePoints(
  cx: number,
  cy: number,
  radius: number,
  seed: number = 42,
  irregularity: number = 0.12,
): Array<{ x: number; y: number }> {
  const rand = createSeededRandom(seed);

  // Random semi-axes around the base radius
  const semiA = radius * (1 + (rand() - 0.5) * 2 * irregularity);
  const semiB = radius * (1 + (rand() - 0.5) * 2 * irregularity);
  // Random tilt angle (up to ~15 degrees)
  const tilt = (rand() - 0.5) * 0.5;

  const points: Array<{ x: number; y: number }> = [];
  const segments = 60;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;

    // Parametric ellipse point (before rotation)
    const ex = semiA * Math.cos(angle);
    const ey = semiB * Math.sin(angle);

    // Apply rotation
    const rx = ex * Math.cos(tilt) - ey * Math.sin(tilt);
    const ry = ex * Math.sin(tilt) + ey * Math.cos(tilt);

    points.push({
      x: cx + rx,
      y: cy + ry,
    });
  }

  return points;
}

/**
 * Generate a smooth hand-drawn line as a single cubic bezier SVG path.
 *
 * A real hand-drawn line is a single smooth curve with gentle curvature.
 * We define it with just a start point, end point, and 1-2 control points
 * that are offset perpendicular to the line. This creates a smooth arc,
 * not a jagged zigzag.
 *
 * Returns an SVG path string.
 */
export function generateHandDrawnLinePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number = 42,
  curvature: number = 8,
): string {
  const rand = createSeededRandom(seed);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Perpendicular direction
  const perpX = -dy / len;
  const perpY = dx / len;

  // Two control points for cubic bezier, offset perpendicular to line
  // The offset creates a smooth, gentle curve
  const cp1Offset = (rand() - 0.5) * 2 * curvature;
  const cp2Offset = (rand() - 0.5) * 2 * curvature;

  // Control points at 1/3 and 2/3 along the line
  const cp1x = x1 + dx * 0.33 + perpX * cp1Offset;
  const cp1y = y1 + dy * 0.33 + perpY * cp1Offset;
  const cp2x = x1 + dx * 0.67 + perpX * cp2Offset;
  const cp2y = y1 + dy * 0.67 + perpY * cp2Offset;

  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/**
 * Generate a smooth hand-drawn underline (wavy line) as SVG path.
 *
 * A hand-drawn underline is a smooth wave, not a mathematically perfect sine.
 * We use a series of cubic bezier curves, where each wave has slightly
 * different amplitude and width. But the key is: each segment is a smooth
 * bezier, NOT independent points with noise.
 *
 * Returns an SVG path string.
 */
export function generateHandDrawnWavePath(
  x: number,
  y: number,
  width: number,
  seed: number = 42,
  amplitude: number = 4,
  wavelength: number = 25,
): string {
  const rand = createSeededRandom(seed);

  // Number of complete wave cycles
  const numWaves = Math.max(2, Math.round(width / wavelength));
  const waveWidth = width / numWaves;

  const parts: string[] = [];
  parts.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);

  for (let w = 0; w < numWaves; w++) {
    const waveStart = x + w * waveWidth;
    const waveMid = waveStart + waveWidth / 2;
    const waveEnd = waveStart + waveWidth;

    // Each wave gets slightly different amplitude (hand-drawn irregularity)
    const peakAmp = amplitude * (0.7 + rand() * 0.6);
    const troughAmp = amplitude * (0.7 + rand() * 0.6);

    // Draw one wave cycle using two cubic beziers for a smooth S-curve
    // First half-wave: rise to peak
    const peakX = (waveStart + waveMid) / 2;
    const peakY = y - peakAmp;
    parts.push(
      `C ${(waveStart + waveWidth * 0.25).toFixed(2)} ${(y - peakAmp).toFixed(2)} ${waveMid.toFixed(2)} ${(y + peakAmp * 0.1).toFixed(2)} ${peakX.toFixed(2)} ${peakY.toFixed(2)}`
    );
    // Second half-wave: dip to trough
    parts.push(
      `C ${(waveMid + waveWidth * 0.1).toFixed(2)} ${(y + troughAmp * 0.5).toFixed(2)} ${(waveEnd - waveWidth * 0.25).toFixed(2)} ${(y + troughAmp).toFixed(2)} ${waveEnd.toFixed(2)} ${y.toFixed(2)}`
    );
  }

  return parts.join(" ");
}

/**
 * Generate hand-drawn rectangle as SVG path.
 *
 * Each side is a single smooth cubic bezier with slight bowing.
 * Corners are slightly offset from perfect positions.
 * The result is 4 smooth curves joined together.
 *
 * Returns an SVG path string.
 */
export function generateHandDrawnRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  seed: number = 42,
  irregularity: number = 5,
): string {
  const rand = createSeededRandom(seed);

  // Corners with small offset
  const tl = { x: x + (rand() - 0.5) * irregularity, y: y + (rand() - 0.5) * irregularity };
  const tr = { x: x + width + (rand() - 0.5) * irregularity, y: y + (rand() - 0.5) * irregularity };
  const br = { x: x + width + (rand() - 0.5) * irregularity, y: y + height + (rand() - 0.5) * irregularity };
  const bl = { x: x + (rand() - 0.5) * irregularity, y: y + height + (rand() - 0.5) * irregularity };

  // For each side, create a cubic bezier with slight bowing
  const bow = irregularity * 0.4;

  function sidePath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    bowAmount: number,
  ): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Perpendicular direction for bowing
    const perpX = -dy / len;
    const perpY = dx / len;
    const b = (rand() - 0.5) * 2 * bowAmount;

    // Cubic bezier: control points at 1/3 and 2/3, offset perpendicular
    const cp1x = from.x + dx * 0.33 + perpX * b * 0.5;
    const cp1y = from.y + dy * 0.33 + perpY * b * 0.5;
    const cp2x = from.x + dx * 0.67 + perpX * b;
    const cp2y = from.y + dy * 0.67 + perpY * b;

    return `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
  }

  // Build closed path: TL -> TR -> BR -> BL -> TL
  const parts: string[] = [];
  parts.push(`M ${tl.x.toFixed(2)} ${tl.y.toFixed(2)}`);
  parts.push(sidePath(tl, tr, bow)); // top
  parts.push(sidePath(tr, br, bow)); // right
  parts.push(sidePath(br, bl, bow)); // bottom
  parts.push(sidePath(bl, tl, bow)); // left
  parts.push("Z");

  return parts.join(" ");
}

/**
 * Generate hand-drawn rectangle points (for path length estimation).
 *
 * Returns the corner points (with offsets) for the same parameters as
 * generateHandDrawnRectPath(). Used by estimatePathLength().
 */
export function generateHandDrawnRectPoints(
  x: number,
  y: number,
  width: number,
  height: number,
  seed: number = 42,
  irregularity: number = 5,
): Array<{ x: number; y: number }> {
  const rand = createSeededRandom(seed);

  const tl = { x: x + (rand() - 0.5) * irregularity, y: y + (rand() - 0.5) * irregularity };
  const tr = { x: x + width + (rand() - 0.5) * irregularity, y: y + (rand() - 0.5) * irregularity };
  const br = { x: x + width + (rand() - 0.5) * irregularity, y: y + height + (rand() - 0.5) * irregularity };
  const bl = { x: x + (rand() - 0.5) * irregularity, y: y + height + (rand() - 0.5) * irregularity };

  // Include midpoints for better length estimation (matching the curved sides)
  const bow = irregularity * 0.4;
  const points: Array<{ x: number; y: number }> = [];

  function addSidePoints(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    const b = (rand() - 0.5) * 2 * bow;

    points.push(from);
    points.push({
      x: from.x + dx * 0.33 + perpX * b * 0.5,
      y: from.y + dy * 0.33 + perpY * b * 0.5,
    });
    points.push({
      x: from.x + dx * 0.67 + perpX * b,
      y: from.y + dy * 0.67 + perpY * b,
    });
  }

  addSidePoints(tl, tr);
  addSidePoints(tr, br);
  addSidePoints(br, bl);
  addSidePoints(bl, tl);

  return points;
}

/**
 *
 * The body is a single cubic bezier (gentle curve).
 * The arrowhead is two short lines from the endpoint.
 *
 * Returns { bodyPath, headPath, bodyLength } for animation.
 */
export function generateHandDrawnArrowPaths(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number = 42,
  curvature: number = 6,
  arrowSize: number = 12,
): { bodyPath: string; headPath: string; bodyLength: number } {
  const rand = createSeededRandom(seed);

  // Body: single cubic bezier
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  const cp1Offset = (rand() - 0.5) * 2 * curvature;
  const cp2Offset = (rand() - 0.5) * 2 * curvature;

  const cp1x = x1 + dx * 0.33 + perpX * cp1Offset;
  const cp1y = y1 + dy * 0.33 + perpY * cp1Offset;
  const cp2x = x1 + dx * 0.67 + perpX * cp2Offset;
  const cp2y = y1 + dy * 0.67 + perpY * cp2Offset;

  const bodyPath = `M ${x1.toFixed(2)} ${y1.toFixed(2)} C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;

  // Arrowhead direction (use the direction of the last segment)
  const dirX = dx / len;
  const dirY = dy / len;
  const headAngle = 0.4; // ~23 degrees

  const h1x = x2 - arrowSize * (dirX * Math.cos(headAngle) - dirY * Math.sin(headAngle));
  const h1y = y2 - arrowSize * (dirY * Math.cos(headAngle) + dirX * Math.sin(headAngle));
  const h2x = x2 - arrowSize * (dirX * Math.cos(headAngle) + dirY * Math.sin(headAngle));
  const h2y = y2 - arrowSize * (dirY * Math.cos(headAngle) - dirX * Math.sin(headAngle));

  // Arrowhead as a V shape
  const headPath = `M ${h1x.toFixed(2)} ${h1y.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} L ${h2x.toFixed(2)} ${h2y.toFixed(2)}`;

  // Estimate cubic bezier length
  const bodyLength = estimateCubicBezierLength(
    x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2,
  );

  return { bodyPath, headPath, bodyLength };
}

/**
 * Estimate the length of a cubic bezier curve by sampling.
 */
function estimateCubicBezierLength(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  samples: number = 20,
): number {
  let length = 0;
  let prevX = x0;
  let prevY = y0;

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;

    // Cubic bezier point at t
    const px =
      mt * mt * mt * x0 +
      3 * mt * mt * t * x1 +
      3 * mt * t * t * x2 +
      t * t * t * x3;
    const py =
      mt * mt * mt * y0 +
      3 * mt * mt * t * y1 +
      3 * mt * t * t * y2 +
      t * t * t * y3;

    const dx = px - prevX;
    const dy = py - prevY;
    length += Math.sqrt(dx * dx + dy * dy);
    prevX = px;
    prevY = py;
  }

  return length;
}

/**
 * Estimate SVG path length from points (for closed paths like circles/rects).
 */
export function estimatePathLength(points: Array<{ x: number; y: number }>): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  // Add a safety margin for smooth rendering
  return Math.ceil(length * 1.05);
}

/**
 * Generate a smooth hand-drawn line as points (for components that need points).
 *
 * Returns just start and end points -- use generateHandDrawnLinePath()
 * for the actual SVG path.
 */
export function generateHandDrawnLinePoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  _seed: number = 42,
  _waviness: number = 5,
): Array<{ x: number; y: number }> {
  // Keep the signature for compatibility but the path is generated
  // by generateHandDrawnLinePath() which uses cubic beziers
  return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
}

/**
 * Generate hand-drawn wave points (for components that need points).
 * Returns a coarse set of points along the wave for length estimation.
 */
export function generateHandDrawnWavePoints(
  x: number,
  y: number,
  width: number,
  seed: number = 42,
  amplitude: number = 4,
  wavelength: number = 25,
): Array<{ x: number; y: number }> {
  const rand = createSeededRandom(seed);
  const numWaves = Math.max(2, Math.round(width / wavelength));
  const waveWidth = width / numWaves;
  const points: Array<{ x: number; y: number }> = [];

  for (let w = 0; w <= numWaves; w++) {
    const px = x + w * waveWidth;
    const py = y;
    points.push({ x: px, y: py });

    // Add midpoint for each wave (for better length estimation)
    if (w < numWaves) {
      const amp = amplitude * (0.7 + rand() * 0.6);
      points.push({ x: px + waveWidth * 0.25, y: y - amp });
      points.push({ x: px + waveWidth * 0.75, y: y + amp * 0.7 });
    }
  }

  return points;
}

/**
 * Legacy function kept for backward compatibility.
 * Components should use the new path-based functions instead.
 *
 * @deprecated Use generateHandDrawnEllipsePath(), generateHandDrawnLinePath(),
 *             generateHandDrawnWavePath(), generateHandDrawnRectPath() instead.
 */
export function generateWobblyPath(
  points: Array<{ x: number; y: number }>,
  _wobble: number = 3,
  _pass: number = 0,
): string {
  if (points.length < 2) return "";

  const result: string[] = [];

  // Simple smooth path through points using quadratic beziers
  // No random offsets -- just smooth interpolation
  result.push(`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`);

  if (points.length === 2) {
    // Just a straight line for 2 points
    result.push(`L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`);
  } else {
    // Use quadratic beziers through midpoints for smooth curve
    for (let i = 1; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      result.push(`Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`);
    }
    // Last point
    const last = points[points.length - 1];
    result.push(`L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`);
  }

  return result.join(" ");
}
