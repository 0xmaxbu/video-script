import React from "react";
import { fitText } from "@remotion/layout-utils";
import { VisualLayer } from "../../types.js";
import {
  useEnterAnimation,
  useExitAnimation,
} from "../../utils/animation-utils.js";
import { TYPOGRAPHY } from "../layouts/grid-utils.js";

interface TextLayerProps {
  layer: VisualLayer;
}

export const TextLayer: React.FC<TextLayerProps> = ({ layer }) => {
  const { content, position, animation } = layer;

  const enter = useEnterAnimation(animation);
  const exit = useExitAnimation(animation);

  // Compute font size: use fitText when container width is known
  const containerWidth =
    typeof position.width === "number" ? position.width : null;
  const fontSize =
    containerWidth !== null
      ? Math.max(
          12,
          fitText({
            text: content,
            withinWidth: containerWidth,
            fontFamily: "system-ui, sans-serif",
            fontWeight: "400",
          }).fontSize,
        )
      : TYPOGRAPHY.body.primary; // fallback: 24px

  const opacity =
    exit.opacity !== undefined
      ? Math.min(enter.opacity, exit.opacity)
      : enter.opacity;
  const translateY = enter.translateY + exit.translateY;
  const scale =
    exit.scale !== undefined ? Math.min(enter.scale, exit.scale) : enter.scale;

  // Build transform: handle center-alignment offsets + animation
  const xOffset = position.x === "center" ? "-50%" : "0";
  const yOffset = position.y === "center" ? "-50%" : "0";
  const transform = `translate(${xOffset}, ${yOffset}) translateY(${translateY}px) scale(${scale})`;

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
    right: position.x === "right" ? 0 : undefined,
    top:
      typeof position.y === "number"
        ? position.y
        : position.y === "top"
          ? 0
          : position.y === "center"
            ? "50%"
            : "auto",
    bottom: position.y === "bottom" ? 0 : undefined,
    width:
      position.width === "full"
        ? "100%"
        : position.width === "auto"
          ? "auto"
          : typeof position.width === "number"
            ? position.width
            : undefined,
    height:
      position.height === "full"
        ? "100%"
        : position.height === "auto"
          ? "auto"
          : typeof position.height === "number"
            ? position.height
            : undefined,
    zIndex: position.zIndex,
    transform,
    transformOrigin: "center center",
    opacity,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={style}>
      <span
        style={{
          color: "white",
          fontSize,
          fontWeight: "bold",
          textAlign: "center",
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}
      >
        {content}
      </span>
    </div>
  );
};
