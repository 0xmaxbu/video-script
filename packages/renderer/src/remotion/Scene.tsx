import React from "react";
import { AbsoluteFill } from "remotion";
import { SceneScript as SceneType, VisualLayer } from "../types.js";
import { Subtitle } from "./Subtitle.js";
import { VisualLayerRenderer } from "./components/VisualLayerRenderer.js";
import { CodeAnimation } from "./components/CodeAnimation.js";

interface SceneProps {
  scene: SceneType;
  imagePaths: Record<string, string> | undefined;
}

const getPositionStyle = (
  position: VisualLayer["position"],
): React.CSSProperties => {
  const style: React.CSSProperties = {
    position: "absolute",
  };

  if (typeof position.x === "number") {
    style.left = position.x;
  } else if (position.x === "left") {
    style.left = 0;
  } else if (position.x === "center") {
    style.left = "50%";
    style.transform = "translateX(-50%)";
  } else if (position.x === "right") {
    style.right = 0;
  }

  if (typeof position.y === "number") {
    style.top = position.y;
  } else if (position.y === "top") {
    style.top = 0;
  } else if (position.y === "center") {
    style.top = "50%";
    style.transform = "translateY(-50%)";
  } else if (position.y === "bottom") {
    style.bottom = 0;
  }

  if (position.width === "full") {
    style.width = "100%";
  } else if (position.width === "auto") {
    style.width = "auto";
  } else if (typeof position.width === "number") {
    style.width = position.width;
  }

  if (position.height === "full") {
    style.height = "100%";
  } else if (position.height === "auto") {
    style.height = "auto";
  } else if (typeof position.height === "number") {
    style.height = position.height;
  }

  if (position.zIndex !== undefined) {
    style.zIndex = position.zIndex;
  }

  return style;
};

export const Scene: React.FC<SceneProps> = ({ scene, imagePaths }) => {
  const { type, title, narration, visualLayers } = scene;

  const containerStyle: React.CSSProperties = {
    backgroundColor: "#1a1a1a",
    color: "white",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 80,
    fontWeight: "bold",
    marginBottom: 40,
    zIndex: 1,
    textAlign: "center",
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  };

  const codeLayer = visualLayers?.find((l) => l.type === "code");
  const codeContent = codeLayer?.content || "";

  if (type === "intro" || type === "outro") {
    return (
      <AbsoluteFill style={containerStyle}>
        <div style={contentStyle}>
          <h1 style={titleStyle}>{title}</h1>
          {visualLayers
            ?.filter((l) => l.type === "text")
            .map((layer) => (
              <div key={layer.id} style={getPositionStyle(layer.position)}>
                <VisualLayerRenderer layer={layer} />
              </div>
            ))}
        </div>
        <Subtitle text={narration} />
      </AbsoluteFill>
    );
  }

  if (type === "feature") {
    return (
      <AbsoluteFill style={containerStyle}>
        <div style={contentStyle}>
          <h1 style={{ ...titleStyle, fontSize: 60 }}>{title}</h1>
          {visualLayers?.map((layer) => {
            const imageKey = `${scene.id}-${layer.id}`;
            const imagePath = imagePaths?.[imageKey];
            return (
              <div key={layer.id} style={getPositionStyle(layer.position)}>
                <VisualLayerRenderer layer={layer} imagePath={imagePath} />
              </div>
            );
          })}
        </div>
        <Subtitle text={narration} />
      </AbsoluteFill>
    );
  }

  if (type === "code") {
    return (
      <AbsoluteFill
        style={{ ...containerStyle, backgroundColor: "#1e1e1e", padding: 0 }}
      >
        <div style={{ flex: 1, width: "100%" }}>
          <CodeAnimation
            code={codeContent}
            highlightLines={[]}
            title={title}
            showLineNumbers={true}
          />
        </div>
        {visualLayers
          ?.filter((l) => l.type !== "code")
          .map((layer) => (
            <div key={layer.id} style={getPositionStyle(layer.position)}>
              <VisualLayerRenderer layer={layer} />
            </div>
          ))}
        <Subtitle text={narration} />
      </AbsoluteFill>
    );
  }

  return null;
};
