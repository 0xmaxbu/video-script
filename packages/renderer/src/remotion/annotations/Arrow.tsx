import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
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
 * One-stroke animation via stroke-dashoffset with ease-in timing.
 *
 * COORDINATE SYSTEM: The SVG element is positioned at screen (minX-15, minY-15).
 * All path coordinates must be LOCAL to the SVG (subtract SVG element offset).
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

  // Animation: ease-in over fixed duration
  const durationFrames = 20; // ~0.67s at 30fps
  const effectiveFrame = Math.max(0, frame - appearAt);

  const arrowSize = 12;
  const minX = Math.min(x1, x2 - arrowSize);
  const maxX = Math.max(x1, x2 + arrowSize);
  const minY = Math.min(y1, y2 - arrowSize);
  const maxY = Math.max(y1, y2 + arrowSize);

  // SVG-local coordinates: SVG is at (minX-15, minY-15)
  // so local offsets are: local = screen - SVG_origin = screen - (minX-15) = screen - minX + 15
  const localX1 = x1 - minX + 15;
  const localY1 = y1 - minY + 15;
  const localX2 = x2 - minX + 15;
  const localY2 = y2 - minY + 15;

  // Generate smooth arrow paths using SVG-local coordinates
  const { bodyPath, headPath, bodyLength } = generateHandDrawnArrowPaths(
    localX1,
    localY1,
    localX2,
    localY2,
    seed,
    6,
    12,
  );
  // Second sketchy pass
  const pass2 = generateHandDrawnArrowPaths(
    localX1,
    localY1,
    localX2,
    localY2,
    seed + 1000,
    4,
    10,
  );

  // Ease-in stroke draw: starts slow, accelerates to finish
  const strokeDashoffset = interpolate(
    effectiveFrame,
    [0, durationFrames],
    [bodyLength, 0],
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
