import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { SceneScript as SceneType } from "../types";
import { Subtitle } from "./Subtitle";
import { CodeAnimation } from "./components/CodeAnimation";

interface SceneProps {
  scene: SceneType;
  imagePaths?: Record<string, string> | undefined;
}

export const Scene: React.FC<SceneProps> = ({ scene, imagePaths }) => {
  const { type, title, narration, visualLayers } = scene;

  const containerStyle: React.CSSProperties = {
    backgroundColor: "white",
    color: "black",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    textAlign: "center",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 80,
    fontWeight: "bold",
    marginBottom: 40,
    zIndex: 1,
  };

  const codeLayer = visualLayers?.find((l) => l.type === "code");
  const screenshotLayer = visualLayers?.find((l) => l.type === "screenshot");
  const screenshotKey = screenshotLayer ? `${scene.id}-${screenshotLayer.id}` : undefined;
  const screenshotPath = screenshotKey ? imagePaths?.[screenshotKey] : undefined;

  if (type === "intro" || type === "outro") {
    return (
      <AbsoluteFill
        style={{
          ...containerStyle,
          backgroundColor: "#1a1a1a",
          color: "white",
        }}
      >
        <h1 style={titleStyle}>{title}</h1>
        <Subtitle text={narration} />
      </AbsoluteFill>
    );
  }

  if (type === "feature") {
    return (
      <AbsoluteFill style={containerStyle}>
        <h1 style={{ ...titleStyle, fontSize: 60 }}>{title}</h1>
        {screenshotPath && (
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              padding: 20,
            }}
          >
            <Img
              src={screenshotPath}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                boxShadow: "0 0 20px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        )}
        <Subtitle text={narration} />
      </AbsoluteFill>
    );
  }

  if (type === "code") {
    return (
      <AbsoluteFill
        style={{
          ...containerStyle,
          backgroundColor: "#1e1e1e",
          padding: 0,
        }}
      >
        <div style={{ flex: 1, width: "100%" }}>
          <CodeAnimation
            code={codeLayer?.content || ""}
            highlightLines={[]}
            title={title}
            showLineNumbers={true}
          />
        </div>
        <Subtitle text={narration} />
      </AbsoluteFill>
    );
  }

  return null;
};
