## ADDED Requirements

### Requirement: 渲染 API 接口定义

渲染模块 SHALL 提供清晰的 API 接口，供主系统调用：

#### Scenario: RenderInput 输入格式

- **WHEN** 调用渲染功能时
- **THEN** 输入必须包含以下字段：
  - `script`: ScriptOutput 对象（必须）
  - `screenshots`: 截图文件路径映射 Record<string, string>（必须）
  - `outputDir`: 输出目录路径 string（必须，pattern: `^[a-zA-Z0-9/_-]+$`）
  - `videoFileName`: 输出视频文件名 string（必须，默认值: `output.mp4`）

#### Scenario: RenderOutput 输出格式

- **WHEN** 渲染完成时
- **THEN** 输出必须包含以下字段：
  - `success`: boolean，必须为 true 表示成功
  - `videoPath`: string，成功时必须包含视频文件完整路径
  - `duration`: number，成功时必须包含视频时长（秒）
  - `error`: string（可选），仅当 success 为 false 时必须包含错误信息

### Requirement: SRT 字幕生成 API

渲染模块 SHALL 提供独立的 SRT 字幕生成功能：

#### Scenario: 生成 SRT 文件

- **WHEN** 调用 `generateSrt(input, outputPath)` 时
- **THEN** 生成符合 SRT 格式的字幕文件

#### Scenario: SRT 输入格式

- **WHEN** 生成字幕时
- **THEN** 输入必须包含：
  - `title`: 视频标题
  - `totalDuration`: 总时长
  - `scenes`: 场景数组，每个包含 `id`、`title`、`narration`、`duration`
