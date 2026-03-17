import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

type TransitionType =
  | "fade"
  | "slideLeft"
  | "slideRight"
  | "slideUp"
  | "slideDown"
  | "zoom"
  | "wipe";

interface TransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  durationInFrames?: number;
  enter?: boolean;
  exit?: boolean;
  delay?: number;
}

export const Transition: React.FC<TransitionProps> = ({
  children,
  type = "fade",
  durationInFrames = 30,
  enter = true,
  exit = true,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: totalFrames } = useVideoConfig();

  const adjustedFrame = frame - delay;
  const exitStart = totalFrames - durationInFrames;

  const getTransitionStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};

    const enterProgress = interpolate(
      adjustedFrame,
      [0, durationInFrames],
      [0, 1],
      {
        extrapolateRight: "clamp",
        extrapolateLeft: "clamp",
      },
    );

    const exitProgress = interpolate(frame, [exitStart, totalFrames], [0, 1], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    });

    const progress =
      enter && !exit
        ? enterProgress
        : !enter && exit
          ? exitProgress
          : adjustedFrame < durationInFrames
            ? enterProgress
            : frame > exitStart
              ? 1 - exitProgress
              : 1;

    switch (type) {
      case "fade":
        styles.opacity = progress;
        break;

      case "slideLeft":
        styles.transform = `translateX(${interpolate(progress, [0, 1], [100, 0])}px)`;
        styles.opacity = progress;
        break;

      case "slideRight":
        styles.transform = `translateX(${interpolate(progress, [0, 1], [-100, 0])}px)`;
        styles.opacity = progress;
        break;

      case "slideUp":
        styles.transform = `translateY(${interpolate(progress, [0, 1], [100, 0])}px)`;
        styles.opacity = progress;
        break;

      case "slideDown":
        styles.transform = `translateY(${interpolate(progress, [0, 1], [-100, 0])}px)`;
        styles.opacity = progress;
        break;

      case "zoom":
        styles.transform = `scale(${interpolate(progress, [0, 1], [0.5, 1])})`;
        styles.opacity = progress;
        break;

      case "wipe":
        styles.clipPath = `inset(0 ${interpolate(progress, [0, 1], [100, 0])}% 0 0)`;
        break;
    }

    return styles;
  };

  return <AbsoluteFill style={getTransitionStyles()}>{children}</AbsoluteFill>;
};

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
        transition: "transform 0.1s ease-out",
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
