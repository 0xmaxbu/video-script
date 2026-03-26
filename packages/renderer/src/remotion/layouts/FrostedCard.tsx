import React, { ReactNode } from "react";

interface FrostedCardProps {
  children: ReactNode;
  style?: React.CSSProperties;
  opacity?: number; // default 0.2 (20%)
  blur?: number; // default 25
  radius?: number; // default 32
  color?: string; // default "rgba(255,255,255," (light theme)
  zIndex?: number; // default 10 (per D-01)
}

export const FrostedCard: React.FC<FrostedCardProps> = ({
  children,
  opacity = 0.2,
  blur = 25,
  radius = 32,
  color = "rgba(255,255,255,",
  zIndex = 10,
  style,
  ...props
}) => (
  <div
    style={{
      backgroundColor: `${color}${opacity})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`, // Safari
      borderRadius: radius,
      border: "1px solid rgba(255,255,255,0.1)",
      overflow: "hidden",
      zIndex: zIndex,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);
