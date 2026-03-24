import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

interface HighlightBoxProps {
  children: React.ReactNode;
  color?: string;
  durationInFrames?: number;
  delay?: number;
}

export const HighlightBox: React.FC<HighlightBoxProps> = ({
  children,
  color = "#ffd700",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const scale = interpolate(progress, [0, 0.5, 1], [0.95, 1.02, 1]);

  return (
    <div
      style={{
        display: "inline-block",
        backgroundColor: `${color}20`,
        borderLeft: `4px solid ${color}`,
        padding: "8px 16px",
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
};

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  style?: React.CSSProperties;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 2,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);
  const charsToShow = Math.floor(adjustedFrame * speed);
  const visibleText = text.slice(0, Math.min(charsToShow, text.length));

  const showCursor = charsToShow < text.length;
  const cursorOpacity = interpolate(
    (adjustedFrame * speed) % (fps * 0.5),
    [0, fps * 0.25, fps * 0.5],
    [1, 0, 1],
  );

  return (
    <span style={style}>
      {visibleText}
      {showCursor && (
        <span
          style={{
            opacity: cursorOpacity,
            borderLeft: "2px solid currentColor",
            marginLeft: 1,
          }}
        >
          &nbsp;
        </span>
      )}
    </span>
  );
};

interface AnimatedNumberProps {
  value: number;
  durationInFrames?: number;
  delay?: number;
  format?: (n: number) => string;
  style?: React.CSSProperties;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  durationInFrames = 30,
  delay = 0,
  format = (n) => n.toString(),
  style,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const currentValue = Math.floor(progress * value);

  return <span style={style}>{format(currentValue)}</span>;
};
