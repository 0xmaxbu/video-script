import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateHandDrawnArrowPaths } from "./index.js";
import type { AnnotationColor } from "../../types.js";

export interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number;
  seed?: number;
}

/**
 * Hand-drawn arrow annotation
 *
 * Smooth cubic bezier body with a V-shaped arrowhead.
 * One-stroke animation via stroke-dashoffset.
 */
export const Arrow: React.FC<ArrowProps> = ({
  x1,
  y1,
  x2,
  y2,
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

  // Generate smooth arrow paths
  const { bodyPath, headPath, bodyLength } = generateHandDrawnArrowPaths(
    x1, y1, x2, y2, seed, 6, 12,
  );
  // Second sketchy pass
  const pass2 = generateHandDrawnArrowPaths(
    x1, y1, x2, y2, seed + 1000, 4, 10,
  );

  // Clamp progress
  const clampedProgress = Math.min(progress, 1);

  // stroke-dashoffset controls drawing progress
  const strokeDashoffset = interpolate(clampedProgress, [0, 1], [bodyLength, 0], {
    extrapolateRight: "clamp",
  });

  const arrowSize = 12;
  const minX = Math.min(x1, x2 - arrowSize);
  const maxX = Math.max(x1, x2 + arrowSize);
  const minY = Math.min(y1, y2 - arrowSize);
  const maxY = Math.max(y1, y2 + arrowSize);

  return (
    <svg
      style={{
        position: "absolute",
        left: minX - 15,
        top: minY - 15,
        width: maxX - minX + 30,
        height: maxY - minY + 30,
        overflow: "visible",
      }}
    >
      {/* Second pass - sketchy overlay for body */}
      <path
        d={pass2.bodyPath}
        stroke={getAnnotationColor(color)}
        strokeWidth={strokeWidth * 0.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.4}
        strokeDasharray={bodyLength}
        strokeDashoffset={strokeDashoffset}
      />
      {/* Main line */}
      <path
        d={bodyPath}
        stroke={getAnnotationColor(color)}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={bodyLength}
        strokeDashoffset={strokeDashoffset}
        style={{
          filter: `drop-shadow(0 0 4px ${getAnnotationColor(color)}40)`,
        }}
      />
      {/* Arrowhead */}
      <path
        d={headPath}
        stroke={getAnnotationColor(color)}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDashoffset={strokeDashoffset}
        style={{
          filter: `drop-shadow(0 0 4px ${getAnnotationColor(color)}40)`,
        }}
      />
    </svg>
  );
};
