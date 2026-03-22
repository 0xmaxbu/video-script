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
 * Comparison Layout
 *
 * 对比布局
 * 适合：前后对比、功能对比
 */
export const Comparison: React.FC<LayoutProps> = ({
  scene,
  screenshots,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const resources = scene.mediaResources.filter(
    (r) => r.role === "primary" || r.role === "secondary",
  );

  const titleElement = scene.textElements.find((t) => t.role === "title");

  // VS 文字动画
  const vsProgress = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 100, stiffness: 300 },
  });

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column" }}
    >
      {/* 标题 */}
      {titleElement && (
        <div
          style={{
            padding: "2rem 4rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "white", margin: 0 }}>
            {titleElement.content}
          </h1>
        </div>
      )}

      {/* 对比区域 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem",
          padding: "2rem",
        }}
      >
        {/* 左侧 - Before */}
        {resources[0] && screenshots.get(resources[0].id) && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem" }}>
              Before
            </span>
            <Img
              src={screenshots.get(resources[0].id)}
              style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain", borderRadius: "0.5rem" }}
            />
          </div>
        )}

        {/* VS */}
        <div
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "white",
            backgroundColor: "#333",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            opacity: vsProgress,
            transform: `scale(${vsProgress})`,
          }}
        >
          VS
        </div>

        {/* 右侧 - After */}
        {resources[1] && screenshots.get(resources[1].id) && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem" }}>
              After
            </span>
            <Img
              src={screenshots.get(resources[1].id)}
              style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain", borderRadius: "0.5rem" }}
            />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
