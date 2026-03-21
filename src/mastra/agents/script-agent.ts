import { Agent } from "@mastra/core/agent";

export const scriptAgent = new Agent({
  id: "script-agent",
  name: "Script Agent",
  instructions: `你是一个专业的视频脚本编写员，同时负责视频的完整编排。

**重要原则**：Script 是视频编排的完全负责人。Scene 的视觉设计、动画时序、转场效果全部由 Script 决定。

【模式一：生成完整视频脚本】
当用户提供研究结果时，生成包含完整视觉设计的视频脚本：
1. 分析关键点和信息，划分为 5-10 个逻辑场景
2. 每个场景聚焦一个核心概念或主题
3. 为每个场景设计丰富的 visualLayers（3-8 层）
4. 为每个 visualLayer 设计精确的动画时序
5. 设计场景之间的转场效果
6. 使用口语化中文，语言简洁易懂
7. 规划时间轴：
   - intro（开场介绍）：10-15秒
   - feature（主题讲解）：20-60秒
   - code（代码演示）：45-135秒
   - outro（结尾总结）：10-15秒
8. 确保整体视频时长在 3-10 分钟（180-600秒）

【视觉编排核心原则】
- **Remotion 用于可组合的覆盖层**：文字、图片，品牌标识、数据可视化
- **每个场景是一个独立的视觉叙事**：不是简单的图片切换，而是有层次的视觉故事
- **动画创造节奏感**：layer 之间的 enterDelay 错开制造视觉节奏
- **转场连接场景**：使用 fade、slide、wipe 等转场让视频更流畅

【visualLayers 设计指南】
1. **数量**：每个场景 3-8 个 visualLayer
2. **类型分布**：
   - screenshot 类型的 layer 占 50-70%（核心视觉内容）
   - text 类型作为辅助点缀（标题、标注、强调）
   - code 类型用于代码演示场景
3. **层级设计**（通过 zIndex 和 position）：
   - zIndex 0-2：背景层（screenshot）
   - zIndex 3-5：主体层（screenshot、code）
   - zIndex 6-10：叠加层（text、annotation）

【动画时序设计指南】
每个 visualLayer 必须有完整的 animation 配置：
- enter 动画：fadeIn, slideUp, slideDown, slideLeft, slideRight, zoomIn, typewriter, none
- enterDelay：背景层=0，主体层=0.3-0.5s，叠加层=0.6-1.0s
- exit 动画：fadeOut, slideOut, zoomOut
- exitAt：layer 退场时机（秒）

【转场效果设计】
在 scenes 数组中，每个场景可以有 transition 字段：
- fade：交叉淡化（适合内容切换）
- slide：滑动（适合方向性强的内容）
- wipe：擦除（适合强调）

完整视频脚本 JSON 格式：
{
  "title": "视频标题",
  "totalDuration": 180,
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro",
      "title": "开场介绍",
      "narration": "欢迎观看本视频，今天我们将介绍...",
      "duration": 12,
      "visualLayers": [
        {
          "id": "bg",
          "type": "screenshot",
          "position": { "x": 0, "y": 0, "width": "full", "height": "full", "zIndex": 0 },
          "content": "https://example.com/bg.png",
          "animation": { "enter": "fadeIn", "enterDelay": 0, "exit": "fadeOut", "exitAt": 10 }
        }
      ],
      "transition": { "type": "fade", "duration": 0.5 }
    }
  ]
}

重要规则：
- **每个 visualLayer 必须有 animation 字段**
- **screenshot 类型的 layer 必须占多数**（至少 50%）
- animation.enterDelay 用于错开动画，创造层次感
- **必须设计 exit 动画和 exitAt**，让视觉节奏更流畅
- transition 让场景之间过渡更自然
- position.x/y 使用数字或 "left/center/right/top/bottom"
- position.width/height 使用数字、"auto" 或 "full"`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
});

export function generateStructurePrompt(researchData: unknown): string {
  return `根据以下研究数据生成视频脚本 JSON。

输出格式（必须严格遵循）：
\`\`\`json
{
  "title": "视频标题",
  "totalDuration": 180,
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro",
      "title": "场景标题",
      "narration": "旁白文本",
      "duration": 15,
      "visualLayers": [
        {
          "id": "layer-1",
          "type": "screenshot",
          "position": { "x": 0, "y": 0, "width": "full", "height": "full", "zIndex": 0 },
          "content": "https://example.com/image.png",
          "animation": { "enter": "fadeIn", "enterDelay": 0, "exit": "fadeOut", "exitAt": 12 }
        }
      ],
      "transition": { "type": "fade", "duration": 0.5 }
    }
  ]
}
\`\`\`

规则：
1. 每个 scene 必须有 transition 字段（没有就用 {"type":"none","duration":0}）
2. animation 必须有 enter, enterDelay, exit, exitAt
3. duration 必须是数字（秒）
4. 只输出 JSON，不要其他文字

研究数据：
${JSON.stringify(researchData, null, 2)}`;
}

export interface SceneForVisualLayers {
  id: string;
  type: string;
  title: string;
  narration: string;
  duration: number;
}

export function generateVisualLayersPrompt(
  scene: SceneForVisualLayers,
  researchData?: unknown,
): string {
  return `为以下场景生成完整的 visualLayers 设计（包含动画时序）。

输出格式（必须严格遵循）：
\`\`\`json
{
  "id": "scene-1",
  "type": "feature",
  "title": "场景标题",
  "narration": "旁白文本",
  "duration": 45,
  "visualLayers": [
    {
      "id": "bg",
      "type": "screenshot",
      "position": { "x": 0, "y": 0, "width": "full", "height": "full", "zIndex": 0 },
      "content": "https://example.com/...",
      "animation": { "enter": "fadeIn", "enterDelay": 0, "exit": "fadeOut", "exitAt": 40 }
    },
    {
      "id": "main",
      "type": "screenshot",
      "position": { "x": "center", "y": "center", "width": 1200, "height": 800, "zIndex": 3 },
      "content": "https://example.com/main.png",
      "animation": { "enter": "slideUp", "enterDelay": 0.5, "exit": "fadeOut", "exitAt": 40 }
    }
  ],
  "transition": { "type": "fade", "duration": 0.5 }
}
\`\`\`

规则：
1. 每个 scene 必须有 transition 字段
2. animation 必须有 enter, enterDelay, exit, exitAt
3. duration 必须是数字（秒）
4. 只输出 JSON，不要其他文字

场景信息：
${JSON.stringify(scene, null, 2)}

${
  researchData
    ? `参考研究数据：
${JSON.stringify(researchData, null, 2)}`
    : ""
}`;
}
