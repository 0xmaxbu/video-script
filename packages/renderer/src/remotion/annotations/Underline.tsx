import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateWobblyPath } from "./index.js";
import type { AnnotationColor } from "../../types.js";

export interface UnderlineProps {
  x: number;
  y: number;
  width: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number;
}

/**
 * 手绘下划线标注
 *
 * 一笔画动画：使用 stroke-dashoffset 实现绘制效果
 */
export const Underline: React.FC<UnderlineProps> = ({
  x,
  y,
  width,
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

  // 生成手绘下划线路径
  const points: Array<{ x: number; y: number }> = [
    { x, y: y + 5 },
    { x: x + width, y: y + 5 },
  ];
  const path = generateWobblyPath(points, wobble, 0);
  const path2 = generateWobblyPath(points, wobble * 0.7, 1);
  const pathLength = width;

  // stroke-dashoffset 控制绘制进度
  const strokeDashoffset = interpolate(progress, [0, 1], [pathLength, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <svg
      style={{
        position: "absolute",
        left: x - 15,
        top: y - 15,
        width: width + 30,
        height: 40,
        overflow: "visible",
      }}
    >
      {/* Second pass - sketchy overlay */}
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
