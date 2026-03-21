import { Player } from "@remotion/player";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { VideoDetail, SceneData, VisualLayerData } from "../types/video";
import { useMemo } from "react";

interface VideoPlayerProps {
  video: VideoDetail;
}

// Scene component for Remotion
function Scene({
  scene,
  imagePaths,
}: {
  scene: SceneData;
  imagePaths?: Record<string, string>;
}) {
  const frame = useCurrentFrame();
  const { type, title, narration, visualLayers } = scene;

  const containerStyle: React.CSSProperties = {
    backgroundColor: type === "intro" || type === "outro" ? "#1a1a1a" : "white",
    color: type === "intro" || type === "outro" ? "white" : "black",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    textAlign: "center",
    width: "100%",
    height: "100%",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: type === "intro" || type === "outro" ? 80 : 60,
    fontWeight: "bold",
    marginBottom: 40,
    zIndex: 100,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 32,
    color: type === "intro" || type === "outro" ? "white" : "#333",
    textAlign: "center",
    maxWidth: "90%",
    opacity: interpolate(frame, [0, 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };

  // Render visual layers
  const renderedLayers = useMemo(() => {
    if (!visualLayers) return null;

    return visualLayers.map((layer) => {
      const style = getPositionStyle(layer.position);
      const enterFrame = layer.animation.enterDelay * 30;
      const progress = interpolate(
        Math.max(0, frame - enterFrame),
        [0, 15],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );

      const layerStyle: React.CSSProperties = {
        ...style,
        opacity: progress,
      };

      if (
        (layer.type === "screenshot" ||
          layer.type === "diagram" ||
          layer.type === "image") &&
        layer.content
      ) {
        // Check if we have a local screenshot for this layer
        const imageKey = `${scene.id}-${layer.id}`;
        const imagePath = imagePaths?.[imageKey] || layer.content;

        // If it's a data URL or local path, use it directly
        if (
          imagePath.startsWith("data:") ||
          imagePath.startsWith("http") ||
          imagePath.startsWith("/")
        ) {
          return (
            <div key={layer.id} style={layerStyle}>
              <Img
                src={imagePath}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          );
        }
      }

      if (layer.type === "text") {
        return (
          <div key={layer.id} style={layerStyle}>
            <span
              style={{
                fontSize: 40,
                fontWeight: "bold",
                color: "#333",
              }}
            >
              {layer.content}
            </span>
          </div>
        );
      }

      if (layer.type === "code") {
        return (
          <div key={layer.id} style={layerStyle}>
            <pre
              style={{
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
                padding: 20,
                borderRadius: 8,
                fontSize: 16,
                fontFamily: "monospace",
                overflow: "hidden",
                width: "100%",
                height: "100%",
              }}
            >
              {layer.content}
            </pre>
          </div>
        );
      }

      return null;
    });
  }, [visualLayers, frame, scene.id, imagePaths]);

  if (type === "intro" || type === "outro") {
    return (
      <AbsoluteFill style={containerStyle}>
        <h1 style={titleStyle}>{title}</h1>
        <div style={subtitleStyle}>{narration}</div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={containerStyle}>
      {renderedLayers}
      <h1 style={{ ...titleStyle, fontSize: 60 }}>{title}</h1>
      <div style={subtitleStyle}>{narration}</div>
    </AbsoluteFill>
  );
}

function getPositionStyle(pos: VisualLayerData["position"]): React.CSSProperties {
  const style: React.CSSProperties = {
    position: "absolute",
    zIndex: pos.zIndex || 0,
  };

  if (typeof pos.x === "number") style.left = pos.x;
  else if (pos.x === "center") style.left = "50%";
  else if (pos.x === "left") style.left = 0;
  else if (pos.x === "right") style.right = 0;

  if (typeof pos.y === "number") style.top = pos.y;
  else if (pos.y === "center") style.top = "50%";
  else if (pos.y === "top") style.top = 0;
  else if (pos.y === "bottom") style.bottom = 0;

  if (typeof pos.width === "number") style.width = pos.width;
  else if (pos.width === "full") style.width = "100%";
  else if (pos.width === "auto") style.width = "auto";

  if (typeof pos.height === "number") style.height = pos.height;
  else if (pos.height === "full") style.height = "100%";
  else if (pos.height === "auto") style.height = "auto";

  return style;
}

// Video composition for Remotion Player
function VideoComposition({
  script,
  images,
}: {
  script: VideoDetail["script"];
  images: Record<string, string>;
}) {
  const fps = 30;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {script.scenes.map((scene, index) => {
        const startFrame = script.scenes
          .slice(0, index)
          .reduce((sum, s) => sum + s.duration * fps, 0);
        const durationInFrames = Math.ceil(scene.duration * fps);

        return (
          <AbsoluteFill
            key={scene.id}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            {startFrame === 0 && (
              <Scene scene={scene} imagePaths={images} />
            )}
          </AbsoluteFill>
        );
      })}
      {/* Show first scene as preview */}
      {script.scenes[0] && (
        <Scene scene={script.scenes[0]} imagePaths={images} />
      )}
    </AbsoluteFill>
  );
}

export function VideoPlayer({ video }: VideoPlayerProps) {
  const { script, screenshotResources } = video;
  const totalDuration = script.totalDuration;
  const fps = 30;

  return (
    <div className="video-player">
      <div className="video-header">
        <h2>{video.title}</h2>
        <div className="video-meta">
          <span>Duration: {Math.floor(totalDuration / 60)}:{Math.floor(totalDuration % 60).toString().padStart(2, "0")}</span>
          <span>Scenes: {script.scenes.length}</span>
          <span>FPS: {fps}</span>
        </div>
      </div>

      <div className="player-container">
        <Player
          component={VideoComposition}
          inputProps={{
            script,
            images: screenshotResources,
          }}
          durationInFrames={Math.ceil(totalDuration * fps)}
          compositionWidth={1920}
          compositionHeight={1080}
          fps={fps}
          style={{
            width: "100%",
            height: "100%",
          }}
          controls
          loop
        />
      </div>

      <div className="scenes-list">
        <h3>Scenes</h3>
        <div className="scenes-grid">
          {script.scenes.map((scene, index) => (
            <div key={scene.id} className="scene-card">
              <div className="scene-number">#{index + 1}</div>
              <div className="scene-info">
                <div className="scene-type">{scene.type}</div>
                <div className="scene-title">{scene.title}</div>
                <div className="scene-duration">{scene.duration}s</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
