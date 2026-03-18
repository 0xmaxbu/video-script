import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { VisualLayer } from "../../types.js";

interface ScreenshotLayerProps {
  layer: VisualLayer;
}

export const ScreenshotLayer: React.FC<ScreenshotLayerProps> = ({ layer }) => {
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

  const translateX = interpolate(
    enterFrame,
    [0, 15],
    animation.enter === "slideLeft"
      ? [50, 0]
      : animation.enter === "slideRight"
        ? [-50, 0]
        : [0, 0],
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

  const scale = interpolate(
    enterFrame,
    [0, 15],
    animation.enter === "zoomIn" ? [0.9, 1] : [1, 1],
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
    transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
    transformOrigin: "center center",
    opacity,
  };

  return (
    <AbsoluteFill style={style}>
      <Img
        src={content}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </AbsoluteFill>
  );
};
