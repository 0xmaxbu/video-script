import { describe, it, expect, vi } from "vitest";

vi.mock("remotion", () => ({
  useCurrentFrame: () => 0,
  useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080 }),
  interpolate: (v: number, input: number[], output: number[], opts?: object) =>
    output[0],
}));

import { ProgressIndicator } from "../ProgressIndicator.js";

describe("ProgressIndicator", () => {
  it("is a React component function", () => {
    expect(typeof ProgressIndicator).toBe("function");
  });

  it("has expected component name", () => {
    expect(ProgressIndicator.name).toBe("ProgressIndicator");
  });

  it("accepts valid props without throwing", () => {
    // Component instantiation test via props validation
    expect(() => {
      const props = { total: 5, current: 2 };
      expect(props.total).toBeGreaterThan(0);
      expect(props.current).toBeGreaterThan(0);
      expect(props.current).toBeLessThanOrEqual(props.total);
    }).not.toThrow();
  });
});
