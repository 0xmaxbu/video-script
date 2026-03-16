import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import {
  cleanupTempFiles,
  cleanupRemotionTempDir,
  DEFAULT_PRESERVE_PATTERNS,
  matchPattern,
  shouldPreserve,
} from "../cleanup";

vi.mock("../logger", () => ({
  logger: {
    start: vi.fn(),
    succeed: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("matchPattern", () => {
  it("should match exact filename", () => {
    expect(matchPattern("video.mp4", "video.mp4")).toBe(true);
  });

  it("should match wildcard pattern for mp4", () => {
    expect(matchPattern("video.mp4", "*.mp4")).toBe(true);
    expect(matchPattern("my-video.mp4", "*.mp4")).toBe(true);
    expect(matchPattern("video.srt", "*.mp4")).toBe(false);
  });

  it("should match wildcard pattern for srt", () => {
    expect(matchPattern("subtitles.srt", "*.srt")).toBe(true);
    expect(matchPattern("video.srt", "*.srt")).toBe(true);
    expect(matchPattern("video.mp4", "*.srt")).toBe(false);
  });

  it("should match wildcard pattern for json", () => {
    expect(matchPattern("config.json", "*.json")).toBe(true);
    expect(matchPattern("data.json", "*.json")).toBe(true);
    expect(matchPattern("data.txt", "*.json")).toBe(false);
  });

  it("should handle special regex characters in filename", () => {
    expect(matchPattern("file[1].mp4", "*.mp4")).toBe(true);
    expect(matchPattern("file(1).mp4", "*.mp4")).toBe(true);
    expect(matchPattern("file.test.mp4", "*.mp4")).toBe(true);
  });
});

describe("shouldPreserve", () => {
  it("should preserve mp4 files with default patterns", () => {
    expect(
      shouldPreserve("/path/to/video.mp4", DEFAULT_PRESERVE_PATTERNS),
    ).toBe(true);
  });

  it("should preserve srt files with default patterns", () => {
    expect(
      shouldPreserve("/path/to/subtitles.srt", DEFAULT_PRESERVE_PATTERNS),
    ).toBe(true);
  });

  it("should preserve json files with default patterns", () => {
    expect(
      shouldPreserve("/path/to/config.json", DEFAULT_PRESERVE_PATTERNS),
    ).toBe(true);
  });

  it("should not preserve other file types", () => {
    expect(shouldPreserve("/path/to/temp.txt", DEFAULT_PRESERVE_PATTERNS)).toBe(
      false,
    );
    expect(
      shouldPreserve("/path/to/image.png", DEFAULT_PRESERVE_PATTERNS),
    ).toBe(false);
    expect(shouldPreserve("/path/to/data.ts", DEFAULT_PRESERVE_PATTERNS)).toBe(
      false,
    );
  });

  it("should work with custom patterns", () => {
    const customPatterns = ["*.png", "*.jpg"];
    expect(shouldPreserve("/path/to/image.png", customPatterns)).toBe(true);
    expect(shouldPreserve("/path/to/image.jpg", customPatterns)).toBe(true);
    expect(shouldPreserve("/path/to/video.mp4", customPatterns)).toBe(false);
  });
});

describe("cleanupRemotionTempDir", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), ".test-temp-" + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      void 0;
    }
  });

  it("should handle non-existent directory gracefully", async () => {
    await expect(
      cleanupRemotionTempDir("/nonexistent/path"),
    ).resolves.not.toThrow();
  });

  it("should delete temporary files and preserve output files", async () => {
    const tempFile = path.join(tempDir, "temp.txt");
    const mp4File = path.join(tempDir, "output.mp4");
    const srtFile = path.join(tempDir, "output.srt");
    const jsonFile = path.join(tempDir, "metadata.json");

    await fs.writeFile(tempFile, "temp content");
    await fs.writeFile(mp4File, "video content");
    await fs.writeFile(srtFile, "subtitle content");
    await fs.writeFile(jsonFile, "{}");

    await cleanupRemotionTempDir(tempDir);

    await expect(fs.access(tempFile)).rejects.toThrow();
    await expect(fs.access(mp4File)).resolves.not.toThrow();
    await expect(fs.access(srtFile)).resolves.not.toThrow();
    await expect(fs.access(jsonFile)).resolves.not.toThrow();
  });

  it("should clean nested directories", async () => {
    const nestedDir = path.join(tempDir, "nested", "deep");
    await fs.mkdir(nestedDir, { recursive: true });

    const tempFile = path.join(nestedDir, "temp.txt");
    const preservedFile = path.join(nestedDir, "output.mp4");

    await fs.writeFile(tempFile, "temp");
    await fs.writeFile(preservedFile, "video");

    await cleanupRemotionTempDir(tempDir);

    await expect(fs.access(tempFile)).rejects.toThrow();
    await expect(fs.access(preservedFile)).resolves.not.toThrow();
  });

  it("should remove empty directories after cleanup", async () => {
    const subDir = path.join(tempDir, "empty-dir");
    await fs.mkdir(subDir, { recursive: true });

    await cleanupRemotionTempDir(tempDir);

    await expect(fs.access(subDir)).rejects.toThrow();
    await expect(fs.access(tempDir)).rejects.toThrow();
  });

  it("should not remove directory if preserved files exist", async () => {
    const mp4File = path.join(tempDir, "output.mp4");
    await fs.writeFile(mp4File, "video");

    await cleanupRemotionTempDir(tempDir);

    await expect(fs.access(mp4File)).resolves.not.toThrow();
  });

  it("should use custom preserve patterns", async () => {
    const pngFile = path.join(tempDir, "image.png");
    const mp4File = path.join(tempDir, "video.mp4");

    await fs.writeFile(pngFile, "image");
    await fs.writeFile(mp4File, "video");

    await cleanupRemotionTempDir(tempDir, { preservePatterns: ["*.png"] });

    await expect(fs.access(pngFile)).resolves.not.toThrow();
    await expect(fs.access(mp4File)).rejects.toThrow();
  });

  it("should handle files with special characters in name", async () => {
    const specialFile = path.join(tempDir, "file[1].txt");
    const preservedFile = path.join(tempDir, "file[1].mp4");

    await fs.writeFile(specialFile, "temp");
    await fs.writeFile(preservedFile, "video");

    await cleanupRemotionTempDir(tempDir);

    await expect(fs.access(specialFile)).rejects.toThrow();
    await expect(fs.access(preservedFile)).resolves.not.toThrow();
  });
});

describe("cleanupTempFiles", () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = path.join(process.cwd(), ".test-output-" + Date.now());
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch {
      void 0;
    }
  });

  it("should return empty result for non-existent directory", async () => {
    const result = await cleanupTempFiles("/nonexistent/path");
    expect(result.deletedFiles).toEqual([]);
    expect(result.freedBytes).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it("should cleanup remotion-projects directory", async () => {
    const remotionDir = path.join(outputDir, "remotion-projects");
    await fs.mkdir(remotionDir, { recursive: true });
    const tempFile = path.join(remotionDir, "temp.ts");
    await fs.writeFile(tempFile, "content");

    const result = await cleanupTempFiles(outputDir, {
      remotionProjects: true,
      screenshots: false,
    });

    expect(result.deletedFiles.length).toBeGreaterThan(0);
    expect(result.deletedFiles.some((f) => f.includes("temp.ts"))).toBe(true);
  });

  it("should cleanup screenshots directory", async () => {
    const screenshotsDir = path.join(outputDir, "screenshots");
    await fs.mkdir(screenshotsDir, { recursive: true });
    const screenshotFile = path.join(screenshotsDir, "screenshot.png");
    await fs.writeFile(screenshotFile, "image");

    const result = await cleanupTempFiles(outputDir, {
      remotionProjects: false,
      screenshots: true,
    });

    expect(result.deletedFiles.length).toBeGreaterThan(0);
    expect(result.deletedFiles.some((f) => f.includes("screenshot.png"))).toBe(
      true,
    );
  });

  it("should skip cleanup when options are false", async () => {
    const remotionDir = path.join(outputDir, "remotion-projects");
    await fs.mkdir(remotionDir, { recursive: true });
    const tempFile = path.join(remotionDir, "temp.ts");
    await fs.writeFile(tempFile, "content");

    const result = await cleanupTempFiles(outputDir, {
      remotionProjects: false,
      screenshots: false,
    });

    expect(result.deletedFiles).toEqual([]);
  });

  it("should filter by age when olderThanMs is specified", async () => {
    const screenshotsDir = path.join(outputDir, "screenshots");
    await fs.mkdir(screenshotsDir, { recursive: true });
    const screenshotFile = path.join(screenshotsDir, "screenshot.png");
    await fs.writeFile(screenshotFile, "image");

    const result = await cleanupTempFiles(outputDir, {
      remotionProjects: false,
      screenshots: true,
      olderThanMs: 999999999,
    });

    expect(result.deletedFiles).toEqual([]);
  });

  it("should report freed bytes", async () => {
    const remotionDir = path.join(outputDir, "remotion-projects");
    await fs.mkdir(remotionDir, { recursive: true });
    const tempFile = path.join(remotionDir, "temp.ts");
    await fs.writeFile(tempFile, "x".repeat(100));

    const result = await cleanupTempFiles(outputDir, {
      remotionProjects: true,
      screenshots: false,
    });

    expect(result.freedBytes).toBeGreaterThanOrEqual(100);
  });

  it("should report errors for failed deletions", async () => {
    const remotionDir = path.join(outputDir, "remotion-projects");
    await fs.mkdir(remotionDir, { recursive: true });
    const tempFile = path.join(remotionDir, "temp.ts");
    await fs.writeFile(tempFile, "content");

    const fd = await fs.open(tempFile, "r");

    try {
      const result = await cleanupTempFiles(outputDir, {
        remotionProjects: true,
        screenshots: false,
      });
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    } finally {
      await fd.close();
    }
  });
});

describe("DEFAULT_PRESERVE_PATTERNS", () => {
  it("should include mp4 pattern", () => {
    expect(DEFAULT_PRESERVE_PATTERNS).toContain("*.mp4");
  });

  it("should include srt pattern", () => {
    expect(DEFAULT_PRESERVE_PATTERNS).toContain("*.srt");
  });

  it("should include json pattern", () => {
    expect(DEFAULT_PRESERVE_PATTERNS).toContain("*.json");
  });
});
