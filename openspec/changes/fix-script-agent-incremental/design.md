# Design: 修复 Script Agent - 增量场景生成

## 架构概述

### 当前问题

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   LLM       │────▶│  CLI JSON Parser │────▶│   FAIL     │
│  (不稳定)    │     │ (单一 JSON)      │     │  (截断)     │
└─────────────┘     └──────────────────┘     └─────────────┘
```

### 解决方案

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   LLM       │────▶│  多 JSON 解析器   │────▶│  场景验证器 │
│  (1 场景)   │     │                  │     │            │
└─────────────┘     └──────────────────┘     └─────────────┘
```

## 组件变更

### 1. CLI JSON 解析器 (`src/utils/json-parser.ts`)

**新增工具函数**：

```typescript
interface JSONParseResult {
  success: boolean;
  data?: ScriptOutput;
  error?: string;
  candidatesTried: number;
  bestScore: number;
}

function parseScriptFromLLMOutput(textContent: string): JSONParseResult;
```

**算法**：

1. 按代码块分割：`text.split(/```json\s*/).slice(1)`
2. 对每个代码块尝试：
   - 直接 `JSON.parse()`
   - 括号计数法从截断的 JSON 中提取完整对象
3. 评分：`scenes.length * 100 + (title ? 10 : 0) + (totalDuration ? 5 : 0)`
4. 返回评分最高的有效解析

### 2. Script Agent 流式策略

**阶段 1**：生成场景结构（不含 visualLayers）

```typescript
const structurePrompt = `
根据研究数据创建场景结构（不含visualLayers）。

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
```

**阶段 2-N**：为每个场景生成 visualLayers

```typescript
const scenePrompt = `
为 scene-N 生成 visualLayers。

输出格式:
{
  "sceneId": "scene-N",
  "visualLayers": [...]
}
`;
```

### 3. 错误处理

- 场景级重试（每个场景最多 3 次）
- 失败时部分保存（已完成的场景保留）
- visualLayers 失败时优雅降级

## 文件变更

| 文件                                | 变更                   |
| ----------------------------------- | ---------------------- |
| `src/utils/json-parser.ts`          | 新增 - 多 JSON 解析器  |
| `src/cli/index.ts`                  | 使用新解析器，处理流式 |
| `src/mastra/agents/script-agent.ts` | 流式场景 prompts       |

## 向后兼容

- `research.json` 格式：不变
- `script.json` 最终格式：不变
- CLI 接口：不变
