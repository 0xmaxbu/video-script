# Human Review Handling Specification

## ADDED Requirements

### Requirement: CLI 检测 workflow suspended 状态

CLI SHALL 在 workflow 进入 suspended 状态时检测并显示相关信息。

#### Scenario: Workflow 进入 suspended 状态

- **WHEN** workflow 执行到 humanReviewStep 并调用 suspend()
- **THEN** CLI 检测到 status === 'suspended'
- **AND** CLI 显示脚本内容供用户审核
- **AND** CLI 显示 runId 和 resume 命令提示

### Requirement: CLI 支持 --no-review 跳过审核

CLI SHALL 支持 `--no-review` 选项以跳过人工审核步骤。

#### Scenario: 使用 --no-review 选项

- **WHEN** 用户执行 `video-script create "标题" --no-review`
- **THEN** workflow 在 humanReviewStep 中检测到 `_skipReview` 标志
- **AND** 跳过 suspend() 调用，直接返回 inputData
- **AND** workflow 继续执行后续步骤

### Requirement: CLI 支持 resume 命令

CLI SHALL 提供 `resume` 命令以恢复 suspended 的 workflow。

#### Scenario: 恢复 suspended workflow

- **WHEN** 用户执行 `video-script resume <runId> --file approved-script.json`
- **THEN** CLI 使用指定的 runId 获取 workflow run
- **AND** CLI 读取 approved-script.json 作为 resumeData
- **AND** CLI 调用 run.resume() 继续执行

#### Scenario: Resume 命令缺少 runId

- **WHEN** 用户执行 `video-script resume` 而没有提供 runId
- **THEN** CLI 显示错误信息 "Error: runId is required"
- **AND** CLI 显示用法提示

### Requirement: CLI 显示脚本内容

CLI SHALL 在 workflow suspended 时以可读格式显示脚本内容。

#### Scenario: 显示脚本内容

- **WHEN** workflow 进入 suspended 状态
- **THEN** CLI 显示脚本标题
- **AND** CLI 显示每个场景的标题、时间范围和旁白
- **AND** CLI 使用适当的颜色和格式化提高可读性
