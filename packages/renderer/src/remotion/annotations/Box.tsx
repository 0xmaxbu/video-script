import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import {
  getAnnotationColor,
  generateHandDrawnRectPath,
  generateHandDrawnRectPoints,
  estimatePathLength,
} from "./index.js";
import type { AnnotationColor } from "../../types.js";

export interface BoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number;
  seed?: number;
}

/**
 * Hand-drawn box annotation
 *
 * Four smooth curved sides using cubic beziers.
 * One-stroke animation via stroke-dashoffset with ease-in timing.
 *
 * COORDINATE SYSTEM: The SVG element is positioned at screen (x-15, y-15).
 * All path coordinates must be LOCAL to the SVG (offset by 15 from SVG origin).
 */
export const Box: React.FC<BoxProps> = ({
  x,
  y,
  width,
  height,
  color,
  strokeWidth = 3,
  wobble: _wobble = 2,
  appearAt = 0,
  seed = 42,
}) => {
  const frame = useCurrentFrame();

  // Animation: ease-in over fixed duration
  const durationFrames = 25; // ~0.83s at 30fps
  const effectiveFrame = Math.max(0, frame - appearAt);

  // SVG-local coordinates: SVG is at (x-15, y-15), so local origin is (15, 15)
  const localX = 15;
  const localY = 15;

  // Primary stroke: smooth rect path (SVG-local coords)
  const path = generateHandDrawnRectPath(
    localX,
    localY,
    width,
    height,
    seed,
    5,
  );
  // Second sketchy pass (SVG-local coords)
  const path2 = generateHandDrawnRectPath(
    localX,
    localY,
    width,
    height,
    seed + 1000,
    4,
  );

  // Estimate path length from points (SVG-local coords)
  const basePoints = generateHandDrawnRectPoints(
    localX,
    localY,
    width,
    height,
    seed,
    5,
  );
  const pathLength = estimatePathLength(basePoints);

  // Ease-in stroke draw: starts slow, accelerates to finish
  const strokeDashoffset = interpolate(
    effectiveFrame,
    [0, durationFrames],
    [pathLength, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.42, 0, 1.0, 1.0), // CSS ease-in
    },
  );

  return (
    <svg
      style={{
        position: "absolute",
        left: x - 15,
        top: y - 15,
        width: width + 30,
        height: height + 30,
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
