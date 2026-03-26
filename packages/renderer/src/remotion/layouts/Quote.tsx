import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { Grid } from "./Grid.js";
import { FrostedCard } from "./FrostedCard.js";
import { TYPOGRAPHY, getGridSpanPx, GRID_CONSTANTS } from "./grid-utils.js";
import type { LayoutProps } from "./index.js";

/**
 * Quote Layout
 *
 * 引用布局
 * 适合：名言、重要声明
 *
 * Refactored to use Grid wrapper and FrostedCard for centered quote styling.
 * The large decorative quote mark is preserved as an absolutely-positioned element.
 */
export const Quote: React.FC<LayoutProps> = ({ scene, screenshots }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgResource = scene.mediaResources.find((r) => r.role === "background");
  const bgScreenshot = bgResource ? screenshots.get(bgResource.id) : null;

  const quoteElement = scene.textElements.find((t) => t.role === "quote");
  const authorElement = scene.textElements.find((t) => t.role === "subtitle");

  // Quote content spring animation
  const quoteProgress = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 150 },
  });

  // Author fade-in animation (delayed)
  const authorProgress = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  const usableWidth = getGridSpanPx(12);
  const usableHeight =
    GRID_CONSTANTS.height -
    GRID_CONSTANTS.safeZone.top -
    GRID_CONSTANTS.safeZone.bottom;

  // Centered card dimensions (60% of usable area for visual impact)
  const cardWidth = Math.round(usableWidth * 0.7);
  const cardHeight = Math.round(usableHeight * 0.6);
  const cardLeft =
    GRID_CONSTANTS.safeZone.left + (usableWidth - cardWidth) / 2;
  const cardTop =
    GRID_CONSTANTS.safeZone.top + (usableHeight - cardHeight) / 2;

  return (
    <Grid>
      {/* Full-bleed dark background */}
      <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }} />

      {/* Background image (blurred, dimmed) */}
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

      {/* Large decorative quote mark (absolutely positioned, overflows card) */}
      <div
        style={{
          position: "absolute",
          top: cardTop - 40,
          left: cardLeft - 30,
          fontSize: "10rem",
          color: "rgba(255,255,255,0.15)",
          fontFamily: "Georgia, serif",
          opacity: quoteProgress,
          lineHeight: 1,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        "
      </div>

      {/* FrostedCard-centered quote container */}
      <FrostedCard
        style={{
          position: "absolute",
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
          height: cardHeight,
          opacity: quoteProgress,
          transform: `translateY(${interpolate(quoteProgress, [0, 1], [20, 0])}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 4rem",
        }}
      >
        {/* Quote text */}
        {quoteElement && (
          <blockquote
            style={{
              fontSize: TYPOGRAPHY.title.section,
              fontWeight: "500",
              color: "white",
              textAlign: "center",
              lineHeight: 1.4,
              fontStyle: "italic",
              margin: 0,
              maxWidth: "100%",
            }}
          >
            {quoteElement.content}
          </blockquote>
        )}

        {/* Author / attribution */}
        {authorElement && (
          <div
            style={{
              marginTop: "2.5rem",
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
                fontSize: TYPOGRAPHY.body.secondary,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {authorElement.content}
            </span>
          </div>
        )}
      </FrostedCard>
    </Grid>
  );
};
