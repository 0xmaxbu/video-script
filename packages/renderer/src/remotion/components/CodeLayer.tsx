import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { VisualLayer } from "../../types.js";
import { CodeAnimation } from "./CodeAnimation.js";

interface CodeLayerProps {
  layer: VisualLayer;
}

export const CodeLayer: React.FC<CodeLayerProps> = ({ layer }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { content, position, animation } = layer;

  const enterFrame = frame - animation.enterDelay * fps;

  const opacity = interpolate(
    enterFrame,
    [0, 15],
    animation.enter === "fadeIn" ? [0, 1] : [1, 1],
    { extrapolateRight: "clamp" },
  );

  const translateY = interpolate(
    enterFrame,
    [0, 15],
    animation.enter === "slideUp"
      ? [30, 0]
      : animation.enter === "slideDown"
        ? [-30, 0]
        : [0, 0],
    { extrapolateRight: "clamp" },
  );

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
    transform: `translateY(${translateY}px)`,
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
