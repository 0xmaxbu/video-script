import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import {
  getAnnotationColor,
  generateHandDrawnWavePath,
  generateHandDrawnWavePoints,
  estimatePathLength,
} from "./index.js";
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
 * One-stroke animation via stroke-dashoffset with ease-in timing.
 *
 * COORDINATE SYSTEM: The SVG element is positioned at screen (x-15, y-15).
 * All path coordinates must be LOCAL to the SVG (offset by 15 from SVG origin).
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

  // Animation: ease-in over fixed duration
  const durationFrames = 20; // ~0.67s at 30fps
  const effectiveFrame = Math.max(0, frame - appearAt);

  // SVG-local coordinates: SVG is at (x-15, y-15), so local origin is (15, 15)
  const localX = 15;
  const localY = 15;

  // Primary stroke: smooth wave path (SVG-local coords)
  const path = generateHandDrawnWavePath(localX, localY, width, seed, 4, 25);
  // Second sketchy pass: different seed
  const path2 = generateHandDrawnWavePath(
    localX,
    localY,
    width,
    seed + 1000,
    3,
    28,
  );

  // Estimate path length from coarse wave points (SVG-local coords)
  const basePoints = generateHandDrawnWavePoints(
    localX,
    localY,
    width,
    seed,
    4,
    25,
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
