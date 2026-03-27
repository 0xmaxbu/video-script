import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { fitText } from "@remotion/layout-utils";
import { Grid } from "./Grid.js";
import { FrostedCard } from "./FrostedCard.js";
import { TYPOGRAPHY, GRID_CONSTANTS } from "./grid-utils.js";
import { THEME } from "../theme.js";
import type { LayoutProps } from "./index.js";
import type {
  ScreenshotResource,
  TextElement,
} from "../../utils/sceneAdapter.js";

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

  const bgResource = scene.mediaResources.find(
    (r: ScreenshotResource) => r.role === "background",
  );
  const bgScreenshot = bgResource ? screenshots.get(bgResource.id) : null;

  const titleElement = scene.textElements.find(
    (t: TextElement) => t.role === "title",
  );

  // fitText for hero title — fit within safe-zone width, capped at TYPOGRAPHY.title.hero
  const heroTitleWidth =
    GRID_CONSTANTS.width -
    GRID_CONSTANTS.safeZone.left -
    GRID_CONSTANTS.safeZone.right; // 1920 - 120 - 120 = 1680

  const titleFontSize = titleElement?.content
    ? Math.max(
        36, // minimum readable size for hero
        Math.min(
          TYPOGRAPHY.title.hero, // cap at 80px
          fitText({
            text: titleElement.content,
            withinWidth: heroTitleWidth,
            fontFamily: "system-ui, sans-serif",
            fontWeight: "700",
          }).fontSize,
        ),
      )
    : TYPOGRAPHY.title.hero;

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

  const titleY = interpolate(titleProgress, [0, 1], [-50, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <Grid>
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

      {/* 底部标题 - FrostedCard */}
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
          <FrostedCard
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingBottom: "10%",
              paddingLeft: "5%",
              paddingRight: "5%",
              width: "100%",
            }}
          >
            <h1
              style={{
                fontSize: titleFontSize,
                fontWeight: "bold",
                color: THEME.text.primary,
                textAlign: "center",
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                margin: 0,
              }}
            >
              {titleElement.content}
            </h1>
            {scene.textElements.find(
              (t: TextElement) => t.role === "subtitle",
            ) && (
              <p
                style={{
                  fontSize: TYPOGRAPHY.body.secondary,
                  color: THEME.text.secondary,
                  marginTop: "0.5rem",
                }}
              >
                {
                  scene.textElements.find(
                    (t: TextElement) => t.role === "subtitle",
                  )?.content
                }
              </p>
            )}
          </FrostedCard>
        </AbsoluteFill>
      )}
    </Grid>
  );
};
