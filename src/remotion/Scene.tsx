import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { Scene as SceneType } from "../types";
import { Subtitle } from "./Subtitle";
import { CodeAnimation } from "./components/CodeAnimation";

interface SceneProps {
  scene: SceneType;
  imagePath: string | undefined;
}

export const Scene: React.FC<SceneProps> = ({ scene, imagePath }) => {
  const { type, title, narration, code } = scene;

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
        {imagePath && (
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
              src={imagePath}
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
            code={code?.code || ""}
            highlightLines={code?.highlightLines || []}
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
