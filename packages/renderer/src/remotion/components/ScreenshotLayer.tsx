import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { VisualLayer, SceneNarrativeType } from "../../types.js";
import {
  useKenBurns,
  useParallax,
  useEnterAnimation,
  useExitAnimation,
} from "../../utils/animation-utils.js";

interface ScreenshotLayerProps {
  layer: VisualLayer;
  imagePath: string | undefined;
  sceneType?: SceneNarrativeType;
}

export const ScreenshotLayer: React.FC<ScreenshotLayerProps> = ({
  layer,
  imagePath,
  sceneType,
}) => {
  const { content, position, animation } = layer;

  const enter = useEnterAnimation(animation);
  const exit = useExitAnimation(animation);

  const kenBurns = useKenBurns(sceneType ?? "feature");
  const parallax = useParallax(position.zIndex);

  const kbScale =
    sceneType === "intro" || sceneType === "feature" ? kenBurns.scale : 1;
  const pTranslateX = sceneType === "intro" ? parallax.translateX : 0;
  const pTranslateY = sceneType === "intro" ? parallax.translateY : 0;

  const opacity =
    exit.opacity !== undefined
      ? Math.min(enter.opacity, exit.opacity)
      : enter.opacity;
  const translateX = enter.translateX + exit.translateX + pTranslateX;
  const translateY = enter.translateY + exit.translateY + pTranslateY;
  const scale =
    exit.scale !== undefined ? Math.min(enter.scale, exit.scale) : enter.scale;

  const finalScale = scale * kbScale;

  const style: React.CSSProperties = {
    position: "absolute",
    left:
      typeof position.x === "number"
        ? position.x
        : position.x === "left"
          ? 0
          : position.x === "center"
            ? "50%"
            : "auto",
    top:
      typeof position.y === "number"
        ? position.y
        : position.y === "top"
          ? 0
          : position.y === "center"
            ? "50%"
            : "auto",
    width:
      position.width === "full"
        ? "100%"
        : position.width === "auto"
          ? "auto"
          : position.width,
    height:
      position.height === "full"
        ? "100%"
        : position.height === "auto"
          ? "auto"
          : position.height,
    zIndex: position.zIndex,
    transform: `translate(${translateX}px, ${translateY}px) scale(${finalScale})`,
    transformOrigin: "center center",
    opacity,
  };

  const imageSrc = imagePath || content;

  return (
    <AbsoluteFill style={style}>
      <Img
        src={imageSrc}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </AbsoluteFill>
  );
};
