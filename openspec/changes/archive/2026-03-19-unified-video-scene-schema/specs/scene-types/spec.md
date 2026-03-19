# Scene Types Specification

## ADDED Requirements

### Requirement: Intro 场景类型

`intro` 类型用于视频开场，引入主题。

#### Scenario: 标准开场

- **WHEN** 场景类型为 `intro`
- **THEN** 场景包含：
  - title: 视频主标题
  - narration: 简短介绍（10-20 字）
  - duration: 10-15 秒
  - visualLayers: 可选（logo、背景图）

#### Scenario: 无视觉层开场

- **WHEN** intro 场景无 visualLayers
- **THEN** 仅显示标题和旁白，使用默认背景色

### Requirement: Feature 场景类型

`feature` 类型用于主要内容展示，是视频的核心部分。

#### Scenario: 标准功能展示

- **WHEN** 场景类型为 `feature`
- **THEN** 场景包含：
  - title: 功能/概念名称
  - narration: 详细解释（50-150 字）
  - duration: 20-60 秒
  - visualLayers: 至少 1 个（截图、图表等）

#### Scenario: 多视觉功能展示

- **WHEN** feature 场景需要展示多个相关内容
- **THEN** visualLayers 包含多个层（如截图 + 文字标注）

### Requirement: Code 场景类型

`code` 类型用于代码演示，必须包含代码内容。

#### Scenario: 标准代码演示

- **WHEN** 场景类型为 `code`
- **THEN** 场景包含：
  - title: 代码功能名称
  - narration: 代码解释（30-100 字）
  - duration: 30-90 秒
  - code: { language, code, highlightLines }

#### Scenario: 代码高亮

- **WHEN** code.highlightLines 指定
- **THEN** 指定行在渲染时被高亮

#### Scenario: 打字机效果

- **WHEN** code 场景使用 typewriter 动画
- **THEN** 代码逐字符显示，模拟实时编码

### Requirement: Outro 场景类型

`outro` 类型用于视频结尾，总结和行动号召。

#### Scenario: 标准结尾

- **WHEN** 场景类型为 `outro`
- **THEN** 场景包含：
  - title: 总结标题（如 "总结"、"感谢观看"）
  - narration: 总结内容和 CTA（20-50 字）
  - duration: 10-15 秒
  - visualLayers: 可选（链接、二维码）

#### Scenario: 带链接结尾

- **WHEN** outro 场景包含链接信息
- **THEN** visualLayers 包含 text 类型层显示链接

### Requirement: 场景类型决定默认布局

不同场景类型有不同的默认布局和视觉风格。

#### Scenario: Intro 默认布局

- **WHEN** intro 场景无显式布局配置
- **THEN** 使用居中布局，大字体标题

#### Scenario: Feature 默认布局

- **WHEN** feature 场景无显式布局配置
- **THEN** 视觉层居中，旁白在底部

#### Scenario: Code 默认布局

- **WHEN** code 场景无显式布局配置
- **THEN** 代码占据大部分屏幕，旁白在底部

### Requirement: 场景顺序语义

场景顺序应遵循叙事逻辑：intro → feature/code → outro。

#### Scenario: 标准叙事结构

- **WHEN** 脚本包含多个场景
- **THEN** 第一个场景为 `intro`，最后一个为 `outro`，中间为 `feature` 或 `code`

#### Scenario: 多 feature 场景

- **WHEN** 脚本包含多个功能点
- **THEN** 可以有多个 `feature` 场景，每个聚焦一个概念

### Requirement: 场景类型与时长建议

不同类型有不同的推荐时长范围。

| Type    | Recommended Duration | Rationale                  |
| ------- | -------------------- | -------------------------- |
| intro   | 10-15s               | 快速引入，吸引注意力       |
| feature | 20-60s               | 足够解释概念，保持节奏     |
| code    | 30-90s               | 代码需要更多时间阅读和理解 |
| outro   | 10-15s               | 简洁总结，行动号召         |

#### Scenario: 时长超出建议

- **WHEN** feature 场景 duration > 60s
- **THEN** 系统发出警告，建议拆分为多个场景

#### Scenario: 时长低于建议

- **WHEN** code 场景 duration < 30s
- **THEN** 系统发出警告，建议增加时长或简化代码
