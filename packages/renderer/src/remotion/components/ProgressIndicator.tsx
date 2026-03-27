import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { THEME } from "../theme.js";

interface ProgressIndicatorProps {
  total: number;
  current: number; // 1-based
}

const CIRCLE_SIZE = 48;
const CIRCLE_GAP = 12;

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  total,
  current,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in over first 0.5 seconds
  const opacity = interpolate(frame, [0, Math.round(fps * 0.5)], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        right: 40,
        zIndex: 100,
        opacity,
        display: "flex",
        flexDirection: "row",
        gap: CIRCLE_GAP,
        alignItems: "center",
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const stepNumber = i + 1;
        const isCurrent = stepNumber === current;
        const isCompleted = stepNumber < current;

        return (
          <div
            key={stepNumber}
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              backgroundColor: isCurrent
                ? THEME.accent.yellowMuted
                : "transparent",
              border: `2px solid ${
                isCurrent ? THEME.accent.yellow : THEME.text.muted
              }`,
              color: isCurrent
                ? THEME.accent.yellow
                : isCompleted
                  ? THEME.accent.yellow
                  : THEME.text.muted,
            }}
          >
            {isCompleted ? "✓" : stepNumber}
          </div>
        );
      })}
    </div>
  );
};
