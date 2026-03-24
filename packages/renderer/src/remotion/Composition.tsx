import React from "react";
import { useVideoConfig, AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { iris } from "@remotion/transitions/iris";
import { ScriptOutput, SceneNarrativeType } from "../types.js";
import { Scene } from "./Scene.js";

const BlurTransition: React.FC<{
  presentationProgress: number;
  children: React.ReactNode;
}> = ({ presentationProgress, children }) => {
  const blurAmount = Math.round((1 - presentationProgress) * 25);
  return (
    <AbsoluteFill style={{ filter: `blur(${blurAmount}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

const blurPresentation: TransitionPresentation<{}> = {
  component: BlurTransition,
  props: {},
};

const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;

export interface VideoCompositionProps {
  script: ScriptOutput;
  images?: Record<string, string>;
}

const getTransitionDuration = (sceneType: SceneNarrativeType): number => {
  switch (sceneType) {
    case "intro":
    case "outro":
      return 45;
    case "feature":
    case "code":
    default:
      return 30;
  }
};

const getTransitionPresentation = (type: string, sceneIndex: number) => {
  switch (type) {
    case "fade":
      return fade();
    case "slide":
      return slide({
        direction: sceneIndex % 2 === 1 ? "from-left" : "from-right",
      });
    case "wipe":
      return wipe();
    case "flip":
      return flip();
    case "clockWipe":
      return clockWipe({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
    case "iris":
      return iris({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
    case "blur":
      return blurPresentation;
    default:
      return fade();
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
          const isLast = index === script.scenes.length - 1;

          return (
            <React.Fragment key={scene.id}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                <Scene scene={scene} imagePaths={images} />
              </TransitionSeries.Sequence>
              {!isLast && transition && transition.type !== "none" && (
                <TransitionSeries.Transition
                  timing={linearTiming({
                    durationInFrames: getTransitionDuration(scene.type),
                  })}
                  presentation={
                    getTransitionPresentation(
                      transition.type,
                      index,
                    ) as TransitionPresentation<{}>
                  }
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
