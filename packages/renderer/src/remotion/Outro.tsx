import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export interface OutroProps {
  thankYouText?: string;
  contactInfo?: {
    email?: string;
    website?: string;
    github?: string;
    twitter?: string;
  };
  channelName?: string;
  backgroundColor?: string;
}

export const Outro: React.FC<OutroProps> = ({
  thankYouText = "感谢观看",
  contactInfo = {},
  channelName,
  backgroundColor = "#1a1a1a",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const thankYouY = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const thankYouOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const thankYouScale = interpolate(thankYouY, [0, 1], [0.8, 1]);

  const contactDelay = 20;
  const contactOpacity = interpolate(
    frame,
    [contactDelay, contactDelay + 15],
    [0, 1],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    },
  );
  const contactY = interpolate(
    frame,
    [contactDelay, contactDelay + 20],
    [30, 0],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    },
  );

  const channelDelay = 35;
  const channelOpacity = interpolate(
    frame,
    [channelDelay, channelDelay + 15],
    [0, 1],
    {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    },
  );

  const endScale = interpolate(frame, [fps * 3.5, fps * 4], [1, 1.1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const containerStyle: React.CSSProperties = {
    backgroundColor,
    color: "white",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
    textAlign: "center",
  };

  const thankYouStyle: React.CSSProperties = {
    fontSize: 100,
    fontWeight: "bold",
    marginBottom: 60,
    opacity: thankYouOpacity,
    transform: `translateY(${(1 - thankYouY) * 50}px) scale(${thankYouScale})`,
  };

  const channelStyle: React.CSSProperties = {
    fontSize: 48,
    color: "#888",
    marginBottom: 40,
    opacity: channelOpacity,
  };

  const contactContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    opacity: contactOpacity,
    transform: `translateY(${contactY}px)`,
  };

  const contactItemStyle: React.CSSProperties = {
    fontSize: 32,
    color: "#ccc",
  };

  const renderContactItems = () => {
    const items: React.ReactNode[] = [];

    if (contactInfo.email) {
      items.push(
        <div key="email" style={contactItemStyle}>
          📧 {contactInfo.email}
        </div>,
      );
    }

    if (contactInfo.website) {
      items.push(
        <div key="website" style={contactItemStyle}>
          🌐 {contactInfo.website}
        </div>,
      );
    }

    if (contactInfo.github) {
      items.push(
        <div key="github" style={contactItemStyle}>
          💻 github.com/{contactInfo.github}
        </div>,
      );
    }

    if (contactInfo.twitter) {
      items.push(
        <div key="twitter" style={contactItemStyle}>
          🐦 @{contactInfo.twitter}
        </div>,
      );
    }

    return items.length > 0 ? items : null;
  };

  return (
    <AbsoluteFill
      style={{ ...containerStyle, transform: `scale(${endScale})` }}
    >
      <h1 style={thankYouStyle}>{thankYouText}</h1>
      {channelName && <div style={channelStyle}>{channelName}</div>}
      <div style={contactContainerStyle}>{renderContactItems()}</div>
    </AbsoluteFill>
  );
};
