## ADDED Requirements

### Requirement: 输出目录自动生成

系统 SHALL 根据当前日期和视频选题自动生成结构化输出目录，目录格式为 `{基准路径}/{年}/{月日-月日}_{选题slug}/`。

#### Scenario: 生成标准目录

- **WHEN** 用户执行 `video-script create "TypeScript 泛型教程"` 且当前日期为 2026 年 3 月 9 日-3 月 15 日
- **THEN** 系统 SHALL 创建目录 `{cwd}/output/2026/3-9_3-15_typescript-generics-tutorial/`

#### Scenario: 使用 --output 参数覆盖

- **WHEN** 用户执行 `video-script create "测试" --output /custom/path`
- **THEN** 系统 SHALL 使用 `/custom/path` 作为输出基准路径，所有文件（包括视频）都保存到该路径下

#### Scenario: 选题名包含特殊字符

- **WHEN** 用户执行 `video-script create "React Hooks: 完整指南"`
- **THEN** 系统 SHALL 将选题转换为 slug 格式，移除冒号等非法字符，生成目录如 `2026/3-9_3-15_react-hooks-wanzheng-zhinan/`

#### Scenario: 目录已存在

- **WHEN** 目标目录已存在
- **THEN** 系统 SHALL 继续使用该目录，不报错

#### Scenario: 基准路径权限安全

- **WHEN** 在没有 root 权限的环境下运行
- **THEN** 系统 SHALL 使用 `process.cwd()/output/` 作为默认基准路径，避免权限问题

### Requirement: 月日范围计算

系统 SHALL 正确计算月日范围，格式为 `M1-D1_M2-D2`。

#### Scenario: 同月范围

- **WHEN** 当前日期为 2026 年 3 月 9 日至 3 月 15 日
- **THEN** 系统 SHALL 生成范围 `3-9_3-15`

#### Scenario: 跨月范围

- **WHEN** 当前日期为 2026 年 3 月 28 日至 4 月 3 日
- **THEN** 系统 SHALL 生成范围 `3-28_4-3`

### Requirement: 选题 slug 转换

系统 SHALL 将中文选题转换为 URL 友好的 slug 格式。

#### Scenario: 纯中文选题

- **WHEN** 输入选题 "Python 装饰器"
- **THEN** 系统 SHALL 转换为 `python-zhuang-shi-qi`

#### Scenario: 中英混合选题

- **WHEN** 输入选题 "React useEffect 详解"
- **THEN** 系统 SHALL 转换为 `react-useeffect-xiang-jie`

#### Scenario: 特殊字符处理

- **WHEN** 输入选题包含 `:` `/` `\` `?` `*` `"` `<` `>` `|`
- **THEN** 系统 SHALL 移除这些字符，不使用任何替代符
