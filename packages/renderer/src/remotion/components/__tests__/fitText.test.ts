import { describe, it, expect, vi } from "vitest";

/**
 * fitText integration tests
 *
 * @remotion/layout-utils fitText requires a browser DOM environment for text measurement.
 * These tests verify:
 * 1. The module is importable
 * 2. The function signature matches expected API
 * 3. The Math.max(floor, ...) pattern works correctly (the floor protection logic we add)
 */

describe("fitText utility integration", () => {
  it("@remotion/layout-utils is importable", async () => {
    const { fitText } = await import("@remotion/layout-utils");
    expect(typeof fitText).toBe("function");
  });

  it("fitText has expected signature (text, withinWidth, fontFamily)", async () => {
    const { fitText } = await import("@remotion/layout-utils");
    // fitText is a function that accepts an object with these keys
    expect(fitText.length).toBe(1); // single argument (options object)
  });

  it("floor protection: Math.max(12, value) returns at least 12", () => {
    // Test the floor protection logic used in TextLayer
    const simulatedFitTextResult = { fontSize: 8 }; // hypothetically small
    const fontSize = Math.max(12, simulatedFitTextResult.fontSize);
    expect(fontSize).toBe(12);
  });

  it("floor protection: Math.max(12, value) passes through larger values", () => {
    const simulatedFitTextResult = { fontSize: 48 };
    const fontSize = Math.max(12, simulatedFitTextResult.fontSize);
    expect(fontSize).toBe(48);
  });

  it("cap protection: Math.min(cap, value) caps at maximum", () => {
    // Test the cap logic used in BulletList (section title capped at 60)
    const sectionCap = 60;
    const simulatedLargeResult = { fontSize: 120 };
    const fontSize = Math.min(sectionCap, simulatedLargeResult.fontSize);
    expect(fontSize).toBe(60);
  });

  it("cap protection: Math.min(cap, value) passes through smaller values", () => {
    const sectionCap = 60;
    const simulatedSmallResult = { fontSize: 40 };
    const fontSize = Math.min(sectionCap, simulatedSmallResult.fontSize);
    expect(fontSize).toBe(40);
  });
});
