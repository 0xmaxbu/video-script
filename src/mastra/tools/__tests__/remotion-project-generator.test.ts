import { describe, it, expect, vi, beforeEach } from "vitest";
import { remotionProjectGeneratorTool } from "../remotion-project-generator";
import fs from "fs";

vi.mock("fs");

describe("remotionProjectGeneratorTool", () => {
  const mockScript = {
    title: "Test Video",
    totalDuration: 120,
    scenes: [
      {
        id: "scene-1",
        type: "intro" as const,
        title: "Introduction",
        narration: "Welcome to our video",
        duration: 10,
      },
      {
        id: "scene-2",
        type: "feature" as const,
        title: "Feature Demo",
        narration: "Let me show you this feature",
        duration: 30,
      },
      {
        id: "scene-3",
        type: "code" as const,
        title: "Code Example",
        narration: "Here is some code",
        duration: 40,
        code: {
          language: "typescript",
          code: "const x = 1;",
          highlightLines: [1],
        },
      },
      {
        id: "scene-4",
        type: "outro" as const,
        title: "Conclusion",
        narration: "Thanks for watching",
        duration: 10,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should generate project structure successfully", async () => {
      (fs.mkdirSync as any) = vi.fn();
      (fs.writeFileSync as any) = vi.fn();
      (fs.existsSync as any) = vi.fn().mockReturnValue(false);

      const result = (await remotionProjectGeneratorTool.execute!(
        {
          script: mockScript,
          screenshotDir: "/screenshots",
          outputDir: "/output",
        },
        {} as any,
      )) as { projectPath: string; readyForRender: boolean };

      expect(result.readyForRender).toBe(true);
      expect(result.projectPath).toContain("/output/video-");
    });

    it("should generate Root.tsx with correct compositionId", async () => {
      (fs.mkdirSync as any) = vi.fn();
      (fs.writeFileSync as any) = vi.fn();
      (fs.existsSync as any) = vi.fn().mockReturnValue(false);

      await remotionProjectGeneratorTool.execute!(
        {
          script: mockScript,
          screenshotDir: "/screenshots",
          outputDir: "/output",
        },
        {} as any,
      );

      const writeCalls = (fs.writeFileSync as any).mock.calls;
      const rootCall = writeCalls.find((call: any[]) =>
        call[0].includes("Root.tsx"),
      );
      expect(rootCall).toBeDefined();
      expect(rootCall[1]).toContain("Test-Video");
    });

    it("should generate Composition.tsx with all scenes", async () => {
      (fs.mkdirSync as any) = vi.fn();
      (fs.writeFileSync as any) = vi.fn();
      (fs.existsSync as any) = vi.fn().mockReturnValue(false);

      await remotionProjectGeneratorTool.execute!(
        {
          script: mockScript,
          screenshotDir: "/screenshots",
          outputDir: "/output",
        },
        {} as any,
      );

      const writeCalls = (fs.writeFileSync as any).mock.calls;
      const compositionCall = writeCalls.find((call: any[]) =>
        call[0].includes("Composition.tsx"),
      );
      expect(compositionCall).toBeDefined();
      expect(compositionCall[1]).toContain("scene-1");
      expect(compositionCall[1]).toContain("scene-2");
      expect(compositionCall[1]).toContain("scene-3");
      expect(compositionCall[1]).toContain("scene-4");
    });

    it("should return correct video config", async () => {
      (fs.mkdirSync as any) = vi.fn();
      (fs.writeFileSync as any) = vi.fn();
      (fs.existsSync as any) = vi.fn().mockReturnValue(false);

      const result = (await remotionProjectGeneratorTool.execute!(
        {
          script: mockScript,
          screenshotDir: "/screenshots",
          outputDir: "/output",
        },
        {} as any,
      )) as {
        videoConfig: { resolution: string; fps: number; duration: number };
      };

      expect(result.videoConfig.resolution).toBe("1920x1080");
      expect(result.videoConfig.fps).toBe(30);
      expect(result.videoConfig.duration).toBe(120);
    });
  });

  describe("error cases", () => {
    it("should handle mkdir error", async () => {
      (fs.mkdirSync as any) = vi.fn().mockImplementation(() => {
        throw new Error("Permission denied");
      });
      (fs.existsSync as any) = vi.fn().mockReturnValue(false);

      const result = (await remotionProjectGeneratorTool.execute!(
        {
          script: mockScript,
          screenshotDir: "/screenshots",
          outputDir: "/output",
        },
        {} as any,
      )) as { readyForRender: boolean; error?: string };

      expect(result.readyForRender).toBe(false);
      expect(result.error).toContain("Permission denied");
    });

    it("should handle writeFileSync error", async () => {
      (fs.mkdirSync as any) = vi.fn();
      (fs.writeFileSync as any) = vi.fn().mockImplementation(() => {
        throw new Error("Disk full");
      });
      (fs.existsSync as any) = vi.fn().mockReturnValue(false);

      const result = (await remotionProjectGeneratorTool.execute!(
        {
          script: mockScript,
          screenshotDir: "/screenshots",
          outputDir: "/output",
        },
        {} as any,
      )) as { readyForRender: boolean; error?: string };

      expect(result.readyForRender).toBe(false);
      expect(result.error).toContain("Disk full");
    });
  });

  describe("edge cases", () => {
    it("should handle empty scenes array", async () => {
      (fs.mkdirSync as any) = vi.fn();
      (fs.writeFileSync as any) = vi.fn();
      (fs.existsSync as any) = vi.fn().mockReturnValue(false);

      const emptyScript = {
        title: "Empty Video",
        totalDuration: 0,
        scenes: [],
      };

      const result = (await remotionProjectGeneratorTool.execute!(
        {
          script: emptyScript,
          screenshotDir: "/screenshots",
          outputDir: "/output",
        },
        {} as any,
      )) as { readyForRender: boolean; videoConfig: { duration: number } };

      expect(result.readyForRender).toBe(true);
      expect(result.videoConfig.duration).toBe(0);
    });

    it("should handle code scene without highlightLines", async () => {
      (fs.mkdirSync as any) = vi.fn();
      (fs.writeFileSync as any) = vi.fn();
      (fs.existsSync as any) = vi.fn().mockReturnValue(false);

      const scriptWithCode = {
        title: "Code Video",
        totalDuration: 60,
        scenes: [
          {
            id: "code-scene",
            type: "code" as const,
            title: "Code",
            narration: "Some code",
            duration: 30,
            code: {
              language: "javascript",
              code: "console.log('hello');",
            },
          },
        ],
      };

      const result = (await remotionProjectGeneratorTool.execute!(
        {
          script: scriptWithCode,
          screenshotDir: "/screenshots",
          outputDir: "/output",
        },
        {} as any,
      )) as { readyForRender: boolean };

      expect(result.readyForRender).toBe(true);
    });

    it("should handle special characters in title", async () => {
      (fs.mkdirSync as any) = vi.fn();
      (fs.writeFileSync as any) = vi.fn();
      (fs.existsSync as any) = vi.fn().mockReturnValue(false);

      const specialScript = {
        title: "Test@Video#With$Special%Chars!",
        totalDuration: 60,
        scenes: [],
      };

      await remotionProjectGeneratorTool.execute!(
        {
          script: specialScript,
          screenshotDir: "/screenshots",
          outputDir: "/output",
        },
        {} as any,
      );

      const writeCalls = (fs.writeFileSync as any).mock.calls;
      const rootCall = writeCalls.find((call: any[]) =>
        call[0].includes("Root.tsx"),
      );
      expect(rootCall).toBeDefined();
      expect(rootCall[1]).toContain("Test-Video-With-Special-Chars-");
    });
  });
});
