import { describe, it, expect } from "vitest";
import { THEME } from "../theme.js";

describe("THEME", () => {
  it("has correct primary background", () => {
    expect(THEME.bg.primary).toBe("#0a0a0a");
  });
  it("has correct yellow accent", () => {
    expect(THEME.accent.yellow).toBe("#FFD700");
  });
  it("has correct glass bg", () => {
    expect(THEME.glass.bg).toBe("rgba(255,255,255,0.05)");
  });
  it("has all required color groups", () => {
    expect(THEME).toHaveProperty("bg");
    expect(THEME).toHaveProperty("text");
    expect(THEME).toHaveProperty("accent");
    expect(THEME).toHaveProperty("glass");
  });
});
