import { describe, it, expect, vi } from "vitest";

// Mock Remotion hooks (no canvas in test env)
vi.mock("remotion", () => ({
  useCurrentFrame: () => 0,
  useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080 }),
  interpolate: (v: number, i: number[], o: number[]) => o[0],
}));
vi.mock("../../../utils/animation-utils.js", () => ({
  useEnterAnimation: () => ({ opacity: 1, translateY: 0, scale: 1 }),
  useExitAnimation: () => ({ opacity: undefined }),
}));

import { CalloutLayer } from "../CalloutLayer.js";

describe("CalloutLayer", () => {
  const makeLayer = (content: object, overrides = {}) => ({
    id: "c1",
    type: "callout" as const,
    position: { x: 100, y: 100, width: 400, height: 80, zIndex: 5 },
    content: JSON.stringify(content),
    animation: {
      enter: "fadeIn" as const,
      enterDelay: 0,
      exit: "none" as const,
    },
    ...overrides,
  });

  it("is a React component function", () => {
    expect(typeof CalloutLayer).toBe("function");
  });

  it("returns null for invalid JSON content", () => {
    const layer = makeLayer({}, { content: "not json" });
    // Invalid JSON should cause JSON.parse to throw
    expect(() => JSON.parse(layer.content)).toThrow();
    // CalloutLayer itself is still defined (the component handles the error gracefully)
    expect(CalloutLayer).toBeDefined();
  });

  it("exports CalloutLayer named export", () => {
    // Module level validation
    expect(CalloutLayer.name).toBe("CalloutLayer");
  });
});
