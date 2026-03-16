import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

export interface FeatureSlideProps {
  features: FeatureItem[];
  title?: string;
  backgroundColor?: string;
  titleColor?: string;
  featureColor?: string;
  descriptionColor?: string;
}

const FeatureCard: React.FC<{
  feature: FeatureItem;
  index: number;
  titleColor: string;
  descriptionColor: string;
}> = ({ feature, index, titleColor, descriptionColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = index * 5;
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [30, 0]);
  const scale = interpolate(progress, [0, 0.5, 1], [0.9, 1.02, 1]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "20px 30px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        marginBottom: 16,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
      }}
    >
      {feature.icon && (
        <div
          style={{
            fontSize: 40,
            marginRight: 20,
            width: 60,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
          }}
        >
          {feature.icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: titleColor,
            margin: "0 0 8px 0",
          }}
        >
          {feature.title}
        </h3>
        <p
          style={{
            fontSize: 20,
            color: descriptionColor,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {feature.description}
        </p>
      </div>
    </div>
  );
};

export const FeatureSlide: React.FC<FeatureSlideProps> = ({
  features,
  title,
  backgroundColor = "#1a1a1a",
  titleColor = "white",
  featureColor = "#4CAF50",
  descriptionColor = "#aaa",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [-30, 0]);

  const containerStyle: React.CSSProperties = {
    backgroundColor,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
    fontFamily: "sans-serif",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 64,
    fontWeight: "bold",
    color: titleColor,
    marginBottom: 50,
    textAlign: "center",
    opacity: titleOpacity,
    transform: `translateY(${titleY}px)`,
  };

  const featuresContainerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 900,
  };

  return (
    <AbsoluteFill style={containerStyle}>
      {title && <h1 style={titleStyle}>{title}</h1>}
      <div style={featuresContainerStyle}>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            feature={feature}
            index={index}
            titleColor={featureColor}
            descriptionColor={descriptionColor}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
