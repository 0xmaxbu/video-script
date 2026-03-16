import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface CodeAnimationProps {
  code: string;
  highlightLines?: number[];
  typewriterSpeed?: number;
  scrollSpeed?: number;
  showLineNumbers?: boolean;
  title?: string;
}

export const CodeAnimation: React.FC<CodeAnimationProps> = ({
  code,
  highlightLines = [],
  typewriterSpeed = 2,
  scrollSpeed = 1,
  showLineNumbers = true,
  title,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = code.split("\n");
  const totalChars = code.length;

  const charsRevealed = Math.floor(
    interpolate(frame, [0, totalChars * typewriterSpeed], [0, totalChars], {
      extrapolateRight: "clamp",
    }),
  );

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

  const scrollY = interpolate(
    frame,
    [0, lines.length * scrollSpeed * fps * 0.5],
    [0, Math.max(0, (lines.length - 15) * 28)],
    { extrapolateRight: "clamp" },
  );

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

  const codeContainerStyle: React.CSSProperties = {
    transform: `translateY(-${scrollY}px)`,
    transition: "transform 0.1s ease-out",
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
          const isHighlighted = highlightLines.includes(index + 1);
          const lineNumber = index + 1;

          const highlightSpring = spring({
            frame: frame - index * typewriterSpeed,
            fps,
            config: {
              damping: 12,
              stiffness: 200,
            },
          });

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
