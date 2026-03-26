import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "child_process";
import { join } from "path";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";

const PROJECT_ROOT = process.cwd();
const CLI_PATH = join(PROJECT_ROOT, "dist/cli/index.js");
const RENDERER_DIST = join(PROJECT_ROOT, "packages/renderer/dist");

describe("Video Generation E2E - Compose Pipeline", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = join(tmpdir(), `video-script-e2e-${Date.now()}`);
    mkdirSync(testProjectDir, { recursive: true });
    mkdirSync(join(testProjectDir, "screenshots"), { recursive: true });
  });

  afterAll(() => {
    if (existsSync(testProjectDir)) {
      rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  describe("Step 1: Script Validation", () => {
    it("should have valid script.json fixture", () => {
      const scriptPath = join(
        PROJECT_ROOT,
        "tests/e2e/video-playback-test/script.json",
      );
      expect(existsSync(scriptPath)).toBe(true);
      const script = JSON.parse(readFileSync(scriptPath, "utf-8"));
      expect(script.title).toBe("Understanding TypeScript Generics");
      expect(script.scenes).toHaveLength(3);
      expect(script.scenes[0].type).toBe("intro");
      expect(script.scenes[1].type).toBe("feature");
      expect(script.scenes[1].visualLayers).toHaveLength(1);
      expect(script.scenes[1].visualLayers[0].type).toBe("code");
      expect(script.scenes[2].type).toBe("outro");
    });
  });

  describe("Step 2: CLI Compose Command", () => {
    it("should show compose command help", async () => {
      const result = await runCLI(["compose", "--help"], 15000);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("compose");
      expect(result.stdout).toContain("script.json");
    });

    it("should fail gracefully when screenshots dir is missing", async () => {
      const noScreenshotsDir = join(tmpdir(), `no-screenshots-${Date.now()}`);
      mkdirSync(noScreenshotsDir, { recursive: true });
      writeFileSync(
        join(noScreenshotsDir, "script.json"),
        JSON.stringify(
          {
            title: "Test",
            totalDuration: 10,
            scenes: [
              {
                id: "s1",
                type: "intro",
                title: "Test",
                narration: "Test",
                duration: 10,
              },
            ],
          },
          null,
          2,
        ),
      );

      const result = await runCLI(["compose", noScreenshotsDir], 30000);
      rmSync(noScreenshotsDir, { recursive: true, force: true });
      expect(result.exitCode).toBe(1);
    });
  });

  describe("Step 3: scene-adapter with visualLayers", () => {
    it("should convert mediaResources to visualLayers with type screenshot", async () => {
      const { adaptSceneForRenderer } = await import(
        join(PROJECT_ROOT, "dist/utils/scene-adapter.js")
      );

      const baseScene = {
        id: "scene-1",
        type: "intro" as const,
        title: "Test",
        narration: "Test narration",
        duration: 10,
        visualLayers: [] as any[],
      };

      const visualScene = {
        sceneId: "scene-1",
        mediaResources: [
          {
            id: "hero-image",
            type: "hero" as const,
            url: "https://example.com/hero.png",
            role: "primary" as const,
            narrationBinding: {
              triggerText: "welcome",
              segmentIndex: 0,
              appearAt: 0,
            },
          },
        ],
      };

      const result = adaptSceneForRenderer(baseScene, visualScene);
      expect(result.visualLayers).toHaveLength(1);
      expect(result.visualLayers![0].type).toBe("screenshot");
      expect(result.visualLayers![0].content).toBe(
        "https://example.com/hero.png",
      );
      expect(result.visualLayers![0].animation.enterDelay).toBe(0);
    });

    it("should convert textElements to visualLayers with type text", async () => {
      const { adaptSceneForRenderer } = await import(
        join(PROJECT_ROOT, "dist/utils/scene-adapter.js")
      );

      const baseScene = {
        id: "scene-1",
        type: "feature" as const,
        title: "Test",
        narration: "Test narration",
        duration: 10,
        visualLayers: [] as any[],
      };

      const visualScene = {
        sceneId: "scene-1",
        textElements: [
          {
            content: "Welcome",
            role: "title" as const,
            position: "top" as const,
            narrationBinding: {
              triggerText: "welcome",
              segmentIndex: 0,
              appearAt: 1.5,
            },
          },
        ],
      };

      const result = adaptSceneForRenderer(baseScene, visualScene);
      expect(result.visualLayers).toHaveLength(1);
      expect(result.visualLayers![0].type).toBe("text");
      expect(result.visualLayers![0].content).toBe("Welcome");
      expect(result.visualLayers![0].position.x).toBe("center");
      expect(result.visualLayers![0].position.y).toBe("top");
    });

    it("should map all 5 text positions correctly", async () => {
      const { adaptSceneForRenderer } = await import(
        join(PROJECT_ROOT, "dist/utils/scene-adapter.js")
      );

      const positions = [
        { pos: "left" as const, expectX: "left", expectY: "center" },
        { pos: "right" as const, expectX: "right", expectY: "center" },
        { pos: "top" as const, expectX: "center", expectY: "top" },
        { pos: "center" as const, expectX: "center", expectY: "center" },
        { pos: "bottom" as const, expectX: "center", expectY: "bottom" },
      ];

      for (const { pos, expectX, expectY } of positions) {
        const baseScene = {
          id: "scene-1",
          type: "feature" as const,
          title: "Test",
          narration: "Test",
          duration: 10,
          visualLayers: [] as any[],
        };

        const visualScene = {
          sceneId: "scene-1",
          textElements: [
            {
              content: "Test",
              role: "bullet" as const,
              position: pos,
              narrationBinding: {
                triggerText: "test",
                segmentIndex: 0,
                appearAt: 0,
              },
            },
          ],
        };

        const result = adaptSceneForRenderer(baseScene, visualScene);
        expect(result.visualLayers![0].position.x).toBe(expectX);
        expect(result.visualLayers![0].position.y).toBe(expectY);
      }
    });
  });

  describe("Step 4: findScreenshotFile", () => {
    it("should find exact match", () => {
      const { findScreenshotFile } = require(
        join(PROJECT_ROOT, "dist/utils/screenshot-finder.js"),
      );

      const screenshotsDir = join(testProjectDir, "screenshots");
      mkdirSync(screenshotsDir, { recursive: true });
      writeFileSync(join(screenshotsDir, "hero-image.png"), Buffer.alloc(0));

      const result = findScreenshotFile(screenshotsDir, 0, "hero-image");
      expect(result).not.toBeNull();
      expect(result!.endsWith("hero-image.png")).toBe(true);
    });

    it("should find scene-prefixed match", () => {
      const { findScreenshotFile } = require(
        join(PROJECT_ROOT, "dist/utils/screenshot-finder.js"),
      );

      const screenshotsDir = join(testProjectDir, "screenshots");
      writeFileSync(
        join(screenshotsDir, "scene-001-article.png"),
        Buffer.alloc(0),
      );

      const result = findScreenshotFile(screenshotsDir, 0, "article");
      expect(result).not.toBeNull();
      expect(result!.endsWith("scene-001-article.png")).toBe(true);
    });

    it("should fall back to any scene-prefixed file", () => {
      const { findScreenshotFile } = require(
        join(PROJECT_ROOT, "dist/utils/screenshot-finder.js"),
      );

      const screenshotsDir = join(testProjectDir, "screenshots");
      writeFileSync(
        join(screenshotsDir, "scene-002-random.png"),
        Buffer.alloc(0),
      );

      const result = findScreenshotFile(screenshotsDir, 1, "nonexistent");
      expect(result).not.toBeNull();
      expect(result!.endsWith("scene-002-random.png")).toBe(true);
    });
  });

  describe("Step 5: spawnRenderer (smoke test)", () => {
    it("should export spawnRenderer from process-manager", () => {
      const pm = require(join(PROJECT_ROOT, "dist/utils/process-manager.js"));
      expect(typeof pm.spawnRenderer).toBe("function");
    });

    it("should export RenderVideoInputSchema from video-renderer", () => {
      const vr = require(join(RENDERER_DIST, "video-renderer.js"));
      expect(typeof vr.RenderVideoInputSchema).toBe("object");
    });
  });

  describe("Step 6: Animation utilities", () => {
    it("should export SPRING_PRESETS from animation-utils", () => {
      const au = require(join(RENDERER_DIST, "utils/animation-utils.js"));
      expect(au.SPRING_PRESETS).toBeDefined();
      expect(typeof au.SPRING_PRESETS.snappy).toBe("object");
      expect(typeof au.SPRING_PRESETS.smooth).toBe("object");
    });

    it("should export useEnterAnimation hook", () => {
      const au = require(join(RENDERER_DIST, "utils/animation-utils.js"));
      expect(typeof au.useEnterAnimation).toBe("function");
    });

    it("should export useKenBurns hook", () => {
      const au = require(join(RENDERER_DIST, "utils/animation-utils.js"));
      expect(typeof au.useKenBurns).toBe("function");
    });

    it("should export staggerDelay", () => {
      const au = require(join(RENDERER_DIST, "utils/animation-utils.js"));
      expect(typeof au.staggerDelay).toBe("function");
      expect(au.staggerDelay(0, 10)).toBe(0);
      expect(au.staggerDelay(1, 10)).toBe(10);
      expect(au.staggerDelay(5, 10)).toBe(50);
    });
  });

  describe("Step 7: KineticSubtitle", () => {
    it("should export KineticSubtitle component", () => {
      const ks = require(
        join(RENDERER_DIST, "remotion/components/KineticSubtitle.js"),
      );
      expect(ks.KineticSubtitle).toBeDefined();
    });
  });

  describe("Step 8: All 7 transitions in Composition", () => {
    it("should import all 7 transition types", () => {
      const compPath = join(RENDERER_DIST, "remotion/Composition.js");
      const content = readFileSync(compPath, "utf-8");
      expect(content).toContain("fade");
      expect(content).toContain("slide");
      expect(content).toContain("wipe");
      expect(content).toContain("flip");
      expect(content).toContain("clockWipe");
      expect(content).toContain("iris");
      expect(content).toContain("blur");
    });
  });
});

interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

function runCLI(args: string[], timeoutMs = 10000): Promise<CLIResult> {
  return new Promise((resolve) => {
    const result: CLIResult = { stdout: "", stderr: "", exitCode: null };
    const proc: ChildProcess = spawn("node", [CLI_PATH, ...args], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, CI: "true" },
      timeout: timeoutMs,
    });

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      resolve({ ...result, exitCode: 124 });
    }, timeoutMs);

    proc.stdout?.on("data", (data: Buffer) => {
      result.stdout += data.toString();
    });
    proc.stderr?.on("data", (data: Buffer) => {
      result.stderr += data.toString();
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      result.exitCode = code;
      resolve(result);
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      result.stderr += err.message;
      result.exitCode = 1;
      resolve(result);
    });
  });
}
