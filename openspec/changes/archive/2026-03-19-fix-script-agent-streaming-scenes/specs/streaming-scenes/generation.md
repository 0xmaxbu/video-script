# Spec: Streaming Scene Generation

## Overview

Change Script Agent from single-shot full script generation to incremental scene-by-scene generation.

## Strategy

### Phase 1: Structure Generation (1 call)

Generate scene structure without visualLayers.

**Prompt**:

```
根据以下研究数据，创建视频场景结构。

研究数据:
{research_json}

要求:
1. 创建 5-8 个逻辑场景
2. 每个场景包含: id, type, title, narration, duration
3. type 必须是: intro, feature, code, outro 之一
4. duration 分配:
   - intro: 10-15秒
   - feature: 20-60秒
   - code: 30-90秒
   - outro: 10-15秒
5. 总时长控制在 3-8 分钟

输出 JSON 格式:
{
  "title": "视频标题",
  "totalDuration": 180,
  "scenes": [
    { "id": "scene-1", "type": "intro", "title": "...", "narration": "...", "duration": 15 },
    ...
  ]
}
```

### Phase 2: Visual Layer Generation (N calls)

Generate visualLayers for each scene.

**Per-scene prompt**:

```
为场景 scene-N 生成视觉层。

场景信息:
{
  "id": "scene-N",
  "type": "feature",
  "title": "场景标题",
  "narration": "旁白文本..."
}

主题背景:
{research_summary}

要求:
1. 每个场景 3-6 个 visualLayers
2. 类型优先级: screenshot > code > text
3. 每个 layer 必须有 animation
4. animation.enter 只能是: fadeIn, slideLeft, slideRight, slideUp, slideDown, zoomIn, typewriter, none
5. animation.exit 只能是: fadeOut, slideOut, zoomOut, none

输出 JSON 格式:
{
  "sceneId": "scene-N",
  "visualLayers": [
    {
      "id": "layer-1",
      "type": "screenshot",
      "position": { "x": "center", "y": "top", "width": "full", "height": "auto", "zIndex": 0 },
      "content": "https://...",
      "animation": { "enter": "fadeIn", "enterDelay": 0, "exit": "fadeOut" }
    }
  ]
}
```

## Workflow

```typescript
async function generateScript(research: ResearchOutput): Promise<ScriptOutput> {
  // Phase 1: Generate structure
  const structure = await callLLM(structurePrompt, research);

  // Phase 2: Generate visualLayers for each scene
  for (const scene of structure.scenes) {
    const visualLayers = await callLLM(scenePrompt, { scene, research });
    scene.visualLayers = visualLayers;

    // Validate after each scene
    validateScene(scene);
  }

  return structure;
}
```

## Error Handling

| Error                      | Recovery                                      |
| -------------------------- | --------------------------------------------- |
| Structure generation fails | Retry 3x, then fail entire script             |
| Scene N visualLayers fail  | Retry scene N up to 3x                        |
| Scene N still fails        | Save progress, mark scene as failed, continue |

## Partial Output

If script generation partially completes:

- Save `script.json` with completed scenes
- Failed scenes have `"visualLayers": []` and `"status": "failed"`
- User can retry failed scenes

## Implementation Location

- `src/mastra/agents/script-agent.ts`: Update agent prompt
- `src/cli/index.ts`: Update CLI to call streaming generation
- `src/utils/json-parser.ts`: New file for multi-JSON parsing
