import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderVideo, type RenderVideoInput } from "../video-renderer.js";

// Mock the spawn function
vi.stubGlobal("spawn", vi.fn());

// Sample script for testing
const sampleScript = {
  title: "Test Video",
  totalDuration: 30,
  scenes: [
    {
      id: "scene-1",
      type: "intro" as const,
      duration: 10,
      narration: "Welcome to the test video",
      annotations: [],
      highlights: [],
      codeHighlights: [],
    },
  ],
};

const sampleScreenshotResources: Record<string, string> = {
  "scene-1": "/path/to/screenshot.png",
};

describe("renderVideo - path handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fs operations
    vi.mock("fs", () => ({
      existsSync: vi.fn().mockReturnValue(true),
      mkdirSync: vi.fn().mockReturnValue(undefined),
      readFileSync: vi.fn().mockReturnValue(Buffer.from("fake-image-data")),
    }));

    // Mock spawn to simulate successful exit
    const mockChild = {
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === "close") {
          setTimeout(() => cb(0), 10);
        }
        return mockChild;
      }),
      stderr: { on: vi.fn() },
    };
    vi.mocked(spawn).mockReturnValue(mockChild as any);

    // Mock process.cwd
    vi.spyOn(process, "cwd").mockReturnValue("/Users/testuser/project");
  });

  it("should pass --root flag pointing to remotionAbsolutePath", async () => {
    const input: RenderVideoInput = {
      script: sampleScript as any,
      screenshotResources: sampleScreenshotResources,
    };

    await renderVideo(input);

    expect(spawn).toHaveBeenCalled();

    const args = spawn.mock.calls[0][1] as string[];

    // Verify --root flag is present
    const rootIndex = args.indexOf("--root");
    expect(rootIndex).toBeGreaterThan(-1);

    // Verify --root points to the correct path (should be packages/renderer/src)
    const rootPath = args[rootIndex + 1];
    expect(rootPath).toContain("packages");
    expect(rootPath).toContain("renderer");
    expect(rootPath).toContain("src");
  });

  it("should use process.cwd() as cwd instead of rendererSrcPath", async () => {
    const input: RenderVideoInput = {
      script: sampleScript as any,
      screenshotResources: sampleScreenshotResources,
    };

    await renderVideo(input);

    expect(spawn).toHaveBeenCalled();

    const spawnOptions = spawn.mock.calls[0][2];
    expect(spawnOptions).toBeDefined();
    expect(spawnOptions.cwd).toBe(process.cwd());
  });

  it("should pass remotion/index.ts as entry point relative to --root", async () => {
    const input: RenderVideoInput = {
      script: sampleScript as any,
      screenshotResources: sampleScreenshotResources,
    };

    await renderVideo(input);

    expect(spawn).toHaveBeenCalled();

    const args = spawn.mock.calls[0][1] as string[];
    expect(args).toContain("remotion/index.ts");
  });
});
