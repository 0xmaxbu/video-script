import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateWobblyPath } from "./index.js";
import type { AnnotationColor } from "../../types.js";

export interface HighlightProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: AnnotationColor;
  opacity?: number;
  appearAt?: number;
}

/**
 * 手绘高亮标注
 *
 * 使用 stroke-dashoffset 实现填充效果
 */
export const Highlight: React.FC<HighlightProps> = ({
  x,
  y,
  width,
  height,
  color,
  opacity = 0.3,
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

  // 生成手绘矩形路径（填充）
  const inset = 2;
  const points: Array<{ x: number; y: number }> = [
    { x: x + inset, y: y + inset },
    { x: x + width - inset, y: y + inset },
    { x: x + width - inset, y: y + height - inset },
    { x: x + inset, y: y + height - inset },
    { x: x + inset, y: y + inset },
  ];
  const path = generateWobblyPath(points, 2);
  const pathLength = 2 * ((width - 2 * inset) + (height - 2 * inset));

  // stroke-dashoffset 控制绘制进度
  const strokeDashoffset = interpolate(progress, [0, 1], [pathLength, 0], {
    extrapolateRight: "clamp",
  });

  // 填充透明度动画
  const fillOpacity = interpolate(progress, [0, 1], [0, opacity], {
    extrapolateRight: "clamp",
  });

  return (
    <svg
      style={{
        position: "absolute",
        left: x - 10,
        top: y - 10,
        width: width + 20,
        height: height + 20,
        overflow: "visible",
      }}
    >
      <path
        d={path}
        stroke={getAnnotationColor(color)}
        strokeWidth={height}
        fill={getAnnotationColor(color)}
        fillOpacity={fillOpacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
        style={{
          filter: `drop-shadow(0 0 4px ${getAnnotationColor(color)}40)`,
        }}
      />
    </svg>
  );
};
