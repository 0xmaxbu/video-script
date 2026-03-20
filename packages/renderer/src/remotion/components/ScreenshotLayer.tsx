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
  imagePath: string | undefined;
}

export const ScreenshotLayer: React.FC<ScreenshotLayerProps> = ({
  layer,
  imagePath,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { content, position, animation } = layer;

  const enterFrame = Math.max(0, frame - animation.enterDelay * fps);
  const enterDuration = 15;

  let opacity = interpolate(
    enterFrame,
    [0, enterDuration],
    animation.enter === "fadeIn" ? [0, 1] : [1, 1],
    { extrapolateRight: "clamp" },
  );

  let translateX = interpolate(
    enterFrame,
    [0, enterDuration],
    animation.enter === "slideLeft"
      ? [100, 0]
      : animation.enter === "slideRight"
        ? [-100, 0]
        : [0, 0],
    { extrapolateRight: "clamp" },
  );

  let translateY = interpolate(
    enterFrame,
    [0, enterDuration],
    animation.enter === "slideUp"
      ? [50, 0]
      : animation.enter === "slideDown"
        ? [-50, 0]
        : [0, 0],
    { extrapolateRight: "clamp" },
  );

  let scale = interpolate(
    enterFrame,
    [0, enterDuration],
    animation.enter === "zoomIn" ? [0.8, 1] : [1, 1],
    { extrapolateRight: "clamp" },
  );

  if (animation.exitAt !== undefined && animation.exit !== "none") {
    const exitStartFrame = animation.exitAt * fps;
    const exitDuration = 15;

    if (frame >= exitStartFrame) {
      const exitFrame = frame - exitStartFrame;

      const exitOpacity = interpolate(
        exitFrame,
        [0, exitDuration],
        animation.exit === "fadeOut" || animation.exit === "zoomOut"
          ? [1, 0]
          : animation.exit === "slideOut"
            ? [1, 0]
            : [1, 1],
        { extrapolateRight: "clamp" },
      );
      opacity = Math.min(opacity, exitOpacity);

      const exitTranslateX = interpolate(
        exitFrame,
        [0, exitDuration],
        animation.exit === "slideOut" ? [0, 100] : [0, 0],
        { extrapolateRight: "clamp" },
      );
      translateX += exitTranslateX;

      const exitTranslateY = interpolate(
        exitFrame,
        [0, exitDuration],
        animation.exit === "slideOut" ? [0, 50] : [0, 0],
        { extrapolateRight: "clamp" },
      );
      translateY += exitTranslateY;

      const exitScale = interpolate(
        exitFrame,
        [0, exitDuration],
        animation.exit === "zoomOut" ? [1, 0.8] : [1, 1],
        { extrapolateRight: "clamp" },
      );
      scale = Math.min(scale, exitScale);
    }
  }

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

  const imageSrc = imagePath || content;

  return (
    <AbsoluteFill style={style}>
      <Img
        src={imageSrc}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </AbsoluteFill>
  );
};
