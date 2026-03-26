import React from "react";
import { AbsoluteFill } from "remotion";

export const Subtitle: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 100,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "20px 40px",
          borderRadius: "10px",
          fontSize: 40,
          fontFamily: "sans-serif",
          textAlign: "center",
          maxWidth: "80%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
