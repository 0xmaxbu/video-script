import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateHandDrawnEllipsePath, generateHandDrawnCirclePoints, estimatePathLength } from "./index.js";
import type { AnnotationColor } from "../../types.js";

export interface NumberProps {
  x: number;
  y: number;
  n: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number;
  seed?: number;
}

/**
 * Number annotation (circle with number)
 *
 * Uses tilted ellipse for the circle, smooth curve.
 * One-stroke animation via stroke-dashoffset.
 */
export const Number: React.FC<NumberProps> = ({
  x,
  y,
  n,
  color,
  strokeWidth = 3,
  wobble: _wobble = 2,
  appearAt = 0,
  seed = 42,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation progress
  const effectiveFrame = Math.max(0, frame - appearAt);
  const progress = spring({
    frame: effectiveFrame,
    fps,
    config: { damping: 100, stiffness: 300 },
  });

  // Generate smooth tilted ellipse
  const radius = 20;
  const path = generateHandDrawnEllipsePath(x, y, radius, seed, 0.15);
  const path2 = generateHandDrawnEllipsePath(x, y, radius, seed + 1000, 0.12);
  const basePoints = generateHandDrawnCirclePoints(x, y, radius, seed, 0.15);
  const pathLength = estimatePathLength(basePoints);

  // Clamp progress
  const clampedProgress = Math.min(progress, 1);

  // stroke-dashoffset controls drawing progress
  const strokeDashoffset = interpolate(clampedProgress, [0, 1], [pathLength, 0], {
    extrapolateRight: "clamp",
  });

  // Text color: highlight uses black, others use white
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
      {/* Circle path */}
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
      {/* Number text */}
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
