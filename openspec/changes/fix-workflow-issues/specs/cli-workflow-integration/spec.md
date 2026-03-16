# CLI Workflow Integration Specification

## ADDED Requirements

### Requirement: CLI 使用正确的 workflow ID

CLI SHALL 使用 `"video-generation-workflow"` 获取 workflow。

#### Scenario: 获取 workflow

- **WHEN** CLI 调用 mastra.getWorkflow()
- **THEN** 传入的 ID 为 "video-generation-workflow"
- **AND** 成功获取到 workflow 实例

### Requirement: CLI 处理 suspended 状态

CLI SHALL 在 workflow 返回 suspended 状态时进行适当处理。

#### Scenario: Workflow suspended

- **WHEN** run.start() 返回 status === 'suspended'
- **THEN** CLI 停止 spinner
- **AND** CLI 显示 "Workflow suspended for human review"
- **AND** CLI 显示 runId
- **AND** CLI 显示脚本内容
- **AND** CLI 显示 resume 命令提示

#### Scenario: Workflow 成功完成

- **WHEN** run.start() 返回 status === 'success'
- **THEN** CLI 显示成功消息
- **AND** CLI 显示输出文件路径

#### Scenario: Workflow 失败

- **WHEN** run.start() 返回 status === 'error'
- **THEN** CLI 显示错误消息
- **AND** CLI 显示错误详情

### Requirement: CLI 支持 --no-review 选项

CLI SHALL 在 `--no-review` 选项被设置时传递 `_skipReview` 标志。

#### Scenario: --no-review 选项

- **WHEN** 用户执行 `video-script create "标题" --no-review`
- **THEN** CLI 设置 input.\_skipReview = true
- **AND** workflow 跳过 human review 步骤

### Requirement: CLI 提供 resume 命令

CLI SHALL 提供 `resume` 命令以恢复 suspended workflow。

#### Scenario: Resume 命令语法

- **WHEN** 用户执行 `video-script resume <runId> --file <path>`
- **THEN** CLI 解析 runId 和 file 路径
- **AND** CLI 读取 JSON 文件作为 resumeData
- **AND** CLI 调用 workflow.resume()

#### Scenario: Resume 命令缺少参数

- **WHEN** 用户执行 `video-script resume` 没有提供 runId
- **THEN** CLI 显示错误 "Error: runId is required"
- **AND** CLI 显示用法 "Usage: video-script resume <runId> [--file <path>]"

### Requirement: CLI 显示格式化的脚本内容

CLI SHALL 以可读格式显示脚本内容。

#### Scenario: 显示脚本摘要

- **WHEN** workflow suspended
- **THEN** CLI 显示脚本标题和总时长
- **AND** CLI 显示每个场景的序号、标题和时间范围
- **AND** CLI 显示每个场景的旁白预览（前 100 字符）
