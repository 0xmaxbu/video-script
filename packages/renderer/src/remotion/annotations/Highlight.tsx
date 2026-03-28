import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateHandDrawnRectPath, generateHandDrawnRectPoints, estimatePathLength } from "./index.js";
import type { AnnotationColor } from "../../types.js";

export interface HighlightProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: AnnotationColor;
  opacity?: number;
  appearAt?: number;
  seed?: number;
}

/**
 * Hand-drawn highlight annotation
 *
 * Smooth rect path using cubic beziers for each side.
 * Stroke-dashoffset for drawing animation, fill fades in.
 */
export const Highlight: React.FC<HighlightProps> = ({
  x,
  y,
  width,
  height,
  color,
  opacity = 0.3,
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

  // Smooth rect path
  const path = generateHandDrawnRectPath(x, y, width, height, seed, 4);
  const basePoints = generateHandDrawnRectPoints(x, y, width, height, seed, 4);
  const pathLength = estimatePathLength(basePoints);

  // Clamp progress
  const clampedProgress = Math.min(progress, 1);

  // stroke-dashoffset controls drawing progress
  const strokeDashoffset = interpolate(clampedProgress, [0, 1], [pathLength, 0], {
    extrapolateRight: "clamp",
  });

  // Fill opacity animation
  const fillOpacity = interpolate(clampedProgress, [0, 1], [0, opacity], {
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
