## ADDED Requirements

### Requirement: 写入 JSON 文件

系统 SHALL 提供将数据写入 JSON 文件的工具，写入到当前工作流的输出目录。

#### Scenario: 写入 Research 产出

- **WHEN** 调用 `writeJsonFile` 工具，参数为 `{ path: "research.json", data: { title: "...", keyPoints: [...] } }`
- **THEN** 系统 SHALL 将数据写入 `{输出目录}/research.json`，文件内容为格式化的 JSON

#### Scenario: 覆盖已有文件

- **WHEN** 目标文件已存在
- **THEN** 系统 SHALL 覆盖原文件内容

### Requirement: 读取 JSON 文件

系统 SHALL 提供从当前工作流输出目录读取 JSON 数据的工具。

#### Scenario: 读取 Research 产出

- **WHEN** 调用 `readJsonFile` 工具，参数为 `{ path: "research.json" }`
- **THEN** 系统 SHALL 返回解析后的 JSON 对象

#### Scenario: 文件不存在

- **WHEN** 指定路径的文件不存在
- **THEN** 系统 SHALL 返回错误信息，包含文件名和"文件不存在"提示

### Requirement: 检查文件是否存在（可选）

系统 SHALL 提供检查文件是否存在的工具，用于判断上一阶段是否已完成。

#### Scenario: 文件存在检查

- **WHEN** 调用 `fileExists` 工具，参数为 `{ path: "research.json" }`
- **THEN** 系统 SHALL 返回 `{ exists: true }` 或 `{ exists: false }`
