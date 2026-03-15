import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { Scene as SceneType } from "../types";
import { Subtitle } from "./Subtitle";

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
          backgroundColor: "#282c34",
          color: "#abb2bf",
          alignItems: "flex-start",
          textAlign: "left",
        }}
      >
        <h1
          style={{
            ...titleStyle,
            color: "white",
            fontSize: 50,
            width: "100%",
            textAlign: "center",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            flex: 1,
            width: "100%",
            padding: 40,
            overflow: "hidden",
            fontSize: 24,
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
          }}
        >
          {code?.code}
        </div>
        <Subtitle text={narration} />
      </AbsoluteFill>
    );
  }

  return null;
};
