import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateWobblyPath } from "./index.js";
import type { AnnotationColor } from "@video-script/types";

export interface CircleProps {
  x: number;
  y: number;
  radius: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number; // 帧数
}

/**
 * 手绘圆圈标注
 *
 * 一笔画动画：使用 stroke-dashoffset 实现绘制效果
 */
export const Circle: React.FC<CircleProps> = ({
  x,
  y,
  radius,
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

  // 生成手绘圆圈路径
  const points: Array<{ x: number; y: number }> = [];
  const segments = 36; // 圆的分段数

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
    });
  }

  const path = generateWobblyPath(points, wobble);
  const pathLength = 2 * Math.PI * radius; // 近似路径长度

  // stroke-dashoffset 控制绘制进度
  const strokeDashoffset = interpolate(progress, [0, 1], [pathLength, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <svg
      style={{
        position: "absolute",
        left: x - radius - 10,
        top: y - radius - 10,
        width: radius * 2 + 20,
        height: radius * 2 + 20,
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
