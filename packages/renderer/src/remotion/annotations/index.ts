/**
 * Annotation Components - Phase 6
 *
 * 手绘风格标注组件
 * 核心特点：一笔画动画（stroke-dashoffset）
 */

export { Circle } from "./Circle.js";

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
 * 生成手绘抖动路径
 * 为 SVG 路径添加随机抖动，模拟手绘效果
 */
export function generateWobblyPath(
  points: Array<{ x: number; y: number }>,
  wobble: number = 2,
): string {
  if (points.length < 2) return "";

  const result: string[] = [];
  result.push(`M ${points[0].x + (Math.random() - 0.5) * wobble} ${points[0].y + (Math.random() - 0.5) * wobble}`);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2 + (Math.random() - 0.5) * wobble;
    const midY = (prev.y + curr.y) / 2 + (Math.random() - 0.5) * wobble;
    result.push(`Q ${midX} ${midY} ${curr.x + (Math.random() - 0.5) * wobble} ${curr.y + (Math.random() - 0.5) * wobble}`);
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
