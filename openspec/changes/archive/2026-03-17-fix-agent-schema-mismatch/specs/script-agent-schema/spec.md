## ADDED Requirements

### Requirement: Script Agent 必须输出符合 ScriptOutputSchema 的 JSON

Script Agent 生成的 JSON 输出 SHALL 完全符合 `src/types/script.ts` 中定义的 `ScriptOutputSchema`。

#### Scenario: Agent 输出有效 JSON 格式

- **WHEN** Script Agent 处理研究数据并生成脚本
- **THEN** 输出 JSON 包含以下必需字段：
  - `title`: string（非空）
  - `scenes`: array（最小长度 1，最大长度 30）
  - 每个 scene 包含：
    - `order`: number（正整数）
    - `segmentOrder`: number（正整数）
    - `type`: "url" 或 "text"
    - `content`: string（非空）

#### Scenario: Agent 输出 transitions

- **WHEN** Script Agent 生成场景转换
- **THEN** `transitions` 数组（如果存在）中的每个转换包含：
  - `from`: number（正整数）
  - `to`: number（正整数）
  - `type`: "sceneFade" | "sceneSlide" | "sceneZoom"
  - `duration`: number（最小 0.1，最大 5）

### Requirement: CLI 自动加载环境变量

CLI 入口 SHALL 在启动时自动加载项目根目录的 `.env` 文件。

#### Scenario: 使用 .env 文件运行 CLI

- **WHEN** 用户运行 `video-script research "Title"` 且 `.env` 文件存在
- **THEN** CLI 自动读取 `.env` 中的环境变量并使用
- **AND** 无需用户手动执行 `export $(cat .env | xargs)`

#### Scenario: .env 文件不存在

- **WHEN** `.env` 文件不存在
- **THEN** CLI 继续执行，使用系统环境变量或配置默认值
- **AND** 不抛出错误

### Requirement: CLI 输出 JSON 解析失败时的 Fallback 行为

当 Agent 返回的 JSON 无法直接通过 Schema 验证时，CLI SHALL 尝试智能修复或提供有意义的错误信息。

#### Scenario: JSON 解析成功但 Schema 验证失败

- **WHEN** Agent 返回的 JSON 可以解析但不符合 Schema
- **THEN** CLI 显示详细的验证错误信息
- **AND** 指出具体缺少或错误的字段

#### Scenario: JSON 完全无法解析

- **WHEN** Agent 返回的文本不包含有效 JSON
- **THEN** CLI 抛出错误并显示原始输出
- **AND** 建议检查 Agent 响应格式
