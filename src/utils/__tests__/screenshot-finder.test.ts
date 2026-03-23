import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { findScreenshotFile } from "../screenshot-finder.js";

describe("findScreenshotFile", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "screenshot-test-"));
    mkdirSync(join(testDir, "screenshots"), { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("finds exact match: {layerId}.png", () => {
    const screenshotsDir = join(testDir, "screenshots");
    writeFileSync(join(screenshotsDir, "hero-image.png"), Buffer.alloc(0));
    const result = findScreenshotFile(screenshotsDir, 0, "hero-image");
    expect(result).not.toBeNull();
    expect(result).toContain("hero-image.png");
  });

  it("finds scene-prefixed match: scene-001-{layerId}.png", () => {
    const screenshotsDir = join(testDir, "screenshots");
    writeFileSync(
      join(screenshotsDir, "scene-001-article.png"),
      Buffer.alloc(0),
    );
    const result = findScreenshotFile(screenshotsDir, 0, "article");
    expect(result).not.toBeNull();
    expect(result).toContain("scene-001-article.png");
  });

  it("falls back to any file with scene prefix", () => {
    const screenshotsDir = join(testDir, "screenshots");
    writeFileSync(
      join(screenshotsDir, "scene-002-some-random-name.png"),
      Buffer.alloc(0),
    );
    const result = findScreenshotFile(screenshotsDir, 1, "nonexistent");
    expect(result).not.toBeNull();
    expect(result).toContain("scene-002-some-random-name.png");
  });

  it("returns null when no match found", () => {
    const screenshotsDir = join(testDir, "screenshots");
    const result = findScreenshotFile(screenshotsDir, 0, "nonexistent");
    expect(result).toBeNull();
  });
});
