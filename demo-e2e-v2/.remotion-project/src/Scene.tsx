import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { Subtitle } from "./Subtitle";

interface VisualLayer {
  id: string;
  type: "screenshot" | "code" | "text" | "diagram" | "image";
  position: {
    x: number | "left" | "center" | "right";
    y: number | "top" | "center" | "bottom";
    width: number | "auto" | "full";
    height: number | "auto" | "full";
    zIndex: number;
  };
  content: string;
  animation: {
    enter: "fadeIn" | "slideLeft" | "slideRight" | "slideUp" | "slideDown" | "zoomIn" | "typewriter" | "none";
    enterDelay: number;
    exit: "fadeOut" | "slideOut" | "zoomOut" | "none";
    exitAt?: number;
  };
}

interface SceneData {
  id: string;
  type: "intro" | "feature" | "code" | "outro";
  title: string;
  narration: string;
  duration: number;
  visualLayers?: VisualLayer[];
}

interface SceneProps {
  scene: SceneData;
  imagePaths?: Record<string, string>;
}

const getPositionStyle = (pos: VisualLayer["position"]) => {
  const style: React.CSSProperties = {
    position: "absolute" as const,
    zIndex: pos.zIndex || 0,
  };

  if (typeof pos.x === "number") style.left = pos.x;
  else if (pos.x === "center") style.left = "50%";
  else if (pos.x === "left") style.left = 0;
  else if (pos.x === "right") style.right = 0;

  if (typeof pos.y === "number") style.top = pos.y;
  else if (pos.y === "center") style.top = "50%";
  else if (pos.y === "top") style.top = 0;
  else if (pos.y === "bottom") style.bottom = 0;

  if (typeof pos.width === "number") style.width = pos.width;
  else if (pos.width === "full") style.width = "100%";
  else if (pos.width === "auto") style.width = "auto";

  if (typeof pos.height === "number") style.height = pos.height;
  else if (pos.height === "full") style.height = "100%";
  else if (pos.height === "auto") style.height = "auto";

  return style;
};

const AnimatedLayer: React.FC<{ layer: VisualLayer; imagePath?: string }> = ({ layer, imagePath }) => {
  const frame = useCurrentFrame();
  const { animation, position, type, content } = layer;

  const enterFrame = animation.enterDelay * 30;
  const enterDuration = 15;
  const progress = interpolate(Math.max(0, frame - enterFrame), [0, enterDuration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const style = getPositionStyle(position);

  if (type === "screenshot" && imagePath) {
    return (
      <div style={{ ...style, opacity: progress }}>
        <Img
          src={imagePath}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }

  if (type === "text") {
    return (
      <div style={{ ...style, opacity: progress }}>
        <span style={{
          fontSize: type === "text" ? 40 : 24,
          fontWeight: "bold",
          color: type === "text" ? "#333" : "#fff",
        }}>
          {content}
        </span>
      </div>
    );
  }

  if (type === "code") {
    return (
      <div style={{ ...style, opacity: progress }}>
        <pre style={{
          backgroundColor: "#1e1e1e",
          color: "#d4d4d4",
          padding: 20,
          borderRadius: 8,
          fontSize: 16,
          fontFamily: "monospace",
          overflow: "hidden",
          width: "100%",
          height: "100%",
        }}>
          {content}
        </pre>
      </div>
    );
  }

  return null;
};

export const Scene: React.FC<SceneProps> = ({ scene, imagePaths }) => {
  const { type, title, narration, visualLayers } = scene;

  const containerStyle: React.CSSProperties = {
    backgroundColor: type === "intro" || type === "outro" ? "#1a1a1a" : "white",
    color: type === "intro" || type === "outro" ? "white" : "black",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    textAlign: "center",
    width: "100%",
    height: "100%",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 80,
    fontWeight: "bold",
    marginBottom: 40,
    zIndex: 100,
  };

  if (type === "intro" || type === "outro") {
    return (
      <AbsoluteFill style={containerStyle}>
        <h1 style={titleStyle}>{title}</h1>
        <Subtitle text={narration} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={containerStyle}>
      {visualLayers?.map((layer) => {
        const imageKey = `${scene.id}-${layer.id}`;
        const imagePath = imagePaths?.[imageKey];
        return (
          <AnimatedLayer
            key={layer.id}
            layer={layer}
            imagePath={imagePath}
          />
        );
      })}
      <h1 style={{ ...titleStyle, fontSize: 60 }}>{title}</h1>
      <Subtitle text={narration} />
    </AbsoluteFill>
  );
};
