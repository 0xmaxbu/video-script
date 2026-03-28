import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateWobblyPath } from "./index.js";
import type { AnnotationColor } from "../../types.js";

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
  wobble = 10,
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
  const segments = 36;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
    });
  }

  // Primary stroke
  const path = generateWobblyPath(points, wobble, 0);
  // Second sketchy pass (lighter, slightly offset) for hand-drawn look
  const path2 = generateWobblyPath(points, wobble * 0.7, 1);
  const pathLength = 2 * Math.PI * radius;

  // stroke-dashoffset 控制绘制进度
  const strokeDashoffset = interpolate(progress, [0, 1], [pathLength, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <svg
      style={{
        position: "absolute",
        left: x - radius - 15,
        top: y - radius - 15,
        width: radius * 2 + 30,
        height: radius * 2 + 30,
        overflow: "visible",
      }}
    >
      {/* Second pass - lighter, sketchy overlay */}
      <path
        d={path2}
        stroke={getAnnotationColor(color)}
        strokeWidth={strokeWidth * 0.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.4}
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
      />
      {/* Primary stroke */}
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
