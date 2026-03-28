import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateWobblyPath } from "./index.js";
import type { AnnotationColor } from "../../types.js";

export interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number;
}

/**
 * 手绘箭头标注
 *
 * 一笔画动画：使用 stroke-dashoffset 实现绘制效果
 */
export const Arrow: React.FC<ArrowProps> = ({
  x1,
  y1,
  x2,
  y2,
  color,
  strokeWidth = 3,
  wobble = 8,
  appearAt = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 动画进度
  const effectiveFrame = Math.max(0, frame - appearAt);
  const progress = spring({
    frame: effectiveFrame,
    fps,
    config: { damping: 100, stiffness: 300 },
  });

  // 生成手绘箭头路径
  const bodyPoints: Array<{ x: number; y: number }> = [
    { x: x1, y: y1 },
    { x: x2, y: y2 },
  ];
  const bodyPath = generateWobblyPath(bodyPoints, wobble, 0);
  const bodyPath2 = generateWobblyPath(bodyPoints, wobble * 0.7, 1);
  const pathLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  // 箭头头部
  const arrowSize = 12;
  const arrowPoints: Array<{ x: number; y: number }> = [
    { x: x2, y: y2 },
    { x: x2 - arrowSize, y: y2 + arrowSize / 2 },
    { x: x2 - arrowSize, y: y2 - arrowSize / 2 },
    { x: x2, y: y2 },
  ];
  const arrowPath = generateWobblyPath(arrowPoints, wobble * 0.5, 0);

  // stroke-dashoffset 控制绘制进度
  const strokeDashoffset = interpolate(progress, [0, 1], [pathLength, 0], {
    extrapolateRight: "clamp",
  });

  const minX = Math.min(x1, x2 - arrowSize);
  const maxX = Math.max(x1, x2 + arrowSize);
  const minY = Math.min(y1, y2 - arrowSize);
  const maxY = Math.max(y1, y2 + arrowSize);

  return (
    <svg
      style={{
        position: "absolute",
        left: minX - 15,
        top: minY - 15,
        width: maxX - minX + 30,
        height: maxY - minY + 30,
        overflow: "visible",
      }}
    >
      {/* Second pass - sketchy overlay for body */}
      <path
        d={bodyPath2}
        stroke={getAnnotationColor(color)}
        strokeWidth={strokeWidth * 0.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.4}
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
      />
      {/* 主线 */}
      <path
        d={bodyPath}
        stroke={getAnnotationColor(color)}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
        style={{
          filter: `drop-shadow(0 0 4px ${getAnnotationColor(color)}40)`,
        }}
      />
      {/* 箭头头部 */}
      <path
        d={arrowPath}
        stroke={getAnnotationColor(color)}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDashoffset={strokeDashoffset}
        style={{
          filter: `drop-shadow(0 0 4px ${getAnnotationColor(color)}40)`,
        }}
      />
    </svg>
  );
};
