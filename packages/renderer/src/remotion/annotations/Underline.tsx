import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateHandDrawnWavePath, generateHandDrawnWavePoints, estimatePathLength } from "./index.js";
import type { AnnotationColor } from "../../types.js";

export interface UnderlineProps {
  x: number;
  y: number;
  width: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number;
  seed?: number;
}

/**
 * Hand-drawn underline annotation
 *
 * Smooth wave using cubic beziers, not per-point noise.
 * One-stroke animation via stroke-dashoffset.
 */
export const Underline: React.FC<UnderlineProps> = ({
  x,
  y,
  width,
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

  // Primary stroke: smooth wave path
  const path = generateHandDrawnWavePath(x, y, width, seed, 4, 25);
  // Second sketchy pass: different seed
  const path2 = generateHandDrawnWavePath(x, y, width, seed + 1000, 3, 28);

  // Estimate path length from coarse wave points
  const basePoints = generateHandDrawnWavePoints(x, y, width, seed, 4, 25);
  const pathLength = estimatePathLength(basePoints);

  // Clamp progress
  const clampedProgress = Math.min(progress, 1);

  // stroke-dashoffset controls drawing progress
  const strokeDashoffset = interpolate(clampedProgress, [0, 1], [pathLength, 0], {
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
