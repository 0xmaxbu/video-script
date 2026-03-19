# Design: Fix Script Agent - Incremental Scene Generation

## Architecture Overview

### Current Problem

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   LLM       │────▶│  CLI JSON Parser │────▶│   FAIL     │
│  (unstable) │     │ (single JSON)    │     │  (truncated)│
└─────────────┘     └──────────────────┘     └─────────────┘
```

### Proposed Solution

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   LLM       │────▶│  Multi-JSON      │────▶│  Scene      │
│  (1 scene)  │     │  Parser          │     │  Validator  │
└─────────────┘     └──────────────────┘     └─────────────┘
        │                                          │
        ▼                                          ▼
┌─────────────┐                            ┌─────────────┐
│  Streaming  │◀───────────────────────────│   Append    │
│  Scene Store│                            │   to JSON   │
└─────────────┘                            └─────────────┘
```

## Component Changes

### 1. CLI JSON Parser (`src/cli/index.ts`)

**Enhanced parsing strategy**:

```typescript
interface ParseStrategy {
  // Split by code fences first
  splitByCodeFences(text: string): string[];

  // Extract complete JSONs using brace counting
  extractCompleteJSONs(text: string): string[];

  // Score candidates by completeness
  scoreCandidate(json: object): number;

  // Parse with fallbacks
  parseWithFallback(text: string): object;
}
```

**Algorithm**:

1. Split `textContent` by ` ```json ` delimiter
2. For each block:
   - Try direct `JSON.parse()`
   - If fails, use brace-counting to find complete objects
   - Score by: `scenes.length * 100 + (title ? 10 : 0)`
3. Return highest-scoring valid parse

### 2. Agent Prompt Strategy

**Current prompt generates full script in one call** (problematic)

**New streaming approach**:

```typescript
// Phase 1: Generate scene structure (fast, small JSON)
const structurePrompt = `
根据研究数据，创建视频场景结构（不含visualLayers）。

输出格式:
{
  "title": "视频标题",
  "totalDuration": 180,
  "scenes": [
    { "id": "scene-1", "type": "intro", "title": "...", "duration": 15 },
    ...
  ]
}
`;

// Phase 2-N: Generate visualLayers for each scene
const scenePrompt = `
为 scene-1 生成 visualLayers。主题: {title}

输出格式:
{
  "sceneId": "scene-1",
  "visualLayers": [
    { "id": "layer-1", "type": "screenshot", ... },
    ...
  ]
}
`;
```

### 3. Script Output Format

**Incremental updates to `script.json`**:

```typescript
interface SceneUpdate {
  sceneId: string;
  visualLayers: VisualLayer[];
  status: "complete" | "failed";
  error?: string;
}

interface ScriptUpdate {
  type: "scene_update";
  sceneId: string;
  data: Partial<Scene> | VisualLayer[];
}
```

### 4. Error Handling

**Scene-level error recovery**:

- If scene N fails: save scenes 1..N-1
- Allow retry of scene N only
- Timeout per scene: 60 seconds
- Max retries per scene: 3

## File Changes

| File                                                | Change                                            |
| --------------------------------------------------- | ------------------------------------------------- |
| `src/cli/index.ts`                                  | Enhanced JSON parser with multi-candidate support |
| `src/mastra/agents/script-agent.ts`                 | Streaming scene generation prompt                 |
| `src/types/script.ts`                               | Add partial update types                          |
| `src/mastra/workflows/video-generation-workflow.ts` | Handle incremental updates                        |

## Backward Compatibility

- `research.json` format unchanged
- `script.json` output format unchanged (final state)
- CLI interface unchanged
- Only internal parsing strategy modified

## Testing Strategy

1. Unit tests for JSON parser with mock LLM outputs
2. Integration tests with real LLM calls
3. E2E test: Full pipeline with unsloth topic

## Performance Impact

- **Latency**: Slight increase due to multiple LLM calls
- **Reliability**: Significantly improved success rate
- **Cost**: ~N+1 LLM calls instead of 1 (N = scene count)
