import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * Zoom/Pan keyframe for camera-style code animation.
 * Defines scale and pan values at a specific frame.
 */
interface ZoomPanKeyframe {
  frame: number;
  scale: number;
  panX: number;
  panY: number;
}

interface CodeAnimationProps {
  code: string;
  highlightLines?: number[];
  typewriterSpeed?: number; // Will be overridden by dynamic calculation if sceneDuration provided
  showLineNumbers?: boolean;
  title?: string;
  sceneDuration?: number; // For dynamic typewriter speed calculation (in seconds)
  zoomPanKeyframes?: ZoomPanKeyframe[]; // Camera zoom/pan data
}

/**
 * Calculate typewriter speed dynamically based on code length and scene duration.
 * Ensures all code is revealed within scene bounds with 20% buffer for settling.
 * Per D-08: Speed = chars per frame, minimum 1
 *
 * @param codeLength - Total characters in code
 * @param sceneDurationFrames - Scene duration in frames
 * @returns Characters to reveal per frame
 */
const calculateTypewriterSpeed = (
  codeLength: number,
  sceneDurationFrames: number,
): number => {
  // Reserve 20% of scene for settling/pause after reveal
  const effectiveFrames = sceneDurationFrames * 0.8;
  // Speed = chars per frame, minimum 1
  return Math.max(1, Math.ceil(codeLength / effectiveFrames));
};

export const CodeAnimation: React.FC<CodeAnimationProps> = ({
  code,
  highlightLines = [],
  typewriterSpeed: fixedSpeed,
  showLineNumbers = true,
  title,
  sceneDuration,
  zoomPanKeyframes = [], // Default: no zoom/pan
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const lines = code.split("\n");
  const totalChars = code.length;

  // Calculate dynamic speed if sceneDuration provided, else use fixed
  const sceneFrames = sceneDuration
    ? Math.ceil(sceneDuration * fps)
    : durationInFrames;
  const speed = fixedSpeed || calculateTypewriterSpeed(totalChars, sceneFrames);

  // Zoom/pan interpolation with defaults
  const defaultScale = 1.0;
  const defaultPanX = 0;
  const defaultPanY = 0;

  // Interpolate scale from keyframes
  const scale =
    zoomPanKeyframes.length > 0
      ? interpolate(
          frame,
          zoomPanKeyframes.map((k) => k.frame),
          zoomPanKeyframes.map((k) => k.scale),
          { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
        )
      : defaultScale;

  // Interpolate panX from keyframes
  const panX =
    zoomPanKeyframes.length > 0
      ? interpolate(
          frame,
          zoomPanKeyframes.map((k) => k.frame),
          zoomPanKeyframes.map((k) => k.panX),
          { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
        )
      : defaultPanX;

  // Interpolate panY from keyframes
  const panY =
    zoomPanKeyframes.length > 0
      ? interpolate(
          frame,
          zoomPanKeyframes.map((k) => k.frame),
          zoomPanKeyframes.map((k) => k.panY),
          { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
        )
      : defaultPanY;

  const charsRevealed = Math.floor(
    interpolate(frame, [0, totalChars * speed], [0, totalChars], {
      extrapolateRight: "clamp",
    }),
  );

  // Track if code is fully revealed for delayed highlighting (D-10)
  const isCodeFullyRevealed = charsRevealed >= totalChars;

  const getVisibleCode = () => {
    let charCount = 0;
    const visibleLines: {
      line: string;
      visibleChars: number;
      index: number;
    }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (charCount + line.length + 1 <= charsRevealed) {
        visibleLines.push({ line, visibleChars: line.length, index: i });
        charCount += line.length + 1;
      } else {
        const remaining = charsRevealed - charCount;
        if (remaining > 0) {
          visibleLines.push({
            line,
            visibleChars: remaining,
            index: i,
          });
        }
        break;
      }
    }

    return visibleLines;
  };

  const visibleLines = getVisibleCode();

  const containerStyle: React.CSSProperties = {
    backgroundColor: "#1e1e1e",
    fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
    fontSize: 22,
    lineHeight: 1.6,
    padding: 30,
    borderRadius: 8,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
  };

  // Camera zoom/pan transform using Remotion interpolate (no CSS transition)
  // Per D-09: zoom/pan creates camera-style effect
  const codeContainerStyle: React.CSSProperties = {
    transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
    // NOTE: Spring animations may need 30-frame settling buffer for final render
    // Parent component should extend scene duration by 30 frames if needed (D-11)
  };

  const lineStyle = (isHighlighted: boolean): React.CSSProperties => ({
    display: "flex",
    padding: "2px 0",
    backgroundColor: isHighlighted ? "rgba(255, 215, 0, 0.15)" : "transparent",
    borderLeft: isHighlighted ? "3px solid #ffd700" : "3px solid transparent",
    paddingLeft: 10,
    marginLeft: -13,
  });

  const lineNumberStyle: React.CSSProperties = {
    color: "#858585",
    width: 40,
    textAlign: "right",
    paddingRight: 15,
    userSelect: "none",
    flexShrink: 0,
  };

  const codeTextStyle: React.CSSProperties = {
    color: "#d4d4d4",
    whiteSpace: "pre",
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    color: "#569cd6",
    fontSize: 18,
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: "1px solid #404040",
  };

  const cursorOpacity = interpolate(
    frame % (fps * 0.5),
    [0, fps * 0.25, fps * 0.5],
    [1, 0, 1],
  );

  return (
    <AbsoluteFill style={containerStyle}>
      {title && <div style={titleStyle}>{title}</div>}
      <div style={codeContainerStyle}>
        {visibleLines.map(({ line, visibleChars, index }) => {
          // Per D-10: Line highlighting is delayed until after code fully reveals
          const isHighlighted =
            isCodeFullyRevealed && highlightLines.includes(index + 1);
          const lineNumber = index + 1;

          // Highlight spring only triggers after full reveal (D-10)
          const highlightSpring = isHighlighted
            ? spring({
                frame: frame - totalChars * speed, // Delay until after reveal
                fps,
                config: {
                  damping: 100,
                  stiffness: 200,
                },
              })
            : 0;

          const highlightScale = isHighlighted
            ? interpolate(highlightSpring, [0, 1], [0.98, 1])
            : 1;

          return (
            <div
              key={index}
              style={{
                ...lineStyle(isHighlighted),
                transform: `scaleX(${highlightScale})`,
              }}
            >
              {showLineNumbers && (
                <span style={lineNumberStyle}>{lineNumber}</span>
              )}
              <span style={codeTextStyle}>
                {line.slice(0, visibleChars)}
                {visibleChars < line.length && (
                  <span
                    style={{
                      opacity: cursorOpacity,
                      color: "#ffffff",
                    }}
                  >
                    |
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {visibleLines.length < lines.length && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: "linear-gradient(transparent, rgba(30, 30, 30, 0.95))",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// Export ZoomPanKeyframe type for external use
export type { ZoomPanKeyframe };
