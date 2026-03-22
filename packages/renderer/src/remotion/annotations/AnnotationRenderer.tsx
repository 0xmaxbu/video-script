import React from "react";
import { Circle } from "./Circle.js";
import { Underline } from "./Underline.js";
import { Arrow } from "./Arrow.js";
import { Box } from "./Box.js";
import { Highlight } from "./Highlight.js";
import { Number } from "./Number.js";
import type { Annotation } from "@video-script/types";

export interface AnnotationRendererProps {
  annotations: Annotation[];
}

/**
 * 标注渲染器
 *
 * 负责渲染所有类型的标注，按 appearAt 时间排序以保证正确的 z-order
 */
export const AnnotationRenderer: React.FC<AnnotationRendererProps> = ({
  annotations,
}) => {
  // 按 appearAt 排序，确保标注按时间顺序出现
  const sortedAnnotations = [...annotations].sort(
    (a, b) => a.narrationBinding.appearAt - b.narrationBinding.appearAt
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
      {sortedAnnotations.map((annotation) => {
        const { type, target, style, narrationBinding } = annotation;
        const { appearAt } = narrationBinding;
        const color = style.color;
        const strokeWidth = sizeToStrokeWidth(style.size);

        switch (type) {
          case "circle":
            return (
              <Circle
                key={`${type}-${target.x}-${target.y}-${appearAt}`}
                x={target.x ?? 0}
                y={target.y ?? 0}
                radius={50}
                color={color}
                strokeWidth={strokeWidth}
                appearAt={appearAt}
              />
            );

          case "underline":
            return (
              <Underline
                key={`${type}-${target.x}-${target.y}-${appearAt}`}
                x={target.x ?? 0}
                y={target.y ?? 0}
                width={100}
                color={color}
                strokeWidth={strokeWidth}
                appearAt={appearAt}
              />
            );

          case "arrow":
            return (
              <Arrow
                key={`${type}-${target.x}-${target.y}-${appearAt}`}
                x1={target.x ?? 0}
                y1={target.y ?? 0}
                x2={(target.x ?? 0) + 100}
                y2={(target.y ?? 0) + 50}
                color={color}
                strokeWidth={strokeWidth}
                appearAt={appearAt}
              />
            );

          case "box":
            return (
              <Box
                key={`${type}-${target.x}-${target.y}-${appearAt}`}
                x={target.x ?? 0}
                y={target.y ?? 0}
                width={100}
                height={60}
                color={color}
                strokeWidth={strokeWidth}
                appearAt={appearAt}
              />
            );

          case "highlight":
            return (
              <Highlight
                key={`${type}-${target.x}-${target.y}-${appearAt}`}
                x={target.x ?? 0}
                y={target.y ?? 0}
                width={100}
                height={20}
                color={color}
                appearAt={appearAt}
              />
            );

          case "number":
            return (
              <Number
                key={`${type}-${target.x}-${target.y}-${appearAt}`}
                x={target.x ?? 0}
                y={target.y ?? 0}
                n={1}
                color={color}
                appearAt={appearAt}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
};
