import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import type { LayoutProps } from "./index.js";

/**
 * Bullet List Layout
 *
 * 要点列表布局
 * 适合：总结、特性列表
 */
export const BulletList: React.FC<LayoutProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleElement = scene.textElements.find((t) => t.role === "title");
  const bulletElements = scene.textElements.filter((t) => t.role === "bullet");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        padding: "4rem",
      }}
    >
      {/* 标题 */}
      {titleElement && (
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: "bold",
            color: "white",
            marginBottom: "2rem",
          }}
        >
          {titleElement.content}
        </h1>
      )}

      {/* 要点列表 */}
      <div style={{ flex: 1 }}>
        {bulletElements.map((bullet, index) => {
          const bulletFrame = Math.max(0, frame - index * 10);
          const bulletProgress = spring({
            frame: bulletFrame,
            fps,
            config: { damping: 100, stiffness: 200 },
          });

          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "1.5rem",
                opacity: bulletProgress,
                transform: `translateX(${interpolate(bulletProgress, [0, 1], [-30, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  marginRight: "1rem",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "1.75rem",
                  color: "white",
                }}
              >
                {bullet.content}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
