import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { generateProject } from "../project-generator.js";

// Mock execSync so tests don't actually run npm install
vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

const mockScript = {
  title: "Test Video",
  totalDuration: 10,
  scenes: [
    {
      id: "s1",
      type: "intro" as const,
      title: "Intro",
      narration: "Hello world",
      duration: 10,
    },
  ],
};

describe("generateProject", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vid-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("generates project directly at outputDir (no .remotion-project subdir)", async () => {
    await generateProject({ script: mockScript, outputDir: tmpDir });
    expect(fs.existsSync(path.join(tmpDir, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, ".remotion-project"))).toBe(false);
  });

  it("generated package.json uses file: protocol for @video-script/renderer", async () => {
    await generateProject({ script: mockScript, outputDir: tmpDir });
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, "package.json"), "utf8"),
    );
    expect(pkg.dependencies["@video-script/renderer"]).toMatch(/^file:/);
  });

  it("generates src/index.ts that calls registerRoot", async () => {
    await generateProject({ script: mockScript, outputDir: tmpDir });
    const index = fs.readFileSync(path.join(tmpDir, "src", "index.ts"), "utf8");
    expect(index).toContain("registerRoot");
    expect(index).toContain("RemotionRoot");
  });

  it("generates src/Root.tsx importing from @video-script/renderer", async () => {
    await generateProject({ script: mockScript, outputDir: tmpDir });
    const root = fs.readFileSync(path.join(tmpDir, "src", "Root.tsx"), "utf8");
    expect(root).toContain("from '@video-script/renderer'");
    expect(root).toContain("VideoComposition");
    expect(root).toContain("Test Video"); // script title embedded
  });

  it("returns correct compositionId and entryPoint", async () => {
    const result = await generateProject({
      script: mockScript,
      outputDir: tmpDir,
    });
    expect(result.compositionId).toBe("Video");
    expect(result.entryPoint).toBe(path.join(tmpDir, "src", "index.ts"));
    expect(result.projectDir).toBe(tmpDir);
  });

  it("does NOT generate index.tsx (Playwright-specific)", async () => {
    await generateProject({ script: mockScript, outputDir: tmpDir });
    expect(fs.existsSync(path.join(tmpDir, "src", "index.tsx"))).toBe(false);
  });

  it("does NOT generate remotion.config.ts", async () => {
    await generateProject({ script: mockScript, outputDir: tmpDir });
    expect(fs.existsSync(path.join(tmpDir, "remotion.config.ts"))).toBe(false);
  });

  it("calls npm install in the project dir", async () => {
    const { execSync } = await import("node:child_process");
    await generateProject({ script: mockScript, outputDir: tmpDir });
    expect(execSync).toHaveBeenCalledWith(
      "npm install --legacy-peer-deps",
      expect.objectContaining({ cwd: tmpDir }),
    );
  });
});
