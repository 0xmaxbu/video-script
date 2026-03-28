import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateWobblyPath } from "./index.js";
import type { AnnotationColor } from "../../types.js";

export interface NumberProps {
  x: number;
  y: number;
  n: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number;
}

/**
 * 数字标注（带数字的圆圈）
 *
 * 一笔画动画：使用 stroke-dashoffset 实现绘制效果
 */
export const Number: React.FC<NumberProps> = ({
  x,
  y,
  n,
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

  // 生成手绘圆圈路径
  const radius = 20;
  const points: Array<{ x: number; y: number }> = [];
  const segments = 36;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
    });
  }

  const path = generateWobblyPath(points, wobble, 0);
  const path2 = generateWobblyPath(points, wobble * 0.7, 1);
  const pathLength = 2 * Math.PI * radius;

  // stroke-dashoffset 控制绘制进度
  const strokeDashoffset = interpolate(progress, [0, 1], [pathLength, 0], {
    extrapolateRight: "clamp",
  });

  // 文字颜色：highlight 用黑色，其他用白色
  const textFill = color === "highlight" ? "black" : "white";

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
      {/* 圆圈路径 */}
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
      {/* 数字文字 */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={radius * 0.8}
        fontWeight="bold"
        fill={textFill}
      >
        {n}
      </text>
    </svg>
  );
};
