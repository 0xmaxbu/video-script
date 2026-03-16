## ADDED Requirements

### Requirement: 研究 Agent 输入处理
研究 Agent SHALL 接受结构化的研究输入。

#### Scenario: 接收标题和链接
- **WHEN** Agent 接收包含 title 和 links 的输入
- **THEN** Agent 使用 WebFetch Tool 抓取每个链接的页面内容

#### Scenario: 接收文档内容
- **WHEN** Agent 接收包含 document 的输入
- **THEN** Agent 将文档内容作为额外信息来源

#### Scenario: 接收本地文件路径
- **WHEN** Agent 接收包含 documentFile 的输入
- **THEN** Agent 读取本地文件内容作为额外信息来源

### Requirement: 网页信息抓取
研究 Agent SHALL 能够抓取网页内容。

#### Scenario: 抓取外部链接
- **WHEN** Agent 收到抓取请求，包含有效 URL
- **THEN** Agent 使用 WebFetch Tool 获取页面内容

#### Scenario: 处理无效链接
- **WHEN** Agent 收到无效或无法访问的链接
- **THEN** Agent 记录错误并继续处理其他链接

### Requirement: 内容分析
研究 Agent SHALL 使用 LLM 分析抓取的内容。

#### Scenario: 生成技术概述
- **WHEN** Agent 完成内容抓取后
- **THEN** Agent 生成 2-3 段技术概述

#### Scenario: 提取核心特性
- **WHEN** Agent 分析内容时
- **THEN** Agent 提取 3-5 个核心特性

#### Scenario: 提取代码示例
- **WHEN** Agent 分析内容时
- **THEN** Agent 提取 2-3 个相关代码示例，包括代码内容和语言

#### Scenario: 识别需要截图的页面
- **WHEN** Agent 分析内容时
- **THEN** Agent 识别 2-4 个需要截图的页面，输出 URL 和理由

### Requirement: 研究输出结构化
研究 Agent SHALL 输出结构化的研究结果。

#### Scenario: 输出包含摘要
- **WHEN** Agent 完成研究后
- **THEN** 输出包含 summary 字段，类型为 string

#### Scenario: 输出包含特性列表
- **WHEN** Agent 完成研究后
- **THEN** 输出包含 keyFeatures 字段，类型为 string[]

#### Scenario: 输出包含代码示例
- **WHEN** Agent 完成研究后
- **THEN** 输出包含 codeExamples 字段，类型为 CodeBlock[]

#### Scenario: 输出包含截图任务
- **WHEN** Agent 完成研究后
- **THEN** 输出包含 screenshots 字段，类型为 Screenshot[]
