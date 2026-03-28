import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateHandDrawnEllipsePath, generateHandDrawnCirclePoints, estimatePathLength } from "./index.js";
import type { AnnotationColor } from "../../types.js";

export interface CircleProps {
  x: number;
  y: number;
  radius: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number;
  seed?: number;
}

/**
 * Hand-drawn circle annotation
 *
 * Uses a tilted ellipse (smooth curve) instead of noisy points.
 * One-stroke animation via stroke-dashoffset.
 */
export const Circle: React.FC<CircleProps> = ({
  x,
  y,
  radius,
  color,
  strokeWidth = 3,
  wobble: _wobble = 3,
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

  // Primary stroke: tilted ellipse (smooth, no jitter)
  const path = generateHandDrawnEllipsePath(x, y, radius, seed, 0.12);
  // Second sketchy pass: different ellipse parameters
  const path2 = generateHandDrawnEllipsePath(x, y, radius, seed + 1000, 0.10);

  // Use estimated path length from points for dasharray
  const basePoints = generateHandDrawnCirclePoints(x, y, radius, seed, 0.12);
  const pathLength = estimatePathLength(basePoints);

  // Clamp progress to ensure full closure at end of animation
  const clampedProgress = Math.min(progress, 1);

  // stroke-dashoffset controls drawing progress
  const strokeDashoffset = interpolate(clampedProgress, [0, 1], [pathLength, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <svg
      style={{
        position: "absolute",
        left: x - radius - 20,
        top: y - radius - 20,
        width: radius * 2 + 40,
        height: radius * 2 + 40,
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
