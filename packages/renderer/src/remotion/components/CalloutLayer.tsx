import React from "react";
import {
  VisualLayer,
  CalloutContentSchema,
  CalloutContent,
} from "../../types.js";
import { THEME } from "../theme.js";
import {
  useEnterAnimation,
  useExitAnimation,
} from "../../utils/animation-utils.js";

interface CalloutLayerProps {
  layer: VisualLayer;
}

const ARROW_SIZE = 16;

const arrowStyle = (
  direction: CalloutContent["arrowDirection"],
): React.CSSProperties => {
  const base: React.CSSProperties = {
    width: 0,
    height: 0,
    position: "absolute",
  };
  switch (direction) {
    case "left":
      return {
        ...base,
        right: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        borderTop: `${ARROW_SIZE / 2}px solid transparent`,
        borderBottom: `${ARROW_SIZE / 2}px solid transparent`,
        borderRight: `${ARROW_SIZE}px solid ${THEME.accent.yellow}`,
      };
    case "right":
      return {
        ...base,
        left: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        borderTop: `${ARROW_SIZE / 2}px solid transparent`,
        borderBottom: `${ARROW_SIZE / 2}px solid transparent`,
        borderLeft: `${ARROW_SIZE}px solid ${THEME.accent.yellow}`,
      };
    case "up":
      return {
        ...base,
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
        borderRight: `${ARROW_SIZE / 2}px solid transparent`,
        borderBottom: `${ARROW_SIZE}px solid ${THEME.accent.yellow}`,
      };
    case "down":
      return {
        ...base,
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
        borderRight: `${ARROW_SIZE / 2}px solid transparent`,
        borderTop: `${ARROW_SIZE}px solid ${THEME.accent.yellow}`,
      };
    default:
      return {};
  }
};

export const CalloutLayer: React.FC<CalloutLayerProps> = ({ layer }) => {
  const { content, position, animation } = layer;

  // Parse callout content — fail gracefully
  let parsed: CalloutContent;
  try {
    parsed = CalloutContentSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }

  const enter = useEnterAnimation(animation);
  const exit = useExitAnimation(animation);

  const opacity =
    exit.opacity !== undefined
      ? Math.min(enter.opacity, exit.opacity)
      : enter.opacity;
  const translateY = enter.translateY + exit.translateY;
  const scale =
    exit.scale !== undefined ? Math.min(enter.scale, exit.scale) : enter.scale;

  const xOffset = position.x === "center" ? "-50%" : "0";
  const yOffset = position.y === "center" ? "-50%" : "0";
  const transform = `translate(${xOffset}, ${yOffset}) translateY(${translateY}px) scale(${scale})`;

  const bgColor =
    parsed.style === "highlight" ? THEME.accent.yellowMuted : THEME.bg.card;

  const containerStyle: React.CSSProperties = {
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
    opacity,
    transform,
    transformOrigin: "center center",
    backgroundColor: bgColor,
    border: `2px solid ${THEME.accent.yellow}`,
    borderRadius: 12,
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: THEME.text.primary,
    fontSize: 24,
    fontWeight: 700,
    fontFamily: "system-ui, sans-serif",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      {parsed.text}
      {(parsed.style === "arrow-label" || parsed.style === "box") &&
        parsed.arrowDirection && (
          <div style={arrowStyle(parsed.arrowDirection)} />
        )}
    </div>
  );
};
