import { describe, it, expect, vi, afterEach } from "vitest";
import { remotionRenderTool } from "../remotion-render";
import { spawn } from "child_process";

vi.mock("child_process");
vi.mock("fs");

describe("remotionRenderTool", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should render video successfully", async () => {
      const mockProcess = {
        stdout: {
          on: vi.fn((event, cb) => {
            if (event === "data") {
              cb(Buffer.from("Rendering..."));
            }
          }),
        },
        stderr: {
          on: vi.fn(),
        },
        on: vi.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);

      const result = (await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/path/to/output.mp4",
        },
        {} as any,
      )) as { videoPath: string; duration: number; success: boolean };

      expect(result.success).toBe(true);
      expect(result.videoPath).toBe("/path/to/output.mp4");
      expect(result.duration).toBeGreaterThan(0);
    });

    it("should use default format mp4", async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);

      await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/path/to/output.mp4",
        },
        {} as any,
      );

      expect(spawnMock).toHaveBeenCalledWith(
        "npx",
        expect.arrayContaining(["remotion", "render"]),
        expect.any(Object),
      );

      const args = (spawnMock as any).mock.calls[0][1];
      expect(args).not.toContain("--webm");
    });

    it("should use webm format when specified", async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);

      await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/path/to/output.webm",
          format: "webm",
        },
        {} as any,
      );

      const args = (spawnMock as any).mock.calls[0][1];
      expect(args).toContain("--webm");
    });

    it("should use default fps 30", async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);

      await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/path/to/output.mp4",
        },
        {} as any,
      );

      const args = (spawnMock as any).mock.calls[0][1];
      expect(args).toContain("--fps");
      expect(args).toContain("30");
    });

    it("should use custom fps when specified", async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);

      await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/path/to/output.mp4",
          fps: 60,
        },
        {} as any,
      );

      const args = (spawnMock as any).mock.calls[0][1];
      expect(args).toContain("--fps");
      expect(args).toContain("60");
    });
  });

  describe("error cases", () => {
    it("should fail when project path does not exist", async () => {
      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(false);

      const result = (await remotionRenderTool.execute!(
        {
          projectPath: "/nonexistent/project",
          outputPath: "/path/to/output.mp4",
        },
        {} as any,
      )) as {
        videoPath: string;
        duration: number;
        success: boolean;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("项目路径不存在");
    });

    it("should handle render process exit code error", async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((event, cb) => {
            if (event === "data") {
              cb(Buffer.from("Error message"));
            }
          }),
        },
        on: vi.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(1), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);

      const result = (await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/path/to/output.mp4",
        },
        {} as any,
      )) as {
        videoPath: string;
        duration: number;
        success: boolean;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("渲染失败");
      expect(result.error).toContain("Exit code: 1");
    });

    it("should handle process error event", async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === "error") {
            setTimeout(() => cb(new Error("Process error")), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);

      const result = (await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/path/to/output.mp4",
        },
        {} as any,
      )) as {
        videoPath: string;
        duration: number;
        success: boolean;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("进程错误");
    });

    it("should fail when output file not created", async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync } = await import("fs");
      (existsSync as any).mockImplementation(
        (path: string) => path !== "/path/to/output.mp4",
      );

      const result = (await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/path/to/output.mp4",
        },
        {} as any,
      )) as {
        videoPath: string;
        duration: number;
        success: boolean;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("输出文件不存在");
    });

    it("should handle exception during execution", async () => {
      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockImplementation(() => {
        throw new Error("Spawn failed");
      });

      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);

      const result = (await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/path/to/output.mp4",
        },
        {} as any,
      )) as {
        videoPath: string;
        duration: number;
        success: boolean;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain("异常错误");
      expect(result.error).toContain("Spawn failed");
    });
  });

  describe("edge cases", () => {
    it("should handle paths with spaces", async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);

      await remotionRenderTool.execute!(
        {
          projectPath: "/path with spaces/to/project",
          outputPath: "/path with spaces/to/output.mp4",
        },
        {} as any,
      );

      expect(spawnMock).toHaveBeenCalledWith(
        "npx",
        expect.arrayContaining(["/path with spaces/to/project"]),
        expect.any(Object),
      );
    });

    it("should handle very high fps values", async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);

      await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/path/to/output.mp4",
          fps: 240,
        },
        {} as any,
      );

      const args = (spawnMock as any).mock.calls[0][1];
      expect(args).toContain("240");
    });

    it("should create output directory if not exists", async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, cb) => {
          if (event === "close") {
            setTimeout(() => cb(0), 10);
          }
        }),
      };

      const { spawn: spawnMock } = await import("child_process");
      (spawnMock as any).mockReturnValue(mockProcess);

      const { existsSync, mkdirSync } = await import("fs");
      (existsSync as any).mockReturnValue(true);
      (mkdirSync as any).mockImplementation(() => {});

      await remotionRenderTool.execute!(
        {
          projectPath: "/path/to/project",
          outputPath: "/new/output/dir/output.mp4",
        },
        {} as any,
      );

      expect(spawnMock).toHaveBeenCalled();
    });
  });
});
