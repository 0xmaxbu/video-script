## Why

当前 E2E 测试发现 Script Agent 生成的输出与 `ScriptOutputSchema` 完全不匹配，导致 Step 2 完全失败并阻塞后续所有步骤。Research Agent 工作正常，但 Script Agent 输出的 JSON 结构与 Schema 期望的格式存在严重偏差。

## What Changes

1. **修改 Script Agent 输出格式** - 更新 `src/mastra/agents/script-agent.ts` 的 instructions，使其输出符合 `ScriptOutputSchema` 的 JSON 结构
2. **修复 CLI 环境变量加载** - 在 `src/cli/index.ts` 入口自动加载 `.env` 文件，避免每次手动 export
3. **添加构建后验证** - 在 `package.json` 添加 `postbuild` 脚本确保 dist 目录与最新代码同步

### 关键字段映射

| Schema 期望字段         | 当前 Agent 输出 | 修复方式                                |
| ----------------------- | --------------- | --------------------------------------- |
| `scenes[].order`        | `undefined`     | 添加 `order` 字段                       |
| `scenes[].segmentOrder` | `undefined`     | 添加 `segmentOrder` 字段                |
| `scenes[].type`         | `undefined`     | 使用 `"url"` 或 `"text"`                |
| `scenes[].content`      | `undefined`     | 使用 URL 或旁白文本                     |
| `transitions[].type`    | 错误值          | 限制为 `sceneFade/sceneSlide/sceneZoom` |

## Capabilities

### New Capabilities

- `script-agent-schema`: 定义 Script Agent 必须输出的 JSON 结构，与 `ScriptOutputSchema` 完全对齐

### Modified Capabilities

- 现有 `video-generation` 能力中的 Script 阶段输出格式需要更新

## Impact

- **代码影响**: `src/mastra/agents/script-agent.ts`, `src/cli/index.ts`
- **Schema 影响**: `src/types/script.ts` (已正确定义，只需 Agent 遵守)
- **用户体验**: CLI 应能完整执行 research → script → screenshot → compose 全流程
