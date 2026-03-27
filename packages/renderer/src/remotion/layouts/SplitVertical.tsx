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
import { TYPOGRAPHY } from "./grid-utils.js";
import { THEME } from "../theme.js";
import type { LayoutProps } from "./index.js";
import type {
  ScreenshotResource,
  TextElement,
} from "../../utils/sceneAdapter.js";

/**
 * Split Vertical Layout
 *
 * 上下分屏 (60/40)
 * 适合：代码 + 解释
 */
export const SplitVertical: React.FC<LayoutProps> = ({
  scene,
  screenshots,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const primaryResource = scene.mediaResources.find(
    (r: ScreenshotResource) => r.role === "primary",
  );
  const secondaryResource = scene.mediaResources.find(
    (r: ScreenshotResource) => r.role === "secondary",
  );

  const primaryScreenshot = primaryResource
    ? screenshots.get(primaryResource.id)
    : null;
  const secondaryScreenshot = secondaryResource
    ? screenshots.get(secondaryResource.id)
    : null;

  const titleElement = scene.textElements.find(
    (t: TextElement) => t.role === "title",
  );
  const bottomTextElements = scene.textElements.filter(
    (t: TextElement) => t.role === "bullet" || t.position === "bottom",
  );

  const topProgress = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });
  const bottomProgress = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return (
    <Grid>
      {/* Full-bleed dark background */}
      <AbsoluteFill style={{ backgroundColor: THEME.bg.primary }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "80px 120px",
          gap: "1rem",
        }}
      >
        {/* 上部分 - 60% - FrostedCard */}
        <FrostedCard
          style={{
            flex: 6,
            opacity: topProgress,
            transform: `translateY(${interpolate(topProgress, [0, 1], [-30, 0])}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {primaryScreenshot && (
            <Img
              src={primaryScreenshot}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          )}
        </FrostedCard>

        {/* 下部分 - 40% - FrostedCard */}
        <FrostedCard
          style={{
            flex: 4,
            opacity: bottomProgress,
            transform: `translateY(${interpolate(bottomProgress, [0, 1], [30, 0])}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            borderTop: `1px solid ${THEME.glass.border}`,
          }}
        >
          {secondaryScreenshot && (
            <Img
              src={secondaryScreenshot}
              style={{
                maxWidth: "100%",
                maxHeight: "60%",
                objectFit: "contain",
                marginBottom: "1rem",
              }}
            />
          )}
          {bottomTextElements.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                width: "100%",
              }}
            >
              {bottomTextElements.map((text: TextElement, index: number) => (
                <p
                  key={index}
                  style={{
                    fontSize: TYPOGRAPHY.body.primary,
                    color: THEME.text.primary,
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {text.content}
                </p>
              ))}
            </div>
          ) : (
            titleElement && (
              <h2
                style={{
                  fontSize: TYPOGRAPHY.title.section,
                  fontWeight: "600",
                  color: THEME.text.primary,
                  textAlign: "center",
                }}
              >
                {titleElement.content}
              </h2>
            )
          )}
        </FrostedCard>
      </div>
    </Grid>
  );
};
