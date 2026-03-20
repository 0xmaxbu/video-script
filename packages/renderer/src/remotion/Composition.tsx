import React from "react";
import { useVideoConfig, AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fade = require("@remotion/transitions/dist/esm/fade.mjs").fade;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const slide = require("@remotion/transitions/dist/esm/slide.mjs").slide;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const wipe = require("@remotion/transitions/dist/esm/wipe.mjs").wipe;
import { ScriptOutput } from "../types.js";
import { Scene } from "./Scene.js";

export interface VideoCompositionProps {
  script: ScriptOutput;
  images?: Record<string, string>;
}

const getTransitionPresentation = (type: string) => {
  switch (type) {
    case "fade":
      return fade();
    case "slide":
      return slide({ direction: "from-left" });
    case "wipe":
      return wipe();
    default:
      return undefined;
  }
};

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  script,
  images,
}) => {
  const { fps } = useVideoConfig();

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
      <TransitionSeries>
        {script.scenes.map((scene, index) => {
          const durationInFrames = Math.ceil(scene.duration * fps);
          const transition = scene.transition;
          const nextScene = script.scenes[index + 1];

          return (
            <React.Fragment key={scene.id}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                <Scene scene={scene} imagePaths={images} />
              </TransitionSeries.Sequence>
              {nextScene && transition && transition.type !== "none" && (
                <TransitionSeries.Transition
                  timing={linearTiming({
                    durationInFrames: Math.ceil(transition.duration * fps),
                  })}
                  presentation={getTransitionPresentation(transition.type)}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
