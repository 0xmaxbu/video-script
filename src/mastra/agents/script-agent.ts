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
4. **position 设计**：
   - 全屏：width:"full", height:"full"（背景 screenshot）
   - 居中：x:"center", y:"center"（主体内容）
   - 偏移：x:数字, y:数字（标注、叠加元素）

【动画时序设计指南】
每个 visualLayer 必须有完整的 animation 配置：

**enter 动画**（场景开始时的入场动画）：
- fadeIn：淡入（通用，适合所有类型）
- slideUp/slideDown：上下滑入（适合 text、overlay）
- slideLeft/slideRight：左右滑入（适合 transitions）
- zoomIn：缩放淡入（适合强调、focus）
- typewriter：打字机效果（仅适合 code 类型的 text）
- none：无动画（用于静态背景层）

**enterDelay 设计**（错开形成节奏感）：
- 背景层：enterDelay = 0
- 主体层：enterDelay = 0.3-0.5s
- 叠加层：enterDelay = 0.6-1.0s
- 标注层：enterDelay = 1.0-1.5s

**exit 动画**（场景结束前的退场动画）：
- fadeOut：淡出（通用）
- slideOut：滑出（配合 enter 形成对称）
- zoomOut：缩小淡出（适合强调后的退出）

**exitAt 设计**（控制退场时机）：
- exitAt：表示该 layer 在场景开始后多少秒退出
- 例如：duration=30s，某个 overlay 可以在 25s 时退出（exitAt=25）

【转场效果设计】
在 scenes 数组中，每个场景可以有 transition 字段：
- fade：交叉淡化（适合内容切换）
- slide：滑动（适合方向性强的内容）
- wipe：擦除（适合强调）

transitions 示例：
{
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro",
      ...,
      "transition": { "type": "fade", "duration": 0.5 }
    },
    {
      "id": "scene-2",
      "type": "feature",
      ...,
      "transition": { "type": "slide", "direction": "from-left", "duration": 0.3 }
    }
  ]
}

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
        },
        {
          "id": "title",
          "type": "text",
          "position": { "x": "center", "y": "center", "width": "auto", "height": "auto", "zIndex": 5 },
          "content": "视频主题",
          "animation": { "enter": "zoomIn", "enterDelay": 0.5, "exit": "fadeOut", "exitAt": 10 }
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
  model: "minimax-cn-coding-plan/MiniMax-M2.7",
});

export function generateStructurePrompt(researchData: unknown): string {
  return `根据以下研究数据生成完整的视频脚本（包含所有场景和 visualLayers）。

**STRICT FORMAT (MUST FOLLOW)**
1. Output MUST be a single JSON object inside a \`\`\`json code block
2. Each scene MUST include 'transition' field - even if no transition, set to \`{"type":"none","duration":0}\`
3. transition shape: \`{"type":"fade"|"slide"|"wipe"|"none", "duration": number (seconds, >=0)}\`
4. visualLayer.animation MUST include: enter, enterDelay (number in seconds), exit, exitAt (number in seconds or null), and exitAt <= scene.duration
5. Pick a primary visual layer id per scene and include \`primaryLayerId\` at scene level
6. Use deterministic layer IDs: 'scene-<n>-<role>' (e.g., 'scene-001-bg', 'scene-001-main')
7. If unsure, use defaults: transition.type='fade', transition.duration=0.5, animation.enterDelay=0.3

示例：
\`\`\`json
{
  "title": "视频标题",
  "totalDuration": 180,
  "scenes": [
    {
      "id": "scene-001",
      "type": "intro",
      "title": "开场介绍",
      "primaryLayerId": "scene-001-bg",
      "narration": "欢迎观看本视频...",
      "duration": 12,
      "visualLayers": [
        {
          "id": "scene-001-bg",
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
\`\`\`

研究数据：
${JSON.stringify(researchData, null, 2)}

输出 JSON 格式（包含完整的 visualLayers 设计）：
{
  "title": "视频标题",
  "totalDuration": 180,
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro",
      "title": "开场介绍",
      "narration": "欢迎观看本视频...",
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

要求：
- 每个场景必须有：id, type, title, narration, duration, visualLayers, transition
- type 必须是：intro、feature、code、outro 之一
- intro 和 outro：10-15秒
- feature：20-60秒
- code：30-90秒
- totalDuration 是所有场景 duration 之和
- 每个场景至少 3-6 个 visualLayer
- screenshot 类型占多数（至少 50%）
- 每个 layer 必须有 animation 字段
- 不同 layer 错开 enterDelay 制造层次感
- 设计 exit 动画和 exitAt
- 设计场景之间的 transition`;
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

**STRICT FORMAT (MUST FOLLOW)**
1. Output MUST be a single JSON object inside a \`\`\`json code block
2. MUST include 'transition' field - even if no transition, set to \`{"type":"none","duration":0}\`
3. transition shape: \`{"type":"fade"|"slide"|"wipe"|"none", "duration": number (seconds, >=0)}\`
4. visualLayer.animation MUST include: enter, enterDelay (number in seconds), exit, exitAt (number in seconds or null), and exitAt <= scene.duration
5. Pick a primary visual layer id and include \`primaryLayerId\` at scene level
6. Use deterministic layer IDs: 'scene-<n>-<role>' (e.g., 'scene-001-bg', 'scene-001-main')
7. If unsure, use defaults: transition.type='fade', transition.duration=0.5, animation.enterDelay=0.3

示例：
\`\`\`json
{
  "id": "scene-1",
  "type": "feature",
  "title": "场景标题",
  "primaryLayerId": "scene-001-main",
  "narration": "旁白文本",
  "duration": 45,
  "visualLayers": [
    {
      "id": "scene-001-bg",
      "type": "screenshot",
      "position": { "x": 0, "y": 0, "width": "full", "height": "full", "zIndex": 0 },
      "content": "https://example.com/...",
      "animation": { "enter": "fadeIn", "enterDelay": 0, "exit": "fadeOut", "exitAt": 40 }
    },
    {
      "id": "scene-001-main",
      "type": "screenshot",
      "position": { "x": "center", "y": "center", "width": 1200, "height": 800, "zIndex": 3 },
      "content": "https://example.com/main.png",
      "animation": { "enter": "slideUp", "enterDelay": 0.5, "exit": "fadeOut", "exitAt": 40 }
    }
  ],
  "transition": { "type": "fade", "duration": 0.5 }
}
\`\`\`

场景信息：
${JSON.stringify(scene, null, 2)}

${
  researchData
    ? `参考研究数据（包含相关链接，可用于截图）：
${JSON.stringify(researchData, null, 2)}
`
    : ""
}
输出 JSON 格式（包含原场景信息 + visualLayers）：
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
    },
    {
      "id": "title",
      "type": "text",
      "position": { "x": "center", "y": "top", "width": "auto", "height": "auto", "zIndex": 5 },
      "content": "场景主题",
      "animation": { "enter": "zoomIn", "enterDelay": 1.0, "exit": "fadeOut", "exitAt": 42 }
    }
  ],
  "transition": { "type": "fade", "duration": 0.5 }
}

要求：
- **必须保留原场景的 id, type, title, narration, duration**
- 每个场景至少 3-6 个 visualLayer
- screenshot 类型占多数（至少 50%）
- 每个 layer 必须有完整的 animation 字段（enter, enterDelay, exit, exitAt）
- 不同 layer 错开 enterDelay 制造层次感
- 设计 exitAt 让 layer 在合适时机退出
- transition 让场景过渡更自然
- position.x/y 使用数字或 "left/center/right/top/bottom"
- position.width/height 使用数字、"auto" 或 "full"`;
}
