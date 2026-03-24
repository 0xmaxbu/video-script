import React from "react";
import { AbsoluteFill } from "remotion";
import { VisualLayer } from "../../types.js";
import {
  useEnterAnimation,
  useExitAnimation,
} from "../../utils/animation-utils.js";
import { CodeAnimation } from "./CodeAnimation.js";

interface CodeLayerProps {
  layer: VisualLayer;
}

export const CodeLayer: React.FC<CodeLayerProps> = ({ layer }) => {
  const { content, position, animation } = layer;

  const enter = useEnterAnimation(animation);
  const exit = useExitAnimation(animation);

  const opacity =
    exit.opacity !== undefined
      ? Math.min(enter.opacity, exit.opacity)
      : enter.opacity;
  const translateY = enter.translateY + exit.translateY;
  const scale =
    exit.scale !== undefined ? Math.min(enter.scale, exit.scale) : enter.scale;

  const style: React.CSSProperties = {
    position: "absolute",
    left:
      typeof position.x === "number"
        ? position.x
        : position.x === "left"
          ? 0
          : position.x === "center"
            ? "50%"
            : "auto",
    top:
      typeof position.y === "number"
        ? position.y
        : position.y === "top"
          ? 0
          : position.y === "center"
            ? "50%"
            : "auto",
    width:
      position.width === "full"
        ? "100%"
        : position.width === "auto"
          ? "auto"
          : position.width,
    height:
      position.height === "full"
        ? "100%"
        : position.height === "auto"
          ? "auto"
          : position.height,
    zIndex: position.zIndex,
    transform: `translateY(${translateY}px) scale(${scale})`,
    transformOrigin: "center center",
    opacity,
    overflow: "hidden",
  };

  return (
    <AbsoluteFill style={style}>
      <CodeAnimation
        code={content}
        showLineNumbers={true}
        typewriterSpeed={2}
      />
    </AbsoluteFill>
  );
};
