import React from "react";
import { VisualLayer, SceneNarrativeType } from "../../types.js";
import { ScreenshotLayer } from "./ScreenshotLayer.js";
import { TextLayer } from "./TextLayer.js";
import { CodeLayer } from "./CodeLayer.js";

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
  switch (layer.type) {
    case "screenshot":
      return (
        <ScreenshotLayer
          layer={layer}
          imagePath={imagePath}
          sceneType={sceneType}
        />
      );
    case "text":
      return <TextLayer layer={layer} />;
    case "code":
      return <CodeLayer layer={layer} />;
    case "diagram":
      return (
        <ScreenshotLayer
          layer={layer}
          imagePath={imagePath}
          sceneType={sceneType}
        />
      );
    case "image":
      return (
        <ScreenshotLayer
          layer={layer}
          imagePath={imagePath}
          sceneType={sceneType}
        />
      );
    default:
      return null;
  }
};
