import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export interface IntroProps {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
}

export const Intro: React.FC<IntroProps> = ({
  title,
  subtitle,
  logoUrl,
  backgroundColor = "#1a1a1a",
  titleColor = "white",
  subtitleColor = "#888",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const titleDelay = 15;
  const titleProgress = spring({
    frame: frame - titleDelay,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const titleOpacity = interpolate(
    frame,
    [titleDelay, titleDelay + 15],
    [0, 1],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    },
  );
  const titleY = interpolate(titleProgress, [0, 1], [50, 0]);

  const subtitleDelay = 30;
  const subtitleOpacity = interpolate(
    frame,
    [subtitleDelay, subtitleDelay + 20],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );
  const subtitleY = interpolate(
    frame,
    [subtitleDelay, subtitleDelay + 25],
    [20, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );

  const endScale = interpolate(frame, [fps * 4, fps * 5], [1, 1.1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const lineDelay = 25;
  const lineProgress = interpolate(frame, [lineDelay, lineDelay + 30], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const containerStyle: React.CSSProperties = {
    backgroundColor,
    color: titleColor,
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
    textAlign: "center",
  };

  const logoStyle: React.CSSProperties = {
    width: 150,
    height: 150,
    marginBottom: 40,
    opacity: logoOpacity,
    transform: `scale(${logoScale})`,
    objectFit: "contain",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 100,
    fontWeight: "bold",
    marginBottom: subtitle ? 30 : 0,
    opacity: titleOpacity,
    transform: `translateY(${titleY}px)`,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 48,
    color: subtitleColor,
    opacity: subtitleOpacity,
    transform: `translateY(${subtitleY}px)`,
  };

  const lineStyle: React.CSSProperties = {
    width: `${lineProgress * 200}px`,
    height: 4,
    backgroundColor: titleColor,
    opacity: 0.6,
    marginTop: 20,
    marginBottom: 20,
  };

  return (
    <AbsoluteFill
      style={{ ...containerStyle, transform: `scale(${endScale})` }}
    >
      {logoUrl && <img src={logoUrl} alt="Logo" style={logoStyle} />}
      <h1 style={titleStyle}>{title}</h1>
      {subtitle && (
        <>
          <div style={lineStyle} />
          <div style={subtitleStyle}>{subtitle}</div>
        </>
      )}
    </AbsoluteFill>
  );
};
