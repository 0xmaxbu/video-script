/**
 * Annotation Components - Phase 1
 *
 * 手绘风格标注组件
 * 核心特点：一笔画动画（stroke-dashoffset）
 */

// 导出所有标注组件
export { Circle } from "./Circle.js";
export { Underline } from "./Underline.js";
export { Arrow } from "./Arrow.js";
export { Box } from "./Box.js";
export { Highlight } from "./Highlight.js";
export { Number } from "./Number.js";
export { AnnotationRenderer } from "./AnnotationRenderer.js";

// 颜色常量
export const ANNOTATION_COLORS = {
  attention: "#FF3B30", // 红色
  highlight: "#FFCC00", // 黄色
  info: "#007AFF", // 蓝色
  success: "#34C759", // 绿色
} as const;

export type AnnotationColor = keyof typeof ANNOTATION_COLORS;

/**
 * 获取标注颜色值
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
 * Hash a coordinate pair + pass index into a seed integer.
 * Uses bit mixing so nearby coordinates get very different seeds.
 */
function hashSeed(
  x: number,
  y: number,
  pass: number = 0,
): number {
  // FNV-1a inspired mixing
  let h = 2166136261 ^ pass;
  h = Math.imul(h ^ Math.round(x * 137), 16777619);
  h = Math.imul(h ^ Math.round(y * 251), 16777619);
  h = Math.imul(h ^ pass, 16777619);
  return h >>> 0;
}

/**
 * Generate a hand-drawn wobbly SVG path from control points.
 *
 * Key design decisions:
 * - Deterministic: uses seeded PRNG keyed on the first point + pass number,
 *   so the same path is produced on every Remotion frame (no jitter).
 * - Multi-segment quadratic Bezier with jitter on both control and end points.
 * - Wobble amount is larger than before (default 8) to be visible at 1920x1080.
 *
 * @param points  Shape control points (e.g. circle vertices, rectangle corners)
 * @param wobble  Max pixel displacement per point (default 8, was 2-3 before)
 * @param pass    Stroke pass index (0 = primary, 1+ = secondary sketchy strokes)
 */
export function generateWobblyPath(
  points: Array<{ x: number; y: number }>,
  wobble: number = 8,
  pass: number = 0,
): string {
  if (points.length < 2) return "";

  const seed = hashSeed(points[0].x, points[0].y, pass);
  const rand = createSeededRandom(seed);

  const result: string[] = [];

  // Starting point with jitter
  const sx = points[0].x + (rand() - 0.5) * wobble;
  const sy = points[0].y + (rand() - 0.5) * wobble;
  result.push(`M ${sx.toFixed(1)} ${sy.toFixed(1)}`);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    // Control point at midpoint + jitter (larger jitter for hand-drawn feel)
    const midX = (prev.x + curr.x) / 2 + (rand() - 0.5) * wobble * 1.5;
    const midY = (prev.y + curr.y) / 2 + (rand() - 0.5) * wobble * 1.5;

    // End point with jitter
    const ex = curr.x + (rand() - 0.5) * wobble;
    const ey = curr.y + (rand() - 0.5) * wobble;

    result.push(`Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
  }

  return result.join(" ");
}

/**
 * 计算路径长度（用于 stroke-dasharray）
 */
export function calculatePathLength(path: string): number {
  // 简化估算：基于路径字符串长度
  return path.length * 0.5;
}
