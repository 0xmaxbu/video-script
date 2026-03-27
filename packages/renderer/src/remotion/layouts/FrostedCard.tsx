import React, { ReactNode } from "react";
import { THEME } from "../theme.js";

interface FrostedCardProps {
  children: ReactNode;
  style?: React.CSSProperties;
  blur?: number; // default 25
  radius?: number; // default 32
  zIndex?: number; // default 10
}

export const FrostedCard: React.FC<FrostedCardProps> = ({
  children,
  blur = 25,
  radius = 32,
  zIndex = 10,
  style,
  ...props
}) => (
  <div
    style={{
      backgroundColor: THEME.glass.bg,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`, // Safari
      borderRadius: radius,
      border: `1px solid ${THEME.glass.border}`,
      overflow: "hidden",
      zIndex: zIndex,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);
