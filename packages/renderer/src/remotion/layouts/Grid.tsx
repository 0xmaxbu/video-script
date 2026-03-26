import React, { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { GRID_CONSTANTS } from "./grid-utils.js";

interface GridProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

export const Grid: React.FC<GridProps> = ({ children, style }) => {
  return (
    <AbsoluteFill
      style={{
        paddingTop: GRID_CONSTANTS.safeZone.top,
        paddingBottom: GRID_CONSTANTS.safeZone.bottom,
        paddingLeft: GRID_CONSTANTS.safeZone.left,
        paddingRight: GRID_CONSTANTS.safeZone.right,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
