## ADDED Requirements

### Requirement: 使用 MiniMax-M2.5 模型作为默认 LLM

项目所有 Agent SHALL 使用 MiniMax-M2.5 模型进行 LLM 调用，替代原有的 OpenAI GPT-4 Turbo。

#### Scenario: Agent 使用 MiniMax 模型

- **WHEN** Mastra 初始化 Agent 时
- **THEN** Agent SHALL 使用 `minimax-cn-coding-plan/MiniMax-M2.5` 作为 model 配置（Mastra 使用 provider/model 格式）

### Requirement: 配置 MiniMax API 端点

项目 SHALL 通过环境变量配置 MiniMax Coding Plan API 端点，使得 Mastra 可以连接到 MiniMax 服务。

#### Scenario: 环境变量配置正确

- **WHEN** .env 文件包含 `MINIMAX_API_KEY`
- **THEN** Mastra SHALL 连接到 MiniMax Coding Plan API

### Requirement: 验证 LLM 通信正常

切换模型后 SHALL 验证所有 Agent 可以正常与 MiniMax 模型通信。

#### Scenario: 测试通过

- **WHEN** 运行 `npm test`
- **THEN** 所有测试 SHALL 通过，确保功能正常
