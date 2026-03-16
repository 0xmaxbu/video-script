import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const remotionRenderTool = createTool({
  id: "remotion-render",
  description: "\u6E32\u67D3 Remotion \u9879\u76EE\u4E3A\u89C6\u9891\u6587\u4EF6",
  inputSchema: z.object({
    projectPath: z.string().describe("Remotion \u9879\u76EE\u8DEF\u5F84"),
    outputPath: z.string().describe("\u8F93\u51FA\u89C6\u9891\u8DEF\u5F84"),
    format: z.enum(["mp4", "webm"]).optional().describe("\u89C6\u9891\u683C\u5F0F (\u9ED8\u8BA4: mp4)"),
    fps: z.number().optional().describe("\u5E27\u7387 (\u9ED8\u8BA4: 30)")
  }),
  outputSchema: z.object({
    videoPath: z.string().describe("\u751F\u6210\u7684\u89C6\u9891\u6587\u4EF6\u8DEF\u5F84"),
    duration: z.number().describe("\u89C6\u9891\u65F6\u957F\uFF08\u79D2\uFF09"),
    success: z.boolean().describe("\u6E32\u67D3\u662F\u5426\u6210\u529F"),
    error: z.string().optional().describe("\u9519\u8BEF\u4FE1\u606F")
  }),
  execute: async ({ projectPath, outputPath, format = "mp4", fps = 30 }) => {
    return new Promise((resolve) => {
      try {
        if (!fs.existsSync(projectPath)) {
          return resolve({
            videoPath: "",
            duration: 0,
            success: false,
            error: `\u9879\u76EE\u8DEF\u5F84\u4E0D\u5B58\u5728: ${projectPath}`
          });
        }
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const args = [
          "remotion",
          "render",
          projectPath,
          outputPath,
          "--codec",
          "h264",
          "--fps",
          fps.toString()
        ];
        if (format === "webm") {
          args.push("--webm");
        }
        const renderProcess = spawn("npx", args, {
          stdio: ["pipe", "pipe", "pipe"],
          cwd: process.cwd()
        });
        let stdout = "";
        let stderr = "";
        renderProcess.stdout?.on("data", (data) => {
          stdout += data.toString();
        });
        renderProcess.stderr?.on("data", (data) => {
          stderr += data.toString();
        });
        renderProcess.on("close", (code) => {
          if (code === 0) {
            if (fs.existsSync(outputPath)) {
              const durationSeconds = fps * 60 / fps;
              return resolve({
                videoPath: outputPath,
                duration: durationSeconds,
                success: true
              });
            }
            return resolve({
              videoPath: "",
              duration: 0,
              success: false,
              error: "\u6E32\u67D3\u5B8C\u6210\u4F46\u8F93\u51FA\u6587\u4EF6\u4E0D\u5B58\u5728"
            });
          }
          return resolve({
            videoPath: "",
            duration: 0,
            success: false,
            error: `\u6E32\u67D3\u5931\u8D25 (Exit code: ${code}): ${stderr || stdout}`
          });
        });
        renderProcess.on("error", (error) => {
          return resolve({
            videoPath: "",
            duration: 0,
            success: false,
            error: `\u8FDB\u7A0B\u9519\u8BEF: ${error.message}`
          });
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF";
        return resolve({
          videoPath: "",
          duration: 0,
          success: false,
          error: `\u5F02\u5E38\u9519\u8BEF: ${errorMessage}`
        });
      }
    });
  }
});

export { remotionRenderTool };
