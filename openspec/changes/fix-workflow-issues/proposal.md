## Why

当前 video-script 项目的 workflow 存在三个关键问题导致无法正常运行：

1. **Schema 不匹配**：Agent 的输出格式与 Zod schema 定义不一致，导致 workflow 步骤间的数据流断裂
2. **Human Review 未处理**：workflow 有 suspend 步骤，但 CLI 没有处理 suspended 状态和 resume 逻辑
3. **CLI workflow id 错误**：CLI 使用 `"videoGeneration"` 而 workflow 定义为 `"video-generation-workflow"`

这些问题使得整个视频生成流程无法完成，需要立即修复。

## What Changes

- **修复 ResearchOutputSchema**：扩展 schema 以匹配 research-agent 的实际输出结构
- **修复 ScriptOutputSchema/SceneSchema**：调整 schema 以支持 startTime/endTime 和 visualType 字段
- **添加数据转换步骤**：在 workflow 中添加转换逻辑，将 agent 输出规范化为下游步骤期望的格式
- **修复 CLI workflow id**：将 `"videoGeneration"` 改为 `"video-generation-workflow"`
- **实现 Human Review 处理**：
  - CLI 检测 suspended 状态并显示脚本内容
  - 支持 `--no-review` 跳过审核
  - 添加 `resume` 命令恢复 suspended 的 workflow

## Capabilities

### New Capabilities

- `human-review-handling`: CLI 对 workflow suspend/resume 的完整处理能力
- `workflow-schema-normalization`: Agent 输出到标准化 schema 的转换能力

### Modified Capabilities

- `video-generation-workflow`: 修复 schema 定义以匹配 agent 实际输出
- `cli-workflow-integration`: 修复 workflow id 并添加 suspend 状态处理

## Impact

**受影响的文件**：

- `src/types/index.ts` - 修改 ResearchOutputSchema 和 SceneSchema
- `src/mastra/workflows/video-generation-workflow.ts` - 添加数据转换步骤
- `src/cli/index.ts` - 修复 workflow id，添加 suspend 处理和 resume 命令

**API 影响**：

- CLI 新增 `resume <runId>` 命令
- CLI `create` 命令新增 `--no-review` 选项的行为

**依赖影响**：无
