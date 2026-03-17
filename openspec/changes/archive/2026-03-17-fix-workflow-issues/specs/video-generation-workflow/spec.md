# Video Generation Workflow Specification

## ADDED Requirements

### Requirement: Workflow 使用正确的 ID

videoGenerationWorkflow SHALL 使用 `"video-generation-workflow"` 作为 ID。

#### Scenario: Workflow ID 一致性

- **WHEN** workflow 被创建
- **THEN** workflow.id 等于 "video-generation-workflow"
- **AND** CLI 使用相同的 ID 获取 workflow

### Requirement: ResearchStep 输出匹配 ResearchOutputSchema

researchStep SHALL 输出符合 ResearchOutputSchema 的数据。

#### Scenario: Research 输出验证

- **WHEN** researchStep 执行完成
- **THEN** 输出数据通过 ResearchOutputSchema 验证
- **AND** 包含 title, overview, keyPoints, scenes, sources 字段

### Requirement: ScriptStep 输出匹配 ScriptOutputSchema

scriptStep SHALL 输出符合 ScriptOutputSchema 的数据。

#### Scenario: Script 输出验证

- **WHEN** scriptStep 执行完成
- **THEN** 输出数据通过 ScriptOutputSchema 验证
- **AND** 包含 title, totalDuration, scenes 字段
- **AND** 每个 scene 符合 SceneSchema 定义

### Requirement: HumanReviewStep 支持 skip 标志

humanReviewStep SHALL 检查 `_skipReview` 标志以决定是否 suspend。

#### Scenario: Skip review 标志存在

- **WHEN** inputData.\_skipReview === true
- **THEN** humanReviewStep 跳过 suspend() 调用
- **AND** 直接返回 inputData

#### Scenario: Skip review 标志不存在

- **WHEN** inputData.\_skipReview 不存在或为 false
- **THEN** humanReviewStep 调用 suspend(inputData, { resumeLabel: "script-approved" })
- **AND** workflow 进入 suspended 状态

### Requirement: HumanReviewStep 支持 resume

humanReviewStep SHALL 在 resume 时使用 resumeData。

#### Scenario: Resume with approved script

- **WHEN** run.resume() 被调用并传入 resumeData
- **THEN** humanReviewStep 返回 resumeData
- **AND** workflow 继续执行 screenshotStep
