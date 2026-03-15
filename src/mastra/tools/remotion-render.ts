import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export const remotionRenderTool = createTool({
  id: 'remotion-render',
  description: '渲染 Remotion 项目为视频文件',
  inputSchema: z.object({
    projectPath: z.string().describe('Remotion 项目路径'),
    outputPath: z.string().describe('输出视频路径'),
    format: z.enum(['mp4', 'webm']).optional().describe('视频格式 (默认: mp4)'),
    fps: z.number().optional().describe('帧率 (默认: 30)'),
  }),
  outputSchema: z.object({
    videoPath: z.string().describe('生成的视频文件路径'),
    duration: z.number().describe('视频时长（秒）'),
    success: z.boolean().describe('渲染是否成功'),
    error: z.string().optional().describe('错误信息'),
  }),
  execute: async ({ projectPath, outputPath, format = 'mp4', fps = 30 }) => {
    return new Promise((resolve) => {
      try {
        // 验证项目路径是否存在
        if (!fs.existsSync(projectPath)) {
          return resolve({
            videoPath: '',
            duration: 0,
            success: false,
            error: `项目路径不存在: ${projectPath}`,
          })
        }

        // 确保输出目录存在
        const outputDir = path.dirname(outputPath)
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true })
        }

        // 构建 remotion render 命令
        const args = [
          'remotion',
          'render',
          projectPath,
          outputPath,
          '--codec',
          'h264',
          '--fps',
          fps.toString(),
        ]

        if (format === 'webm') {
          args.push('--webm')
        }

        // 启动渲染进程
        const renderProcess = spawn('npx', args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: process.cwd(),
        })

        let stdout = ''
        let stderr = ''

        renderProcess.stdout?.on('data', (data: Buffer) => {
          stdout += data.toString()
        })

        renderProcess.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString()
        })

        renderProcess.on('close', (code: number) => {
          if (code === 0) {
            // 渲染成功，获取视频文件信息
            if (fs.existsSync(outputPath)) {
              // 简单估算时长（可根据实际需求改进）
              const durationSeconds = (fps * 60) / fps // 默认假设 60 帧的内容

              return resolve({
                videoPath: outputPath,
                duration: durationSeconds,
                success: true,
              })
            }

            return resolve({
              videoPath: '',
              duration: 0,
              success: false,
              error: '渲染完成但输出文件不存在',
            })
          }

          return resolve({
            videoPath: '',
            duration: 0,
            success: false,
            error: `渲染失败 (Exit code: ${code}): ${stderr || stdout}`,
          })
        })

        renderProcess.on('error', (error: Error) => {
          return resolve({
            videoPath: '',
            duration: 0,
            success: false,
            error: `进程错误: ${error.message}`,
          })
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误'

        return resolve({
          videoPath: '',
          duration: 0,
          success: false,
          error: `异常错误: ${errorMessage}`,
        })
      }
    })
  },
})
