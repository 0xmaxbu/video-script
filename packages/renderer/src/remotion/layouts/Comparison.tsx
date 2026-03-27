import React from "react";
import { Img, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Grid } from "./Grid.js";
import { FrostedCard } from "./FrostedCard.js";
import { TYPOGRAPHY } from "./grid-utils.js";
import { THEME } from "../theme.js";
import type { LayoutProps } from "./index.js";
import type {
  ScreenshotResource,
  TextElement,
} from "../../utils/sceneAdapter.js";

/**
 * Comparison Layout
 *
 * 对比布局
 * 适合：前后对比、功能对比
 */
export const Comparison: React.FC<LayoutProps> = ({ scene, screenshots }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const resources = scene.mediaResources.filter(
    (r: ScreenshotResource) => r.role === "primary" || r.role === "secondary",
  );

  const titleElement = scene.textElements.find(
    (t: TextElement) => t.role === "title",
  );

  // VS 文字动画
  const vsProgress = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 100, stiffness: 300 },
  });

  const leftSrc = resources[0] ? screenshots.get(resources[0].id) : undefined;
  const rightSrc = resources[1] ? screenshots.get(resources[1].id) : undefined;

  return (
    <Grid style={{ backgroundColor: THEME.bg.primary }}>
      {/* 标题 */}
      {titleElement && (
        <div
          style={{
            paddingBottom: "1.5rem",
            textAlign: "center",
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
        </div>
      )}

      {/* 对比区域 - 使用 Grid 定位 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem",
        }}
      >
        {/* 左侧 - Before */}
        {leftSrc && (
          <FrostedCard
            blur={20}
            radius={24}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "1.5rem",
            }}
          >
            <span
              style={{
                fontSize: TYPOGRAPHY.body.secondary,
                color: THEME.text.muted,
                marginBottom: "0.75rem",
              }}
            >
              Before
            </span>
            <Img
              src={leftSrc}
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                borderRadius: "0.5rem",
              }}
            />
          </FrostedCard>
        )}

        {/* VS */}
        <FrostedCard
          blur={25}
          radius={32}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: vsProgress,
            transform: `scale(${vsProgress})`,
            padding: "1rem 2rem",
          }}
        >
          <span
            style={{
              fontSize: TYPOGRAPHY.title.section,
              fontWeight: "bold",
              color: THEME.text.primary,
            }}
          >
            VS
          </span>
        </FrostedCard>

        {/* 右侧 - After */}
        {rightSrc && (
          <FrostedCard
            blur={20}
            radius={24}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "1.5rem",
            }}
          >
            <span
              style={{
                fontSize: TYPOGRAPHY.body.secondary,
                color: THEME.text.muted,
                marginBottom: "0.75rem",
              }}
            >
              After
            </span>
            <Img
              src={rightSrc}
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                borderRadius: "0.5rem",
              }}
            />
          </FrostedCard>
        )}
      </div>
    </Grid>
  );
};
