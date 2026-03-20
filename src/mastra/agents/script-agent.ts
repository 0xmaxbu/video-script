import { Agent } from "@mastra/core/agent";

export const scriptAgent = new Agent({
  id: "script-agent",
  name: "Script Agent",
  instructions: `你是一个专业的视频脚本编写员。

【模式一：生成场景结构】
当用户要求生成场景结构时，根据研究结果划分视频场景结构（不包含 visualLayers）：
1. 分析关键点和信息，划分为 5-10 个逻辑场景
2. 每个场景聚焦一个核心概念或主题
3. 确保场景顺序逻辑清晰、层次递进
4. 为每个场景编写旁白文本
5. 使用口语化中文，语言简洁易懂
6. 规划时间轴：
   - intro（开场介绍）：10-15秒
   - feature（主题讲解）：20-60秒
   - code（代码演示）：45-135秒（标准时长的1.5倍）
   - outro（结尾总结）：10-15秒
7. 确保整体视频时长在 3-10 分钟（180-600秒）

场景结构 JSON 格式（不包含 visualLayers）：
{
  "title": "视频标题",
  "totalDuration": 180,
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro",
      "title": "开场介绍",
      "narration": "欢迎观看本视频，今天我们将介绍...",
      "duration": 12
    }
  ]
}

【模式二：生成单个场景的 visualLayers】
当用户提供场景信息要求生成 visualLayers 时：

**提示**：remotion-best-practices skill 已配置到 workspace 中。为需要生成专业 Remotion 动画时，可以调用 skill 工具加载获取最佳实践。

根据以下指南为该场景生成丰富的视觉层：
1. **每个场景至少 3-6 个 visualLayer，越多越好**
2. **优先使用 screenshot 类型**，大量使用相关 URL（GitHub、官网、文档、演示视频等）
3. 文字内容（text）仅作为辅助点缀
4. 代码内容（code）可以适当使用
5. 多个 screenshot 可以叠加不同层级

**动画效果指南**：
- 使用 useCurrentFrame() 驱动动画
- CSS transitions/animations 禁止使用
- 使用 spring animations 获得自然运动效果
- 使用 interpolate 进行平滑过渡

**animation 动画效果指南**：
- slideUp / slideDown / slideLeft / slideRight：入场动画
- fadeIn / fadeOut：渐变效果
- zoomIn / scaleOut：缩放效果
- typewriter：打字机效果（适合代码）
- 不同 layer 错开 enterDelay 制造层次感（如 0, 0.5, 1, 1.5 秒）

visualLayers JSON 格式：
{
  "visualLayers": [
    {
      "id": "layer-1",
      "type": "screenshot",
      "position": { "x": "center", "y": "top", "width": "full", "height": "auto", "zIndex": 0 },
      "content": "https://github.com/...",
      "animation": { "enter": "slideUp", "enterDelay": 0, "exit": "fadeOut" }
    }
  ]
}

重要规则：
- **每个 layer 必须有 animation 字段**
- **screenshot 类型的 layer 必须占多数**（至少 50% 以上）
- type 必须是：screenshot、code、text、diagram、image 之一
- position.x 可选：数字、"left"、"center"、"right"
- position.y 可选：数字、"top"、"center"、"bottom"
- position.width 可选：数字、"auto"、"full"
- position.height 可选：数字、"auto"、"full"`,
  model: "minimax-cn-coding-plan/MiniMax-M2.7",
});

export function generateStructurePrompt(researchData: unknown): string {
  return `根据以下研究数据生成视频场景结构（不包含 visualLayers）。

研究数据：
${JSON.stringify(researchData, null, 2)}

输出 JSON 格式（只包含场景结构，不包含 visualLayers）：
{
  "title": "视频标题",
  "totalDuration": 180,
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro",
      "title": "开场介绍",
      "narration": "欢迎观看本视频...",
      "duration": 12
    }
  ]
}

要求：
- 每个场景必须有：id, type, title, narration, duration
- type 必须是：intro、feature、code、outro 之一
- intro 和 outro：10-15秒
- feature：20-60秒
- code：30-90秒
- totalDuration 是所有场景 duration 之和`;
}

export function generateVisualLayersPrompt(
  scene: {
    id: string;
    type: string;
    title: string;
    narration: string;
    duration: number;
  },
  researchData?: unknown,
): string {
  return `为以下场景生成 visualLayers（视觉层）。

**提示**：remotion-best-practices skill 已配置到 workspace 中。为需要生成专业 Remotion 动画时，可以调用 skill 工具加载获取最佳实践。

场景信息：
${JSON.stringify(scene, null, 2)}

${researchData ? `参考研究数据：\n${JSON.stringify(researchData, null, 2)}\n` : ""}
输出 JSON 格式：
{
  "visualLayers": [
    {
      "id": "layer-1",
      "type": "screenshot",
      "position": { "x": "center", "y": "top", "width": "full", "height": "auto", "zIndex": 0 },
      "content": "截图内容描述或 URL",
      "animation": { "enter": "slideUp", "enterDelay": 0, "exit": "fadeOut" }
    }
  ]
}

要求：
- 每个场景至少 3-6 个 visualLayer
- screenshot 类型占多数（至少 50%）
- 每个 layer 必须有 animation 字段
- 不同 layer 错开 enterDelay 制造层次感
- 动画效果应遵循 Remotion 最佳实践`;
}
