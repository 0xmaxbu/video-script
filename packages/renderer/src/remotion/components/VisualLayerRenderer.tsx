import React from "react";
import { VisualLayer } from "../../types.js";
import { ScreenshotLayer } from "./ScreenshotLayer.js";
import { TextLayer } from "./TextLayer.js";
import { CodeLayer } from "./CodeLayer.js";

interface VisualLayerRendererProps {
  layer: VisualLayer;
}

export const VisualLayerRenderer: React.FC<VisualLayerRendererProps> = ({
  layer,
}) => {
  switch (layer.type) {
    case "screenshot":
      return <ScreenshotLayer layer={layer} />;
    case "text":
      return <TextLayer layer={layer} />;
    case "code":
      return <CodeLayer layer={layer} />;
    case "diagram":
      return <ScreenshotLayer layer={layer} />;
    case "image":
      return <ScreenshotLayer layer={layer} />;
    default:
      return null;
  }
};
