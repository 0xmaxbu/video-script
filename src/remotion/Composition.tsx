import React from "react";
import { Sequence, useVideoConfig, AbsoluteFill } from "remotion";
import { ScriptOutput } from "../types";
import { Scene } from "./Scene";

export interface VideoCompositionProps {
  script: ScriptOutput;
  images?: Record<string, string>;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  script,
  images,
}) => {
  const { fps } = useVideoConfig();
  let currentFrame = 0;

  if (!script || !script.scenes) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "red",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: 50,
        }}
      >
        No Script Data
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {script.scenes.map((scene) => {
        const durationInFrames = Math.ceil(scene.duration * fps);
        const from = currentFrame;
        currentFrame += durationInFrames;

        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={durationInFrames}
          >
            <Scene scene={scene} imagePaths={images} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
