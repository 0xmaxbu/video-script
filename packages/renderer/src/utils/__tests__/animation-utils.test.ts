import { describe, it, expect } from "vitest";
import { SPRING_PRESETS, staggerDelay } from "../animation-utils.js";

describe("SPRING_PRESETS", () => {
  it("should have 5 presets: snappy, smooth, soft, punchy, bouncy", () => {
    expect(Object.keys(SPRING_PRESETS)).toHaveLength(5);
    expect(SPRING_PRESETS).toHaveProperty("snappy");
    expect(SPRING_PRESETS).toHaveProperty("smooth");
    expect(SPRING_PRESETS).toHaveProperty("soft");
    expect(SPRING_PRESETS).toHaveProperty("punchy");
    expect(SPRING_PRESETS).toHaveProperty("bouncy");
  });

  it("each preset should have damping and stiffness properties", () => {
    for (const preset of Object.values(SPRING_PRESETS)) {
      expect(preset).toHaveProperty("damping");
      expect(preset).toHaveProperty("stiffness");
      expect(typeof preset.damping).toBe("number");
      expect(typeof preset.stiffness).toBe("number");
    }
  });

  it("snappy should have low damping for quick response", () => {
    expect(SPRING_PRESETS.snappy.damping).toBe(12);
    expect(SPRING_PRESETS.snappy.stiffness).toBe(100);
  });

  it("smooth should have balanced damping and stiffness", () => {
    expect(SPRING_PRESETS.smooth.damping).toBe(100);
    expect(SPRING_PRESETS.smooth.stiffness).toBe(200);
  });

  it("soft should have moderate damping with lower stiffness", () => {
    expect(SPRING_PRESETS.soft.damping).toBe(100);
    expect(SPRING_PRESETS.soft.stiffness).toBe(150);
  });

  it("punchy should have high stiffness for snappy effect", () => {
    expect(SPRING_PRESETS.punchy.damping).toBe(100);
    expect(SPRING_PRESETS.punchy.stiffness).toBe(300);
  });

  it("bouncy should have very low damping for bounce effect", () => {
    expect(SPRING_PRESETS.bouncy.damping).toBe(8);
    expect(SPRING_PRESETS.bouncy.stiffness).toBe(200);
  });
});

describe("staggerDelay", () => {
  it("returns 0 for index 0", () => {
    expect(staggerDelay(0, 10)).toBe(0);
  });

  it("returns correct delay for index 1", () => {
    expect(staggerDelay(1, 10)).toBe(10);
  });

  it("returns correct delay for index 5", () => {
    expect(staggerDelay(5, 10)).toBe(50);
  });

  it("returns correct delay for index 100", () => {
    expect(staggerDelay(100, 10)).toBe(1000);
  });

  it("uses default delayPerItem of 10 when not specified", () => {
    expect(staggerDelay(3)).toBe(30);
  });

  it("works with different delayPerItem values", () => {
    expect(staggerDelay(2, 5)).toBe(10);
    expect(staggerDelay(4, 15)).toBe(60);
    expect(staggerDelay(10, 20)).toBe(200);
  });

  it("is additive across indices", () => {
    const delayPerItem = 10;
    for (let i = 1; i <= 5; i++) {
      expect(staggerDelay(i, delayPerItem)).toBe(i * delayPerItem);
    }
  });
});
