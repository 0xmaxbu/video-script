import React from "react";
import { Img, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Grid } from "./Grid.js";
import { FrostedCard } from "./FrostedCard.js";
import { TYPOGRAPHY } from "./grid-utils.js";
import type { LayoutProps } from "./index.js";

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

  const primaryResource = scene.mediaResources.find((r) => r.role === "primary");
  const secondaryResource = scene.mediaResources.find((r) => r.role === "secondary");

  const primaryScreenshot = primaryResource ? screenshots.get(primaryResource.id) : null;
  const secondaryScreenshot = secondaryResource ? screenshots.get(secondaryResource.id) : null;

  const titleElement = scene.textElements.find((t) => t.role === "title");

  const topProgress = spring({ frame, fps, config: { damping: 100, stiffness: 200 } });
  const bottomProgress = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 100, stiffness: 200 } });

  return (
    <Grid>
      {/* 上部分 - 60% - FrostedCard */}
      <FrostedCard
        style={{
          position: "absolute",
          top: 80,
          left: 120,
          width: "calc(100% - 240px)",
          height: "calc(60% - 80px)",
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
          position: "absolute",
          bottom: 80,
          left: 120,
          width: "calc(100% - 240px)",
          height: "calc(40% - 80px)",
          opacity: bottomProgress,
          transform: `translateY(${interpolate(bottomProgress, [0, 1], [30, 0])}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(0,0,0,",
          borderTop: "1px solid rgba(255,255,255,0.1)",
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
        {titleElement && (
          <h2
            style={{
              fontSize: TYPOGRAPHY.title.section,
              fontWeight: "600",
              color: "white",
              textAlign: "center",
            }}
          >
            {titleElement.content}
          </h2>
        )}
      </FrostedCard>
    </Grid>
  );
};
