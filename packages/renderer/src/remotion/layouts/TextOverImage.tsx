import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import type { LayoutProps } from "./index.js";

/**
 * Text Over Image Layout
 *
 * 文字覆盖在图片上
 * 适合：重点说明、引用
 */
export const TextOverImage: React.FC<LayoutProps> = ({
  scene,
  screenshots,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgResource = scene.mediaResources.find((r) => r.role === "background");
  const bgScreenshot = bgResource ? screenshots.get(bgResource.id) : null;

  const titleElement = scene.textElements.find((t) => t.role === "title");
  const subtitleElement = scene.textElements.find((t) => t.role === "subtitle");

  // 动画
  const bgProgress = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 150 },
  });

  const textProgress = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* 背景 */}
      {bgScreenshot && (
        <AbsoluteFill>
          <Img
            src={bgScreenshot}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.6,
              transform: `scale(${interpolate(bgProgress, [0, 1], [1.1, 1])})`,
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* 文字内容 */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem",
          opacity: textProgress,
          transform: `translateY(${interpolate(textProgress, [0, 1], [30, 0])}px)`,
        }}
      >
        {titleElement && (
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              marginBottom: "1rem",
            }}
          >
            {titleElement.content}
          </h1>
        )}
        {subtitleElement && (
          <p
            style={{
              fontSize: "1.5rem",
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              maxWidth: "80%",
            }}
          >
            {subtitleElement.content}
          </p>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
