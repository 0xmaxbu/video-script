## Context

当前 E2E 测试流程在 Step 2 (Script) 阶段失败，原因是 Script Agent 输出的 JSON 格式与 `ScriptOutputSchema` 不匹配。具体问题包括：

1. **Schema 期望格式** (`src/types/script.ts`):
   - `scenes[].order`: number
   - `scenes[].segmentOrder`: number
   - `scenes[].type`: "url" | "text"
   - `scenes[].content`: string
   - `transitions[].type`: "sceneFade" | "sceneSlide" | "sceneZoom"

2. **Agent 当前输出格式** (`src/mastra/agents/script-agent.ts` instructions):
   - `scenes[].id`: number
   - `scenes[].title`: string
   - `scenes[].startTime`: number
   - `scenes[].endTime`: number
   - `scenes[].narration`: string
   - `scenes[].visualType`: string
   - `scenes[].visualContent`: string

3. **次要问题**:
   - CLI 不自动加载 `.env`，需要手动 export
   - 构建产物 dist/ 目录可能未同步最新代码

## Goals / Non-Goals

**Goals:**

- 修复 Script Agent 输出格式，使其与 `ScriptOutputSchema` 完全匹配
- CLI 入口自动加载 `.env` 文件
- 确保 E2E 完整流程可以走通 (research → script → screenshot → compose)

**Non-Goals:**

- 不修改 Schema 定义 (Schema 已正确定义)
- 不修改 Research/Screenshot/Compose Agent
- 不添加新功能或新能力

## Decisions

### Decision 1: 修改 Agent Instructions 而非 Schema

**选择**: 更新 `script-agent.ts` 的 instructions，让 Agent 输出符合 Schema 的格式

**理由**:

- Schema 定义是正确的（已通过测试验证）
- Agent 需要适应 Schema，而非 Schema 适应 Agent
- 改动范围最小，只需修改 instructions 字符串

### Decision 2: 使用 JSON 示例作为 Agent Prompt

**选择**: 在 Agent instructions 中包含完整的 JSON 示例

**理由**:

- LLM 对示例的理解优于纯文字描述
- 可减少输出格式错误

### Decision 3: CLI 自动加载 .env

**选择**: 使用 `dotenv` 包在 CLI 入口自动加载 `.env`

**理由**:

- `dotenv` 是 Node.js 标准做法
- 无需用户手动 export 环境变量

## Risks / Trade-offs

1. **Risk**: Agent 可能仍然输出错误格式
   - **Mitigation**: 添加 CLI 层面的 JSON 解析 fallback 逻辑，当格式不匹配时尝试智能修复

2. **Risk**: Schema 未来可能变化，Agent instructions 需要同步更新
   - **Mitigation**: 在代码注释中标注 Schema 版本号

3. **Risk**: dotenv 加载顺序问题（CLI vs npx）
   - **Mitigation**: 使用 `dotenv/config` 在最早期加载

## Migration Plan

1. 修改 `src/mastra/agents/script-agent.ts` - 更新 instructions
2. 修改 `src/cli/index.ts` - 添加 dotenv 加载
3. 运行 `npm run build` 确保 dist 同步
4. 重新运行 E2E 测试验证修复

## Open Questions

1. 是否需要在 CLI 添加 `--env` 参数显式指定环境变量文件？
2. 是否需要添加 Schema 验证失败时的自动修复逻辑？
