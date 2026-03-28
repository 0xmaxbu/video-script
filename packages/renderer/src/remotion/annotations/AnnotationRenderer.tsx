import React from "react";
import { useVideoConfig } from "remotion";
import { Circle } from "./Circle.js";
import { Underline } from "./Underline.js";
import { Arrow } from "./Arrow.js";
import { Box } from "./Box.js";
import { Highlight } from "./Highlight.js";
import { Number } from "./Number.js";
import type { Annotation, AnnotationTarget } from "../../types.js";

export interface AnnotationRendererProps {
  annotations: Annotation[];
}

// Video frame dimensions
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const FPS = 30;

/**
 * Map region name to approximate pixel coordinates (center of region).
 * Regions divide the 1920x1080 frame into a 3x3 grid.
 */
function regionToPixelPosition(
  region: string,
): { x: number; y: number } {
  const cellW = VIDEO_WIDTH / 3;
  const cellH = VIDEO_HEIGHT / 3;
  const regionMap: Record<string, { x: number; y: number }> = {
    "top-left": { x: cellW * 0.5, y: cellH * 0.5 },
    "top-right": { x: cellW * 2.5, y: cellH * 0.5 },
    center: { x: cellW * 1.5, y: cellH * 1.5 },
    "bottom-left": { x: cellW * 0.5, y: cellH * 2.5 },
    "bottom-right": { x: cellW * 2.5, y: cellH * 2.5 },
  };
  return regionMap[region] ?? { x: VIDEO_WIDTH / 2, y: VIDEO_HEIGHT / 2 };
}

/**
 * Resolve annotation target to pixel (x, y) coordinates.
 *
 * Priority:
 * 1. Explicit x/y pixel coordinates on the target (if provided)
 * 2. Region-based mapping (target.type === "region")
 * 3. Distributed layout for text targets (spread across screen to avoid overlap)
 *
 * For text targets without coordinates, annotations are distributed across
 * screen regions based on their index to avoid all clustering at (0,0).
 */
function resolveTargetPosition(
  target: AnnotationTarget,
  annotationIndex: number,
  totalAnnotations: number,
): { x: number; y: number } {
  // 1. Explicit pixel coordinates take priority
  if (target.x !== undefined && target.y !== undefined) {
    return { x: target.x, y: target.y };
  }

  // 2. Region-based positioning
  if (target.type === "region" && target.region) {
    return regionToPixelPosition(target.region);
  }

  // 3. For text/code-line targets without coordinates, distribute across the
  //    viewport to avoid overlap. Place annotations in a grid pattern.
  const margin = 150;
  const usableW = VIDEO_WIDTH - margin * 2;
  const usableH = VIDEO_HEIGHT - margin * 2;

  if (totalAnnotations <= 1) {
    // Single annotation: center of screen
    return { x: VIDEO_WIDTH / 2, y: VIDEO_HEIGHT / 2 };
  }

  // Distribute across a horizontal line with some vertical offset
  const col = annotationIndex % 3;
  const row = Math.floor(annotationIndex / 3);
  const xStep = usableW / Math.min(totalAnnotations, 3);
  const x = margin + xStep * (col + 0.5);
  const y = margin + (usableH / 3) * (row + 1);

  return { x: Math.min(x, VIDEO_WIDTH - margin), y: Math.min(y, VIDEO_HEIGHT - margin) };
}

/**
 * Annotation renderer
 *
 * Renders all annotation types, sorted by appearAt time for correct z-order.
 * Resolves target coordinates from region/text targets and converts appearAt
 * from seconds to frames.
 */
export const AnnotationRenderer: React.FC<AnnotationRendererProps> = ({
  annotations,
}) => {
  const { fps } = useVideoConfig();
  const effectiveFps = fps || FPS;

  // Sort by appearAt to ensure annotations appear in time order
  const sortedAnnotations = [...annotations].sort(
    (a, b) => a.narrationBinding.appearAt - b.narrationBinding.appearAt,
  );

  const sizeToStrokeWidth = (size: "small" | "medium" | "large"): number => {
    switch (size) {
      case "small":
        return 2;
      case "medium":
        return 3;
      case "large":
        return 4;
      default:
        return 3;
    }
  };

  return (
    <>
      {sortedAnnotations.map((annotation, index) => {
        const { type, target, style, narrationBinding } = annotation;
        // Convert appearAt from seconds to frames
        const appearAtFrames = Math.round(narrationBinding.appearAt * effectiveFps);
        const color = style.color;
        const strokeWidth = sizeToStrokeWidth(style.size);
        const pos = resolveTargetPosition(target, index, sortedAnnotations.length);

        switch (type) {
          case "circle":
            return (
              <Circle
                key={`${type}-${pos.x}-${pos.y}-${appearAtFrames}`}
                x={pos.x}
                y={pos.y}
                radius={50}
                color={color}
                strokeWidth={strokeWidth}
                appearAt={appearAtFrames}
              />
            );

          case "underline":
            return (
              <Underline
                key={`${type}-${pos.x}-${pos.y}-${appearAtFrames}`}
                x={pos.x}
                y={pos.y}
                width={100}
                color={color}
                strokeWidth={strokeWidth}
                appearAt={appearAtFrames}
              />
            );

          case "arrow":
            return (
              <Arrow
                key={`${type}-${pos.x}-${pos.y}-${appearAtFrames}`}
                x1={pos.x}
                y1={pos.y}
                x2={pos.x + 100}
                y2={pos.y + 50}
                color={color}
                strokeWidth={strokeWidth}
                appearAt={appearAtFrames}
              />
            );

          case "box":
            return (
              <Box
                key={`${type}-${pos.x}-${pos.y}-${appearAtFrames}`}
                x={pos.x}
                y={pos.y}
                width={100}
                height={60}
                color={color}
                strokeWidth={strokeWidth}
                appearAt={appearAtFrames}
              />
            );

          case "highlight":
            return (
              <Highlight
                key={`${type}-${pos.x}-${pos.y}-${appearAtFrames}`}
                x={pos.x}
                y={pos.y}
                width={150}
                height={30}
                color={color}
                appearAt={appearAtFrames}
              />
            );

          case "number":
            return (
              <Number
                key={`${type}-${pos.x}-${pos.y}-${appearAtFrames}`}
                x={pos.x}
                y={pos.y}
                n={index + 1}
                color={color}
                appearAt={appearAtFrames}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
};
