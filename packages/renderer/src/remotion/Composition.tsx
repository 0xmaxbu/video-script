import React from "react";
import { useVideoConfig, AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fade = require("@remotion/transitions/dist/esm/fade.mjs").fade;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const slide = require("@remotion/transitions/dist/esm/slide.mjs").slide;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const wipe = require("@remotion/transitions/dist/esm/wipe.mjs").wipe;
import { ScriptOutput, SceneNarrativeType } from "../types.js";
import { Scene } from "./Scene.js";

export interface VideoCompositionProps {
  script: ScriptOutput;
  images?: Record<string, string>;
}

/**
 * Get transition duration in frames based on scene type.
 * - intro/outro: 45 frames (~1.5s at 30fps) - more dramatic for open/close
 * - feature/code: 30 frames (~1s at 30fps) - snappier for content
 */
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

/**
 * Get transition presentation based on type and scene index.
 * - fade: standard cross-fade
 * - slide: alternates direction based on scene index (odd=from-left, even=from-right)
 * - wipe: standard wipe effect
 */
const getTransitionPresentation = (
  type: string,
  sceneIndex: number
): ReturnType<typeof fade> | ReturnType<typeof slide> | ReturnType<typeof wipe> | undefined => {
  switch (type) {
    case "fade":
      return fade();
    case "slide":
      // Alternate direction: odd scenes from-left, even scenes from-right
      return slide({
        direction: sceneIndex % 2 === 1 ? "from-left" : "from-right",
      });
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
          const isLast = index === script.scenes.length - 1;

          return (
            <React.Fragment key={scene.id}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                <Scene scene={scene} imagePaths={images} />
              </TransitionSeries.Sequence>
              {/* No transition after last scene - video ends directly */}
              {!isLast && transition && transition.type !== "none" && (
                <TransitionSeries.Transition
                  timing={linearTiming({
                    durationInFrames: getTransitionDuration(scene.type),
                  })}
                  presentation={getTransitionPresentation(transition.type, index)}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
