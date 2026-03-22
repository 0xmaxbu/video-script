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
 * Hero Fullscreen Layout
 *
 * 全屏大图 + 底部标题
 * 适合：开场、重点时刻
 */
export const HeroFullscreen: React.FC<LayoutProps> = ({
  scene,
  screenshots,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgResource = scene.mediaResources.find((r) => r.role === "background");
  const bgScreenshot = bgResource ? screenshots.get(bgResource.id) : null;

  const titleElement = scene.textElements.find((t) => t.role === "title");

  // 标题动画
  const titleAppearFrame = titleElement?.narrationBinding.appearAt
    ? titleElement.narrationBinding.appearAt * fps
        : 0;
  const titleProgress = spring({
    frame: Math.max(0, frame - titleAppearFrame),
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(titleProgress, [0, 1], [50, 0], {
    extrapolateRight: "clamp",
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
              filter: "brightness(0.7)",
            }}
          />
          {/* 渐变遮罩 */}
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* 底部标题 */}
      {titleElement && (
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: "10%",
            paddingLeft: "5%",
            paddingRight: "5%",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <h1
            style={{
              fontSize: "4rem",
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              margin: 0,
            }}
          >
            {titleElement.content}
          </h1>
          {scene.textElements.find((t) => t.role === "subtitle") && (
            <p
              style={{
                fontSize: "1.5rem",
                color: "rgba(255,255,255,0.8)",
                marginTop: "0.5rem",
              }}
            >
              {scene.textElements.find((t) => t.role === "subtitle")?.content}
            </p>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
