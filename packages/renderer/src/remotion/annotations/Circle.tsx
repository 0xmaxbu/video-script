import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import {
  getAnnotationColor,
  generateHandDrawnEllipsePath,
  generateHandDrawnCirclePoints,
  estimatePathLength,
} from "./index.js";
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
 * One-stroke animation via stroke-dashoffset with ease-in timing.
 *
 * COORDINATE SYSTEM: The SVG element is positioned at screen (x-radius-20, y-radius-20).
 * All path coordinates must be LOCAL to the SVG (i.e., subtract the SVG element offset).
 * Circle center in SVG-local coords: (radius+20, radius+20).
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

  // Animation: ease-in over fixed duration (slow start → fast end)
  const durationFrames = 25; // ~0.83s at 30fps
  const effectiveFrame = Math.max(0, frame - appearAt);

  // SVG-local center: the SVG element is at (x - radius - 20, y - radius - 20)
  // so the ellipse center in SVG coordinates is (radius + 20, radius + 20)
  const localCx = radius + 20;
  const localCy = radius + 20;

  // Primary stroke: tilted ellipse centered at SVG-local origin
  const path = generateHandDrawnEllipsePath(
    localCx,
    localCy,
    radius,
    seed,
    0.12,
  );
  // Second sketchy pass: slightly different ellipse parameters
  const path2 = generateHandDrawnEllipsePath(
    localCx,
    localCy,
    radius,
    seed + 1000,
    0.1,
  );

  // Use estimated path length from points for dasharray
  const basePoints = generateHandDrawnCirclePoints(
    localCx,
    localCy,
    radius,
    seed,
    0.12,
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
