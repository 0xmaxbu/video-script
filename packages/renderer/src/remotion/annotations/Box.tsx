import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateWobblyPath } from "./index.js";
import type { AnnotationColor } from "@video-script/types";

export interface BoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number;
}

/**
 * 手绘矩形框标注
 *
 * 一笔画动画：使用 stroke-dashoffset 实现绘制效果
 */
export const Box: React.FC<BoxProps> = ({
  x,
  y,
  width,
  height,
  color,
  strokeWidth = 3,
  wobble = 3,
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

  // 生成手绘矩形路径
  const points: Array<{ x: number; y: number }> = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
    { x, y },
  ];
  const path = generateWobblyPath(points, wobble);
  const pathLength = 2 * (width + height);

  // stroke-dashoffset 控制绘制进度
  const strokeDashoffset = interpolate(progress, [0, 1], [pathLength, 0], {
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
    </svg>
  );
};
