## ADDED Requirements

### Requirement: 代码高亮
CodeHighlight Tool SHALL 能够对代码进行语法高亮。

#### Scenario: 基本高亮
- **WHEN** Tool 接收 code 和 language 参数
- **THEN** Tool 返回语法高亮后的 HTML

#### Scenario: 指定语言
- **WHEN** Tool 接收有效的 language 参数
- **THEN** Tool 使用对应语言的语法规则进行高亮

#### Scenario: 支持的语言
- **WHEN** Tool 接收 language 参数为常用语言（javascript, typescript, python, go, rust 等）
- **THEN** Tool 返回正确的高亮结果

### Requirement: 行号高亮
CodeHighlight Tool SHALL 支持高亮指定行。

#### Scenario: 高亮单行
- **WHEN** Tool 接收包含单个行号的 highlightLines
- **THEN** Tool 在输出中高亮指定的行

#### Scenario: 高亮多行
- **WHEN** Tool 接收包含多个行号的 highlightLines
- **THEN** Tool 在输出中同时高亮指定的行

### Requirement: 代码截图
CodeHighlight Tool SHALL 支持生成代码截图。

#### Scenario: 生成截图
- **WHEN** Tool 接收 generateScreenshot: true
- **THEN** Tool 生成高亮代码的 PNG 截图

#### Scenario: 截图输出
- **WHEN** 截图生成完成时
- **THEN** Tool 返回 imagePath 字段，指向保存的 PNG 文件
