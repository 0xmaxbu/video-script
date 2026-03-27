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
import { Grid } from "./Grid.js";
import { FrostedCard } from "./FrostedCard.js";
import { THEME } from "../theme.js";
import {
  GRID_CONSTANTS,
  TYPOGRAPHY,
  getGridColumnPx,
  getGridSpanPx,
} from "./grid-utils.js";

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

  // Grid positioning for 50/50 split (6 columns each)
  const leftCardWidth = getGridSpanPx(6);
  const rightCardWidth = getGridSpanPx(6);
  const leftCardLeft = getGridColumnPx(1);
  const rightCardLeft = getGridColumnPx(7);
  const cardTop = 0;
  const cardHeight =
    GRID_CONSTANTS.height -
    GRID_CONSTANTS.safeZone.top -
    GRID_CONSTANTS.safeZone.bottom;

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg.primary }}>
      <Grid>
        {/* 左侧 FrostedCard */}
        <FrostedCard
          style={{
            position: "absolute",
            left: leftCardLeft,
            top: cardTop,
            width: leftCardWidth,
            height: cardHeight,
            opacity: leftProgress,
            transform: `translateX(${interpolate(
              leftProgress,
              [0, 1],
              [-50, 0],
            )}px)`,
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
        </FrostedCard>

        {/* 右侧 FrostedCard */}
        <FrostedCard
          style={{
            position: "absolute",
            left: rightCardLeft,
            top: cardTop,
            width: rightCardWidth,
            height: cardHeight,
            opacity: rightProgress,
            transform: `translateX(${interpolate(
              rightProgress,
              [0, 1],
              [50, 0],
            )}px)`,
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
                fontSize: TYPOGRAPHY.title.card,
                fontWeight: "bold",
                color: THEME.text.primary,
                marginTop: "1rem",
                textAlign: "center",
              }}
            >
              {titleElement.content}
            </h2>
          )}
        </FrostedCard>
      </Grid>
    </AbsoluteFill>
  );
};
