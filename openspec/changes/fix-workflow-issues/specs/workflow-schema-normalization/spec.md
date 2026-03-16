# Workflow Schema Normalization Specification

## ADDED Requirements

### Requirement: ResearchOutputSchema 匹配 research-agent 输出

ResearchOutputSchema SHALL 包含 research-agent 实际输出的所有字段。

#### Scenario: Research agent 输出验证

- **WHEN** research-agent 返回包含 title, overview, keyPoints, scenes, sources 的结构
- **THEN** ResearchOutputSchema 验证通过
- **AND** 所有字段都被正确解析

#### Scenario: Research agent 输出包含 scenes

- **WHEN** research-agent 输出包含 scenes 数组
- **THEN** 每个 scene 包含 sceneTitle, duration, description, screenshotSubjects
- **AND** scenes 数据可用于 scriptStep

### Requirement: SceneSchema 支持 startTime/endTime

SceneSchema SHALL 支持 startTime 和 endTime 字段作为 duration 的替代方案。

#### Scenario: Scene 使用 startTime/endTime

- **WHEN** script-agent 输出 scene 包含 startTime 和 endTime
- **THEN** workflow 计算持续时间 duration = endTime - startTime
- **AND** 下游步骤使用统一的 duration 字段

### Requirement: SceneSchema 支持 visualType

SceneSchema SHALL 支持 visualType 字段以描述视觉元素类型。

#### Scenario: Scene 包含 visualType

- **WHEN** script-agent 输出 scene 包含 visualType 字段
- **THEN** visualType 值为 "screenshot" | "code" | "diagram" | "animation" | "text" 之一
- **AND** screenshotAgent 根据 visualType 决定处理方式

### Requirement: 数据转换规范化

Workflow SHALL 在 scriptStep 输出后添加数据转换逻辑。

#### Scenario: Script 输出规范化

- **WHEN** scriptStep 完成
- **THEN** 转换逻辑将 scene.id 从 number 转换为 string
- **AND** 转换逻辑计算 duration（如果只有 startTime/endTime）
- **AND** 转换逻辑将 visualType 映射到 type 字段
- **AND** 转换逻辑构造 screenshot 或 code 对象
