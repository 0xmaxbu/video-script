import { describe, it, expect } from "vitest";
import { mapLayoutToComponent, secondsToFrames } from "../compose-helpers.js";

describe("mapLayoutToComponent", () => {
  it("maps hero-fullscreen to HeroFullscreen", () => {
    expect(mapLayoutToComponent("hero-fullscreen")).toBe("HeroFullscreen");
  });
  it("maps split-vertical to SplitVertical", () => {
    expect(mapLayoutToComponent("split-vertical")).toBe("SplitVertical");
  });
  it("maps split-horizontal to SplitHorizontal", () => {
    expect(mapLayoutToComponent("split-horizontal")).toBe("SplitHorizontal");
  });
  it("maps text-over-image to TextOverImage", () => {
    expect(mapLayoutToComponent("text-over-image")).toBe("TextOverImage");
  });
  it("maps code-focus to CodeFocus", () => {
    expect(mapLayoutToComponent("code-focus")).toBe("CodeFocus");
  });
  it("maps comparison to Comparison", () => {
    expect(mapLayoutToComponent("comparison")).toBe("Comparison");
  });
  it("maps bullet-list to BulletList", () => {
    expect(mapLayoutToComponent("bullet-list")).toBe("BulletList");
  });
  it("maps quote to Quote", () => {
    expect(mapLayoutToComponent("quote")).toBe("Quote");
  });
  it("returns HeroFullscreen for unknown template", () => {
    expect(mapLayoutToComponent("unknown-template")).toBe("HeroFullscreen");
  });
});

describe("secondsToFrames", () => {
  it("converts 10 seconds at 30fps to 300 frames", () => {
    expect(secondsToFrames(10, 30)).toBe(300);
  });
  it("converts 0 seconds to 0 frames", () => {
    expect(secondsToFrames(0, 30)).toBe(0);
  });
  it("converts 5.5 seconds at 30fps to 165 frames", () => {
    expect(secondsToFrames(5.5, 30)).toBe(165);
  });
  it("uses default 30fps when not specified", () => {
    expect(secondsToFrames(1)).toBe(30);
  });
});
