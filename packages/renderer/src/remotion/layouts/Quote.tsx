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
 * Quote Layout
 *
 * 引用布局
 * 适合：名言、重要声明
 */
export const Quote: React.FC<LayoutProps> = ({ scene, screenshots }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgResource = scene.mediaResources.find((r) => r.role === "background");
  const bgScreenshot = bgResource ? screenshots.get(bgResource.id) : null;

  const quoteElement = scene.textElements.find((t) => t.role === "quote");
  const authorElement = scene.textElements.find((t) => t.role === "subtitle");

  // 动画
  const quoteProgress = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 150 },
  });

  const authorProgress = spring({
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
              filter: "blur(5px) brightness(0.4)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* 引号装饰 */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          fontSize: "10rem",
          color: "rgba(255,255,255,0.15)",
          fontFamily: "Georgia, serif",
          opacity: quoteProgress,
        }}
      >
        "
      </div>

      {/* 引用内容 */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 8rem",
          opacity: quoteProgress,
          transform: `translateY(${interpolate(quoteProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        {quoteElement && (
          <blockquote
            style={{
              fontSize: "2.5rem",
              fontWeight: "500",
              color: "white",
              textAlign: "center",
              lineHeight: 1.5,
              fontStyle: "italic",
              margin: 0,
              maxWidth: "80%",
            }}
          >
            {quoteElement.content}
          </blockquote>
        )}

        {authorElement && (
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              opacity: authorProgress,
            }}
          >
            <div
              style={{
                width: "50px",
                height: "2px",
                backgroundColor: "rgba(255,255,255,0.5)",
              }}
            />
            <span
              style={{
                fontSize: "1.25rem",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {authorElement.content}
            </span>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
