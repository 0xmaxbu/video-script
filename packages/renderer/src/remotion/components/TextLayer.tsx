import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { VisualLayer } from "../../types.js";

interface TextLayerProps {
  layer: VisualLayer;
}

export const TextLayer: React.FC<TextLayerProps> = ({ layer }) => {
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
      ? [20, 0]
      : animation.enter === "slideDown"
        ? [-20, 0]
        : [0, 0],
    { extrapolateRight: "clamp" },
  );

  const scale = interpolate(
    enterFrame,
    [0, 15],
    animation.enter === "zoomIn" ? [0.95, 1] : [1, 1],
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
    transform: `translateY(${translateY}px) scale(${scale})`,
    transformOrigin: "center center",
    opacity,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <AbsoluteFill style={style}>
      <span
        style={{
          color: "white",
          fontSize: 32,
          fontWeight: "bold",
          textAlign: "center",
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}
      >
        {content}
      </span>
    </AbsoluteFill>
  );
};
