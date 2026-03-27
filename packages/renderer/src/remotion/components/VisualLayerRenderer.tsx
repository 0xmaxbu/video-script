import React from "react";
import { VisualLayer, SceneNarrativeType } from "../../types.js";
import { ScreenshotLayer } from "./ScreenshotLayer.js";
import { TextLayer } from "./TextLayer.js";
import { CodeLayer } from "./CodeLayer.js";
import { CalloutLayer } from "./CalloutLayer.js";

interface VisualLayerRendererProps {
  layer: VisualLayer;
  imagePath: string | undefined;
  sceneType?: SceneNarrativeType;
}

export const VisualLayerRenderer: React.FC<VisualLayerRendererProps> = ({
  layer,
  imagePath,
  sceneType,
}) => {
  const screenshotProps =
    sceneType !== undefined
      ? { layer, imagePath, sceneType }
      : { layer, imagePath };

  switch (layer.type) {
    case "screenshot":
      return <ScreenshotLayer {...screenshotProps} />;
    case "text":
      return <TextLayer layer={layer} />;
    case "code":
      return <CodeLayer layer={layer} />;
    case "diagram":
      return <ScreenshotLayer {...screenshotProps} />;
    case "image":
      return <ScreenshotLayer {...screenshotProps} />;
    case "callout":
      return <CalloutLayer layer={layer} />;
    default:
      return null;
  }
};
