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
 * Code Focus Layout
 *
 * 代码聚焦布局
 * 适合：代码演示
 */
export const CodeFocus: React.FC<LayoutProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleElement = scene.textElements.find((t) => t.role === "title");
  const subtitleElement = scene.textElements.find((t) => t.role === "subtitle");

  // 动画
  const codeProgress = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  const titleProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1e1e1e",
        display: "flex",
        flexDirection: "column",
        padding: "3rem",
      }}
    >
      {/* 标题 */}
      {titleElement && (
        <div
          style={{
            opacity: titleProgress,
            transform: `translateY(${interpolate(titleProgress, [0, 1], [-20, 0])}px)`,
            marginBottom: "1.5rem",
          }}
        >
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              color: "white",
              margin: 0,
            }}
          >
            {titleElement.content}
          </h1>
          {subtitleElement && (
            <p
              style={{
                fontSize: "1.25rem",
                color: "rgba(255,255,255,0.7)",
                marginTop: "0.5rem",
              }}
            >
              {subtitleElement.content}
            </p>
          )}
        </div>
      )}

      {/* 代码区域 - 实际代码由 Annotation 层渲染 */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#0d0d0d",
          borderRadius: "0.75rem",
          padding: "2rem",
          opacity: codeProgress,
          transform: `scale(${interpolate(codeProgress, [0, 1], [0.95, 1])})`,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* 代码内容占位 - 实际由 Screenshot Agent 生成的代码截图填充 */}
        <div
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: "1.1rem",
            color: "#d4d4d4",
            lineHeight: 1.6,
          }}
        >
          {/* 代码内容将由 Screenshot 或 Annotation 组件渲染 */}
        </div>
      </div>
    </AbsoluteFill>
  );
};
