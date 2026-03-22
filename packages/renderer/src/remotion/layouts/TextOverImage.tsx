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
import {
  GRID_CONSTANTS,
  TYPOGRAPHY,
  getGridColumnPx,
  getGridSpanPx,
} from "./grid-utils.js";

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

  // Center the text overlay card (8 columns wide for a centered layout)
  const cardWidth = getGridSpanPx(8);
  const cardLeft = getGridColumnPx(3); // Center: start at column 3 to center 8-col card
  const cardTop = 0;
  const cardHeight =
    GRID_CONSTANTS.height -
    GRID_CONSTANTS.safeZone.top -
    GRID_CONSTANTS.safeZone.bottom;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* 背景图片 */}
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

      {/* 文字内容 - 使用 Grid + FrostedCard */}
      <Grid>
        <FrostedCard
          style={{
            position: "absolute",
            left: cardLeft,
            top: cardTop,
            width: cardWidth,
            height: cardHeight,
            opacity: textProgress,
            transform: `translateY(${interpolate(
              textProgress,
              [0, 1],
              [30, 0],
            )}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "4rem",
          }}
        >
          {titleElement && (
            <h1
              style={{
                fontSize: TYPOGRAPHY.title.section,
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
                fontSize: TYPOGRAPHY.body.primary,
                color: "rgba(255,255,255,0.85)",
                textAlign: "center",
                maxWidth: "80%",
              }}
            >
              {subtitleElement.content}
            </p>
          )}
        </FrostedCard>
      </Grid>
    </AbsoluteFill>
  );
};
