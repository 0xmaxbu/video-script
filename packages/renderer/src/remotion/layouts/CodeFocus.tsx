import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { Grid } from "./Grid.js";
import { FrostedCard } from "./FrostedCard.js";
import { TYPOGRAPHY } from "./grid-utils.js";
import { THEME } from "../theme.js";
import type { LayoutProps } from "./index.js";
import type { TextElement } from "../../utils/sceneAdapter.js";

/**
 * Code Focus Layout
 *
 * 代码聚焦布局
 * 适合：代码演示
 */
export const CodeFocus: React.FC<LayoutProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleElement = scene.textElements.find(
    (t: TextElement) => t.role === "title",
  );
  const subtitleElement = scene.textElements.find(
    (t: TextElement) => t.role === "subtitle",
  );

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
    <Grid>
      {/* Full-bleed dark background */}
      <AbsoluteFill style={{ backgroundColor: THEME.bg.primary }} />

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
              fontSize: TYPOGRAPHY.title.section,
              fontWeight: "bold",
              color: THEME.text.primary,
              margin: 0,
            }}
          >
            {titleElement.content}
          </h1>
          {subtitleElement && (
            <p
              style={{
                fontSize: TYPOGRAPHY.body.primary,
                color: THEME.text.secondary,
                marginTop: "0.5rem",
              }}
            >
              {subtitleElement.content}
            </p>
          )}
        </div>
      )}

      {/* 代码区域 - 使用 FrostedCard 包装 */}
      <FrostedCard
        blur={20}
        radius={24}
        style={{
          flex: 1,
          backgroundColor: THEME.bg.card,
          padding: "2rem",
          opacity: codeProgress,
          transform: `scale(${interpolate(codeProgress, [0, 1], [0.95, 1])})`,
          overflow: "hidden",
          border: `1px solid ${THEME.glass.border}`,
        }}
      >
        {/* 代码内容占位 - 实际由 Screenshot Agent 生成的代码截图填充 */}
        <div
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: TYPOGRAPHY.body.caption,
            color: "#d4d4d4",
            lineHeight: 1.6,
          }}
        >
          {/* 代码内容将由 Screenshot 或 Annotation 组件渲染 */}
        </div>
      </FrostedCard>
    </Grid>
  );
};
