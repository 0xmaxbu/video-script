## Why

项目当前使用 OpenAI GPT-4 Turbo 作为默认 LLM，每次调用成本较高。MiniMax-M2.5 是国产大模型，性能接近 GPT-4 且成本更低。API Key 已保存在 .env 文件中，可以快速切换以降低运营成本。

## What Changes

- 修改所有 Agent 的 model 配置：从 `openai/gpt-4-turbo` 改为 `minimax-cn-coding-plan/MiniMax-M2.5`
- 更新 .env 文件：添加 `MINIMAX_API_KEY` 配置（Coding Plan 专用）
- 验证 LLM 通信：运行测试确保模型切换后功能正常

## Capabilities

### New Capabilities

- `minimax-integration`: 将项目 LLM 提供商从 OpenAI 切换到 MiniMax

### Modified Capabilities

- 无

## Impact

- 修改文件：
  - `src/mastra/agents/research-agent.ts`
  - `src/mastra/agents/script-agent.ts`
  - `src/mastra/agents/screenshot-agent.ts`
  - `src/mastra/agents/compose-agent.ts`
  - `.env`
- 依赖：无新增依赖，使用现有的 OpenAI SDK
- 测试：需要运行测试验证模型切换后功能正常
