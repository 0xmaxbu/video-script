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

  // Animation: ease-out so drawing starts slow and finishes fast
  const effectiveFrame = Math.max(0, frame - appearAt);
  const rawProgress = spring({
    frame: effectiveFrame,
    fps,
    config: { damping: 100, stiffness: 300 },
  });

  // Apply ease-out curve for stroke drawing: slow start, fast finish
  // This makes the circle drawing feel more natural (hand-drawn effect)
  const clampedProgress = Math.min(rawProgress, 1);
  const easedProgress = 1 - Math.pow(1 - clampedProgress, 2.5);

  // Primary stroke: tilted ellipse (smooth, no jitter)
  const path = generateHandDrawnEllipsePath(x, y, radius, seed, 0.12);
  // Second sketchy pass: different ellipse parameters
  const path2 = generateHandDrawnEllipsePath(x, y, radius, seed + 1000, 0.10);

  // Use estimated path length from points for dasharray
  const basePoints = generateHandDrawnCirclePoints(x, y, radius, seed, 0.12);
  const pathLength = estimatePathLength(basePoints);

  // stroke-dashoffset controls drawing progress with ease-out
  const strokeDashoffset = interpolate(easedProgress, [0, 1], [pathLength, 0], {
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
