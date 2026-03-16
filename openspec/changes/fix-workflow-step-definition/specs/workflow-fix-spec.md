# Video Generation Workflow 修复

## MODIFIED Requirements

### Requirement: Workflow Step 注册方式

video-generation-workflow SHALL 使用 Mastra v1.x API 定义步骤。

#### Scenario: 使用 .then() 链式调用

- **WHEN** workflow 被定义
- **THEN** 使用 `.then(step)` 链式调用注册步骤
- **AND** 在末尾调用 `.commit()` 完成定义

#### Scenario: Steps 被正确识别

- **WHEN** 获取 workflow 实例
- **THEN** `wf.steps` 包含所有定义的步骤
- **AND** 步骤数量等于 6 (research, script, map, humanReview, screenshot, compose)
