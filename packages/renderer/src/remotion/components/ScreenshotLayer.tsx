import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { VisualLayer, SceneNarrativeType } from "../../types.js";
import {
  useKenBurns,
  useAdvancedKenBurns,
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
  const { content, position, animation, kenBurnsWaypoints } = layer;

  const enter = useEnterAnimation(animation);
  const exit = useExitAnimation(animation);

  // Use multi-focal Ken Burns when waypoints are provided, otherwise simple Ken Burns
  const advancedKB = useAdvancedKenBurns(kenBurnsWaypoints ?? []);
  const simpleKB = useKenBurns(sceneType ?? "feature");
  const parallax = useParallax(position.zIndex);

  const useAdvanced =
    kenBurnsWaypoints !== undefined && kenBurnsWaypoints.length > 0;

  const kbScale = useAdvanced
    ? advancedKB.scale
    : sceneType === "intro" || sceneType === "feature"
      ? simpleKB.scale
      : 1;

  const kbTranslateX = useAdvanced ? advancedKB.translateX : 0;
  const kbTranslateY = useAdvanced ? advancedKB.translateY : 0;

  const pTranslateX =
    !useAdvanced && sceneType === "intro" ? parallax.translateX : 0;
  const pTranslateY =
    !useAdvanced && sceneType === "intro" ? parallax.translateY : 0;

  const opacity =
    exit.opacity !== undefined
      ? Math.min(enter.opacity, exit.opacity)
      : enter.opacity;
  const translateX =
    enter.translateX + exit.translateX + pTranslateX + kbTranslateX;
  const translateY =
    enter.translateY + exit.translateY + pTranslateY + kbTranslateY;
  const scale =
    exit.scale !== undefined ? Math.min(enter.scale, exit.scale) : enter.scale;

  const finalScale = scale * kbScale;

  const centerXOffset = position.x === "center" ? "-50%" : "0";
  const centerYOffset = position.y === "center" ? "-50%" : "0";

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
    right: position.x === "right" ? 0 : undefined,
    top:
      typeof position.y === "number"
        ? position.y
        : position.y === "top"
          ? 0
          : position.y === "center"
            ? "50%"
            : "auto",
    bottom: position.y === "bottom" ? 0 : undefined,
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
    transform: `translate(calc(${centerXOffset} + ${translateX}px), calc(${centerYOffset} + ${translateY}px)) scale(${finalScale})`,
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
