## ADDED Requirements

### Requirement: 脚本生成
脚本 Agent SHALL 根据研究结果生成视频脚本。

#### Scenario: 生成场景划分
- **WHEN** Agent 接收研究结果后
- **THEN** Agent 生成 3-5 个场景，包括开场、特性展示、代码演示、结尾

#### Scenario: 生成旁白文案
- **WHEN** Agent 为每个场景生成内容时
- **THEN** Agent 生成对应的旁白文案（narration），类型为 string

#### Scenario: 规划时间轴
- **WHEN** Agent 生成场景时
- **THEN** Agent 为每个场景规划持续时间（duration），单位为秒

### Requirement: 视觉指令生成
脚本 Agent SHALL 为每个场景生成视觉呈现指令。

#### Scenario: 生成视觉指令
- **WHEN** Agent 生成场景时
- **THEN** Agent 生成对应的 VisualSpec，包含布局、动画、过渡效果描述

#### Scenario: 代码动画指令
- **WHEN** 场景类型为 code 时
- **THEN** Agent 生成 CodeAnimation 指令，包括高亮行、动画类型

### Requirement: 输出格式
脚本 Agent SHALL 输出符合规范的结构化脚本。

#### Scene 类型支持
- **WHEN** Agent 生成场景时
- **THEN** 场景类型（type）必须是 intro、feature、code、demo 或 outro 之一

#### 时间轴汇总
- **WHEN** Agent 完成脚本生成后
- **THEN** 输出包含 totalDuration 字段，表示视频总时长（秒）

#### 画幅设置
- **WHEN** Agent 生成脚本时
- **THEN** 输出包含 aspectRatio 字段，值为 "16:9" 或 "9:16"（默认 16:9）

### Requirement: 脚本审核交互
脚本 Agent SHALL 支持审核节点的交互。

#### Scenario: 逐场景展示
- **WHEN** 审核节点激活时
- **THEN** 系统逐个展示场景的旁白和视觉指令

#### Scenario: 场景编辑
- **WHEN** 用户选择编辑某个场景时
- **THEN** 系统允许修改该场景的旁白内容

#### Scenario: 场景重新生成
- **WHEN** 用户选择重新生成某个场景时
- **THEN** Agent 重新生成该场景并展示结果
