import { Agent } from "@mastra/core/agent";

/**
 * Script Agent - Phase 3 Redesign
 *
 * 核心原则：口播内容 = 主导，视觉 = 辅助
 *
 * 职责：
 * 1. 将 Research 内容转化为口播叙事
 * 2. 划分场景（intro/feature/code/outro）
 * 3. 为口播分段（便于 Visual Agent 精确绑定）
 * 4. 标记重点（供 Visual Agent 添加标注）
 *
 * 不再负责：
 * - 视觉设计
 * - 动画编排
 * - 转场效果
 */

export const scriptAgent = new Agent({
  id: "script-agent",
  name: "Script Agent",
  instructions: `You are a professional video scriptwriter. Your ONLY job is to create the narration content.

**核心原则**：口播内容是视频的主导，视觉是辅助。

## Task Flow:
1. Read Research Markdown (research.md)
2. Only process content with [priority: essential] or [priority: important]
3. Convert to spoken narration (口语化)
4. Divide into scenes (5-10 scenes)
5. Mark key points for visual emphasis
6. Output structured JSON

## OUTPUT SCHEMA:

\`\`\`json
{
  "title": "视频标题",
  "totalDuration": 300,
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro",
      "title": "开场介绍",
      "duration": 15,
      "narration": {
        "fullText": "欢迎观看本视频，今天我们将介绍 TypeScript 5.4 的重要更新。",
        "estimatedDuration": 5,
        "segments": [
          {
            "text": "欢迎观看本视频",
            "startTime": 0,
            "endTime": 2
          },
          {
            "text": "今天我们将介绍 TypeScript 5.4 的重要更新",
            "startTime": 2,
            "endTime": 5
          }
        ]
      },
      "highlights": [
        {
          "text": "TypeScript 5.4",
          "segmentIndex": 1,
          "charStart": 9,
          "charEnd": 22,
          "timeInScene": 3.5,
          "importance": "critical",
          "annotationSuggestion": "highlight",
          "reason": "这是视频主题"
        }
      ],
      "codeHighlights": [],
      "sourceRef": "[1]"
    }
  ]
}
\`\`\`

## Scene Types:
- **intro**: 开场介绍（10-20秒）
- **feature**: 特性讲解（30-60秒）
- **code**: 代码演示（45-120秒）
- **outro**: 结尾总结（10-20秒）

## Total Duration: 3-8 minutes (180-480 seconds)

## Narration Segments:
- Break narration into logical segments (2-5 seconds each)
- Each segment should be a complete phrase
- Segments are used by Visual Agent to time annotations

## Highlights:
- Mark KEY POINTS that need visual emphasis
- importance levels: "critical" (必须标注), "high" (应该标注), "medium" (可选标注)
- annotationSuggestion: "circle", "underline", "highlight", "number"
- Include timeInScene so Visual Agent knows WHEN to show the annotation

## Code Highlights (for code scenes):
- Mark specific lines that need emphasis
- Include line number, code text, and explanation
- timeInScene indicates when narrator mentions this code

## CRITICAL REQUIREMENTS:
1. Only output valid JSON (no markdown blocks)
2. Only process essential/important content from research
3. Break narration into segments with timing
4. Mark ALL key points in highlights
5. Use spoken Chinese (口语化)
6. Keep narration concise and engaging
7. Each scene needs sourceRef linking back to research`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
});

/**
 * 估算口播时长（中文约 3-4 字/秒）
 */
export function estimateNarrationDuration(text: string): number {
  // 中文约 3-4 字/秒，英文约 2.5 词/秒
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

  const chineseDuration = chineseChars / 3.5;
  const englishDuration = englishWords / 2.5;

  return Math.ceil(chineseDuration + englishDuration);
}

/**
 * 将口播文本分段
 */
export function segmentNarration(
  text: string,
  targetSegmentDuration: number = 3,
): Array<{ text: string; startTime: number; endTime: number }> {
  const segments: Array<{ text: string; startTime: number; endTime: number }> = [];

  // 按句号、问号、感叹号分句
  const sentences = text.split(/(?<=[。！？，、；])|(?<=\s)/);

  let currentSegment = "";
  let currentTime = 0;

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;

    currentSegment += sentence;

    // 估算当前片段时长
    const segmentDuration = estimateNarrationDuration(currentSegment);

    // 如果片段时长超过目标，或者遇到句末标点
    if (segmentDuration >= targetSegmentDuration || /[。！？]/.test(sentence)) {
      const duration = estimateNarrationDuration(currentSegment);
      segments.push({
        text: currentSegment.trim(),
        startTime: currentTime,
        endTime: currentTime + duration,
      });
      currentTime += duration;
      currentSegment = "";
    }
  }

  // 处理剩余内容
  if (currentSegment.trim()) {
    const duration = estimateNarrationDuration(currentSegment);
    segments.push({
      text: currentSegment.trim(),
      startTime: currentTime,
      endTime: currentTime + duration,
    });
  }

  return segments;
}

/**
 * 从口播文本中提取关键词用于视觉标注
 */
export function extractKeyTerms(text: string): string[] {
  // 简单的关键词提取：中文词组、英文术语、数字
  const terms: string[] = [];

  // 英文术语（连续大写或混合）
  const englishTerms = text.match(/[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*/g) || [];
  terms.push(...englishTerms);

  // 带引号的内容
  const quoted = text.match(/['"「」『』]([^'"「」『』]+)['"「」『』]/g) || [];
  terms.push(...quoted.map((q) => q.replace(/['"「」『』]/g, "")));

  return [...new Set(terms)].filter((t) => t.length >= 2);
}

/**
 * 生成 Script Agent 的 prompt
 */
export function generateScriptPrompt(researchMd: string): string {
  return `根据以下研究文档生成口播脚本。

**只处理标记为 [priority: essential] 或 [priority: important] 的内容。**

研究文档：
---
${researchMd}
---

输出格式要求：
1. 只输出 JSON，不要 markdown 代码块
2. 口播要口语化，适合朗读
3. 每个场景的 narration 必须包含 segments 数组
4. 标记所有需要视觉强调的重点
5. 代码场景要标记 codeHighlights`;
}
