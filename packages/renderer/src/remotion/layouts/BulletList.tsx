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
import { TYPOGRAPHY, getGridSpanPx, GRID_CONSTANTS } from "./grid-utils.js";
import { THEME } from "../theme.js";
import { staggerDelay, SPRING_PRESETS } from "../../utils/animation-utils.js";
import type { LayoutProps } from "./index.js";
import type { TextElement } from "../../utils/sceneAdapter.js";

/**
 * Bullet List Layout
 *
 * 要点列表布局
 * 适合：总结、特性列表
 *
 * Refactored to use Grid wrapper and FrostedCard for consistent layout system.
 */
export const BulletList: React.FC<LayoutProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleElement = scene.textElements.find(
    (t: TextElement) => t.role === "title",
  );
  const bulletElements = scene.textElements.filter(
    (t: TextElement) => t.role === "bullet",
  );

  const usableWidth = getGridSpanPx(12);
  const usableHeight =
    GRID_CONSTANTS.height -
    GRID_CONSTANTS.safeZone.top -
    GRID_CONSTANTS.safeZone.bottom;

  return (
    <Grid>
      {/* Full-bleed dark background */}
      <AbsoluteFill
        style={{
          backgroundColor: THEME.bg.primary,
        }}
      />

      {/* FrostedCard container for the bullet list */}
      <FrostedCard
        style={{
          position: "absolute",
          top: GRID_CONSTANTS.safeZone.top,
          left: GRID_CONSTANTS.safeZone.left,
          width: usableWidth,
          height: usableHeight,
          opacity: 0.85,
          padding: "2.5rem 3rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title */}
        {titleElement && (
          <h1
            style={{
              fontSize: TYPOGRAPHY.title.section,
              fontWeight: "bold",
              color: THEME.text.primary,
              marginBottom: "2rem",
              lineHeight: 1.2,
              flexShrink: 0,
            }}
          >
            {titleElement.content}
          </h1>
        )}

        {/* Bullet list */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: "1.5rem",
          }}
        >
          {bulletElements.map((bullet: TextElement, index: number) => {
            const bulletFrame = Math.max(0, frame - staggerDelay(index, 10));
            const bulletProgress = spring({
              frame: bulletFrame,
              fps,
              config: SPRING_PRESETS.smooth,
            });

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  opacity: bulletProgress,
                  transform: `translateX(${interpolate(
                    bulletProgress,
                    [0, 1],
                    [-30, 0],
                  )}px)`,
                }}
              >
                {/* Bullet dot */}
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: THEME.accent.blue,
                    marginRight: "1.25rem",
                    flexShrink: 0,
                  }}
                />
                {/* Bullet text */}
                <span
                  style={{
                    fontSize: TYPOGRAPHY.body.primary,
                    color: THEME.text.primary,
                    lineHeight: 1.4,
                  }}
                >
                  {bullet.content}
                </span>
              </div>
            );
          })}
        </div>
      </FrostedCard>
    </Grid>
  );
};
