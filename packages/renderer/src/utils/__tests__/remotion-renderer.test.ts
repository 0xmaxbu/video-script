import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @remotion/bundler and @remotion/renderer — real rendering requires a browser
vi.mock("@remotion/bundler", () => ({
  bundle: vi.fn().mockResolvedValue("/tmp/bundle-location"),
}));

vi.mock("@remotion/renderer", () => ({
  selectComposition: vi.fn().mockResolvedValue({
    id: "Video",
    durationInFrames: 300,
    fps: 30,
    width: 1920,
    height: 1080,
  }),
  renderMedia: vi
    .fn()
    .mockImplementation(
      async ({
        onProgress,
      }: {
        onProgress?: (args: {
          renderedFrames: number;
          renderedDoneIn?: number;
        }) => void;
      }) => {
        onProgress?.({ renderedFrames: 300, renderedDoneIn: 1000 });
      },
    ),
}));

vi.mock("../project-generator.js", () => ({
  generateProject: vi.fn().mockResolvedValue({
    projectDir: "/tmp/test-output",
    entryPoint: "/tmp/test-output/src/index.ts",
    compositionId: "Video",
  }),
}));

import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { generateProject } from "../project-generator.js";
import { renderWithNodeRenderer } from "../remotion-renderer.js";

const mockScript = {
  title: "Test",
  totalDuration: 10,
  scenes: [
    {
      id: "s1",
      type: "intro" as const,
      title: "Intro",
      narration: "Hi",
      duration: 10,
    },
  ],
};

describe("renderWithNodeRenderer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls generateProject with correct args", async () => {
    await renderWithNodeRenderer({ script: mockScript, outputDir: "/tmp/out" });
    expect(generateProject).toHaveBeenCalledWith(
      expect.objectContaining({ script: mockScript, outputDir: "/tmp/out" }),
    );
  });

  it("calls bundle with the entry point from generateProject", async () => {
    await renderWithNodeRenderer({ script: mockScript, outputDir: "/tmp/out" });
    expect(bundle).toHaveBeenCalledWith(
      expect.objectContaining({ entryPoint: "/tmp/test-output/src/index.ts" }),
    );
  });

  it("passes webpackOverride that removes @remotion/studio alias", async () => {
    await renderWithNodeRenderer({ script: mockScript, outputDir: "/tmp/out" });
    const call = vi.mocked(bundle).mock.calls[0][0] as {
      webpackOverride?: (c: object) => object;
    };
    const override = call.webpackOverride!;
    const config = {
      resolve: { alias: { "@remotion/studio": "dist/index.js", other: "x" } },
    };
    const result = override(config) as typeof config;
    expect(result.resolve.alias["@remotion/studio"]).toBeUndefined();
    expect(result.resolve.alias["other"]).toBe("x");
  });

  it("calls selectComposition with bundle location and compositionId", async () => {
    await renderWithNodeRenderer({ script: mockScript, outputDir: "/tmp/out" });
    expect(selectComposition).toHaveBeenCalledWith(
      expect.objectContaining({
        serveUrl: "/tmp/bundle-location",
        id: "Video",
      }),
    );
  });

  it("calls renderMedia with codec h264", async () => {
    await renderWithNodeRenderer({ script: mockScript, outputDir: "/tmp/out" });
    expect(renderMedia).toHaveBeenCalledWith(
      expect.objectContaining({ codec: "h264" }),
    );
  });

  it("returns success: true with correct shape", async () => {
    const result = await renderWithNodeRenderer({
      script: mockScript,
      outputDir: "/tmp/out",
    });
    expect(result.success).toBe(true);
    expect(result.fps).toBe(30);
    expect(result.resolution).toEqual({ width: 1920, height: 1080 });
    expect(result.videoPath).toContain("video.mp4");
  });

  it("reports progress from 0 to 100", async () => {
    const progress: number[] = [];
    await renderWithNodeRenderer({
      script: mockScript,
      outputDir: "/tmp/out",
      onProgress: (p) => progress.push(p),
    });
    // Should have reported values in 30–100 range (render phase)
    expect(progress.some((p) => p >= 30)).toBe(true);
    expect(progress.every((p) => p <= 100)).toBe(true);
  });
});
