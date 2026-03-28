import React from "react";
import { VisualLayer, SceneNarrativeType, Annotation } from "../../types.js";
import { ScreenshotLayer } from "./ScreenshotLayer.js";
import { TextLayer } from "./TextLayer.js";
import { CodeLayer } from "./CodeLayer.js";
import { CalloutLayer } from "./CalloutLayer.js";

interface VisualLayerRendererProps {
  layer: VisualLayer;
  imagePath: string | undefined;
  sceneType?: SceneNarrativeType;
  /** Scene-level annotations to render relative to this screenshot layer */
  sceneAnnotations?: Annotation[];
}

export const VisualLayerRenderer: React.FC<VisualLayerRendererProps> = ({
  layer,
  imagePath,
  sceneType,
  sceneAnnotations,
}) => {
  const screenshotProps =
    sceneType !== undefined
      ? { layer, imagePath, sceneType, sceneAnnotations }
      : { layer, imagePath, sceneAnnotations };

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
