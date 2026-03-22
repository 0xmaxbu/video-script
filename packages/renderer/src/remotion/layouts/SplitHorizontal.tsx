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
 * Split Horizontal Layout
 *
 * 左右分屏 (50/50)
 * 适合：对比、前后展示
 */
export const SplitHorizontal: React.FC<LayoutProps> = ({
  scene,
  screenshots,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const primaryResource = scene.mediaResources.find(
    (r) => r.role === "primary",
  );
  const secondaryResource = scene.mediaResources.find(
    (r) => r.role === "secondary",
  );

  const primaryScreenshot = primaryResource
    ? screenshots.get(primaryResource.id)
    : null;
  const secondaryScreenshot = secondaryResource
    ? screenshots.get(secondaryResource.id)
    : null;

  const titleElement = scene.textElements.find((t) => t.role === "title");

  // 动画
  const leftProgress = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  const rightProgress = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", display: "flex" }}>
      {/* 左侧 */}
      <div
        style={{
          width: "50%",
          height: "100%",
          opacity: leftProgress,
          transform: `translateX(${interpolate(leftProgress, [0, 1], [-50, 0])}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        {primaryScreenshot && (
          <Img
            src={primaryScreenshot}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "0.5rem",
            }}
          />
        )}
      </div>

      {/* 右侧 */}
      <div
        style={{
          width: "50%",
          height: "100%",
          opacity: rightProgress,
          transform: `translateX(${interpolate(rightProgress, [0, 1], [50, 0])}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        {secondaryScreenshot && (
          <Img
            src={secondaryScreenshot}
            style={{
              maxWidth: "100%",
              maxHeight: "60%",
              objectFit: "contain",
              borderRadius: "0.5rem",
            }}
          />
        )}
        {titleElement && (
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "white",
              marginTop: "1rem",
              textAlign: "center",
            }}
          >
            {titleElement.content}
          </h2>
        )}
      </div>
    </AbsoluteFill>
  );
};
