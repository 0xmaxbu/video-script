import React from "react";
import { AbsoluteFill } from "remotion";
import { SceneScript as SceneType, VisualLayer } from "../types";
import { KineticSubtitle } from "./components/KineticSubtitle";
import { VisualLayerRenderer } from "./components/VisualLayerRenderer";
import { CodeAnimation } from "./components/CodeAnimation";
import { AnnotationRenderer } from "./annotations/AnnotationRenderer";
import type { Annotation } from "@video-script/types";
import { getLayoutComponent } from "./layouts/index";
import { convertToVisualScene } from "../utils/sceneAdapter";

interface SceneProps {
  scene: SceneType;
  imagePaths: Record<string, string> | undefined;
  annotations?: Annotation[];
  showSubtitles?: boolean;
}

const getPositionStyle = (
  position: VisualLayer["position"],
): React.CSSProperties => {
  const style: React.CSSProperties = {
    position: "absolute",
  };

  if (typeof position.x === "number") {
    style.left = position.x;
  } else if (position.x === "left") {
    style.left = 0;
  } else if (position.x === "center") {
    style.left = "50%";
    style.transform = "translateX(-50%)";
  } else if (position.x === "right") {
    style.right = 0;
  }

  if (typeof position.y === "number") {
    style.top = position.y;
  } else if (position.y === "top") {
    style.top = 0;
  } else if (position.y === "center") {
    style.top = "50%";
    style.transform = "translateY(-50%)";
  } else if (position.y === "bottom") {
    style.bottom = 0;
  }

  if (position.width === "full") {
    style.width = "100%";
  } else if (position.width === "auto") {
    style.width = "auto";
  } else if (typeof position.width === "number") {
    style.width = position.width;
  }

  if (position.height === "full") {
    style.height = "100%";
  } else if (position.height === "auto") {
    style.height = "auto";
  } else if (typeof position.height === "number") {
    style.height = position.height;
  }

  if (position.zIndex !== undefined) {
    style.zIndex = position.zIndex;
  }

  return style;
};

/**
 * InlineScene - D-03 fallback component
 *
 * Contains the original inline rendering logic used when:
 * - layoutTemplate is undefined
 * - layoutTemplate is explicitly "inline"
 * - getLayoutComponent returns null (unknown layout)
 * - Layout rendering fails
 */
const InlineScene: React.FC<SceneProps> = ({
  scene,
  imagePaths,
  annotations = [],
  showSubtitles = false,
}) => {
  const { type, title, narration, visualLayers } = scene;

  const containerStyle: React.CSSProperties = {
    backgroundColor: "#1a1a1a",
    color: "white",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 80,
    fontWeight: "bold",
    marginBottom: 40,
    zIndex: 1,
    textAlign: "center",
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  };

  const codeLayer = visualLayers?.find((l) => l.type === "code");
  const codeContent = codeLayer?.content || "";

  if (type === "intro" || type === "outro") {
    return (
      <AbsoluteFill style={containerStyle}>
        <div style={contentStyle}>
          <h1 style={titleStyle}>{title}</h1>
        </div>
        {/* Text layers rendered via AbsoluteFill with their own positioning */}
        {visualLayers
          ?.filter((l) => l.type === "text")
          .map((layer) => {
            const imageKey = `${scene.id}-${layer.id}`;
            const imagePath = imagePaths?.[imageKey];
            return (
              <VisualLayerRenderer
                key={layer.id}
                layer={layer}
                imagePath={imagePath}
                sceneType={scene.type}
              />
            );
          })}
        <AnnotationRenderer annotations={annotations} />
        {showSubtitles && <KineticSubtitle text={narration} />}
      </AbsoluteFill>
    );
  }

  if (type === "feature") {
    return (
      <AbsoluteFill style={containerStyle}>
        {/* Screenshot/diagram/image layers fill the background */}
        {visualLayers
          ?.filter((l) => ["screenshot", "diagram", "image"].includes(l.type))
          .map((layer) => {
            const imageKey = `${scene.id}-${layer.id}`;
            const imagePath = imagePaths?.[imageKey];
            return (
              <VisualLayerRenderer
                key={layer.id}
                layer={layer}
                imagePath={imagePath}
                sceneType={scene.type}
              />
            );
          })}
        {/* Code layers positioned via their own absolute positioning */}
        {visualLayers
          ?.filter((l) => l.type === "code")
          .map((layer) => {
            const imageKey = `${scene.id}-${layer.id}`;
            const imagePath = imagePaths?.[imageKey];
            return (
              <div key={layer.id} style={getPositionStyle(layer.position)}>
                <VisualLayerRenderer
                  layer={layer}
                  imagePath={imagePath}
                  sceneType={scene.type}
                />
              </div>
            );
          })}
        {/* Text layers via AbsoluteFill with their own positioning */}
        {visualLayers
          ?.filter((l) => l.type === "text")
          .map((layer) => {
            const imageKey = `${scene.id}-${layer.id}`;
            const imagePath = imagePaths?.[imageKey];
            return (
              <VisualLayerRenderer
                key={layer.id}
                layer={layer}
                imagePath={imagePath}
                sceneType={scene.type}
              />
            );
          })}
        <AnnotationRenderer annotations={annotations} />
        {showSubtitles && <KineticSubtitle text={narration} />}
      </AbsoluteFill>
    );
  }

  if (type === "code") {
    return (
      <AbsoluteFill
        style={{ ...containerStyle, backgroundColor: "#1e1e1e", padding: 0 }}
      >
        <div style={{ flex: 1, width: "100%" }}>
          <CodeAnimation
            code={codeContent}
            highlightLines={[]}
            title={title}
            showLineNumbers={true}
          />
        </div>
        {visualLayers
          ?.filter((l) => l.type !== "code")
          .map((layer) => {
            const imageKey = `${scene.id}-${layer.id}`;
            const imagePath = imagePaths?.[imageKey];
            return (
              <VisualLayerRenderer
                key={layer.id}
                layer={layer}
                imagePath={imagePath}
                sceneType={scene.type}
              />
            );
          })}
        <AnnotationRenderer annotations={annotations} />
        {showSubtitles && <KineticSubtitle text={narration} />}
      </AbsoluteFill>
    );
  }

  return null;
};

/**
 * Scene - Main scene component with layout routing
 *
 * Per D-03: Routes through layout components when layoutTemplate is set,
 * with fallback to inline rendering when:
 * - layoutTemplate is undefined or "inline"
 * - getLayoutComponent returns null (unknown layout)
 * - Layout rendering throws an error
 */
export const Scene: React.FC<SceneProps> = ({
  scene,
  imagePaths,
  annotations = [],
  showSubtitles = false,
}) => {
  const layoutTemplate = scene.layoutTemplate;

  // D-03: Fallback to inline when no template or explicit "inline"
  if (!layoutTemplate || layoutTemplate === "inline") {
    return (
      <InlineScene
        scene={scene}
        imagePaths={imagePaths}
        annotations={annotations}
        showSubtitles={showSubtitles}
      />
    );
  }

  const LayoutComponent = getLayoutComponent(layoutTemplate);

  // D-03b: Degrade gracefully on unknown layout
  if (!LayoutComponent) {
    console.warn(
      `Unknown layout template: ${layoutTemplate}, falling back to inline`,
    );
    return (
      <InlineScene
        scene={scene}
        imagePaths={imagePaths}
        annotations={annotations}
        showSubtitles={showSubtitles}
      />
    );
  }

  try {
    const visualScene = convertToVisualScene(scene, imagePaths || {});
    const screenshotsMap = new Map(Object.entries(imagePaths || {}));

    return (
      <LayoutComponent scene={visualScene} screenshots={screenshotsMap}>
        <AnnotationRenderer annotations={annotations} />
        {showSubtitles && <KineticSubtitle text={scene.narration} />}
      </LayoutComponent>
    );
  } catch (error) {
    console.warn(`Layout render failed: ${error}, falling back to inline`);
    return (
      <InlineScene
        scene={scene}
        imagePaths={imagePaths}
        annotations={annotations}
        showSubtitles={showSubtitles}
      />
    );
  }
};
