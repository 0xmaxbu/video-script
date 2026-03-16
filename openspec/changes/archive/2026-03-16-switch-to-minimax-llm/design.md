## Context

项目当前使用 OpenAI GPT-4 Turbo 作为所有 Agent 的 LLM 提供商。MiniMax Coding Plan 提供更优惠的价格，使用中国大陆版 API 端点。

当前状态：

- 4 个 Agent 使用 `openai/gpt-4-turbo` 模型
- API Key 已在 .env 文件中保存为 `MINIMAX_CN_API_KEY`（Coding Plan 专用）
- 使用 Mastra 框架管理 Agent

## Goals / Non-Goals

**Goals:**

- 将所有 Agent 的 LLM 从 OpenAI GPT-4 Turbo 切换到 MiniMax-M2.5（Coding Plan）
- 验证切换后 Agent 功能正常工作
- 保持代码兼容性，不引入破坏性变更

**Non-Goals:**

- 不修改 Agent 的指令（instructions）
- 不修改工具（Tools）配置
- 不添加新的 LLM 提供商

## Decisions

1. **使用 MiniMax Coding Plan (中国大陆版)**
   - Provider: `minimax-cn-coding-plan`（Mastra 内置支持）
   - API 端点: `https://api.minimaxi.com`（自动使用 Mastra 内置配置）
   - API Key: 使用 `MINIMAX_API_KEY` 环境变量

2. **Mastra 模型格式**
   - 使用 `minimax-cn-coding-plan/MiniMax-M2.5` 作为模型名称
   - Mastra 使用 `"provider/model"` 格式

3. **环境变量配置**
   - `MINIMAX_API_KEY` 使用 .env 中的 `MINIMAX_CN_API_KEY` 值

## Risks / Trade-offs

- **模型能力差异**：MiniMax-M2.5 与 GPT-4 Turbo 能力可能有差异，可能需要调整 Agent 指令
  - → Mitigation：先切换验证，如有问题再调整
- **API 兼容性**：需确保 Mastra 正确传递模型参数
  - → Mitigation：运行测试验证

## Migration Plan

1. 在 .env 文件中添加 `MINIMAX_API_KEY`（使用 Coding Plan 的 API Key）
2. 修改 4 个 Agent 文件的 model 配置为 `minimax-cn-coding-plan/MiniMax-M2.5`
3. 运行测试验证功能正常
4. 如测试通过，提交代码
