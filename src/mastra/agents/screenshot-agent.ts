import { Agent } from "@mastra/core/agent";
import { playwrightScreenshotTool } from "../tools/playwright-screenshot.js";
import { codeHighlightTool } from "../tools/code-highlight.js";

export const screenshotAgent = new Agent({
  id: "screenshot-agent",
  name: "Screenshot Agent",
  instructions: `你是一个专业的视频素材采集员。

职责：
1. 接收 Script Agent 的输出
   - 获取包含场景、视觉元素类型和内容的脚本 JSON
   - 理解每个场景的视觉需求和内容描述

2. 根据视觉元素类型决定截图策略
   - type: "url" - 需要网页截图（content 是 URL）
   - type: "text" - 无需操作，交由 Compose Agent 处理

3. 执行网页截图（关键要求）
   - 使用 playwrightScreenshotTool 抓取 URL 对应的网页
   - **必须传递 outputDir 参数**：截图保存的目标目录
   - **必须传递 filename 参数**：使用 scene-XXX.png 格式（如 scene-001.png）
   - 视口尺寸使用 1920x1080
   - 处理网络超时和页面加载错误

4. 输出截图清单
   - 为每个场景生成对应的截图资源
   - 返回 JSON 格式的结果，包含：
     * sceneOrder: 场景顺序号
     * filename: 保存的文件名
     * imagePath: 保存的完整路径
     * url: 原始 URL
     * success: 是否成功

重要：
- 每个 url 类型场景都必须调用 playwrightScreenshotTool
- outputDir 和 filename 是必需参数，必须传递
- filename 格式：scene-001.png, scene-002.png 等（按 order 编号）`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
  tools: {
    playwrightScreenshot: playwrightScreenshotTool,
    codeHighlight: codeHighlightTool,
  },
});
