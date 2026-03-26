import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

interface KineticSubtitleProps {
  text: string;
  wordTimestamps?: Array<{ word: string; start: number; end: number }>;
}

export const KineticSubtitle: React.FC<KineticSubtitleProps> = ({
  text,
  wordTimestamps,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (!text) return null;

  const words = text.split(/\s+/);
  if (words.length === 0) return null;

  if (words.length === 1) {
    return (
      <div style={containerStyle}>
        <span style={activeWordStyle}>{words[0]}</span>
      </div>
    );
  }

  let activeIndex: number;

  if (wordTimestamps && wordTimestamps.length > 0) {
    const currentTime = frame / fps;
    activeIndex = wordTimestamps.findIndex(
      (ts) => currentTime >= ts.start && currentTime < ts.end,
    );
    if (activeIndex === -1) {
      const lastTs = wordTimestamps[wordTimestamps.length - 1];
      activeIndex = currentTime >= lastTs.end ? words.length - 1 : 0;
    }
  } else {
    activeIndex = Math.min(
      Math.floor((frame / durationInFrames) * words.length),
      words.length - 1,
    );
  }

  return (
    <div style={containerStyle}>
      {words.map((word, i) => {
        let style: React.CSSProperties;
        if (i === activeIndex) {
          style = activeWordStyle;
        } else if (i < activeIndex) {
          style = pastWordStyle;
        } else {
          style = futureWordStyle;
        }

        return (
          <span key={i} style={style}>
            {word}
          </span>
        );
      })}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 80,
  left: "50%",
  transform: "translateX(-50%)",
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  padding: "16px 32px",
  borderRadius: 12,
  maxWidth: "80%",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "4px 2px",
};

const baseWordStyle: React.CSSProperties = {
  fontSize: 36,
  fontFamily: "sans-serif",
};

const activeWordStyle: React.CSSProperties = {
  ...baseWordStyle,
  color: "white",
  backgroundColor: "rgba(255, 215, 0, 0.3)",
  borderRadius: 4,
  padding: "2px 6px",
};

const pastWordStyle: React.CSSProperties = {
  ...baseWordStyle,
  color: "rgba(255, 255, 255, 0.5)",
};

const futureWordStyle: React.CSSProperties = {
  ...baseWordStyle,
  color: "rgba(255, 255, 255, 0.25)",
};
