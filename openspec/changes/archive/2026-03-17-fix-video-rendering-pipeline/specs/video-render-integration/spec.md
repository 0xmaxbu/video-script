## ADDED Requirements

### Requirement: CLI compose 命令必须调用 renderVideo 生成实际视频文件

CLI 的 compose 命令 SHALL 直接调用 renderVideo() 函数来生成实际的 MP4 视频文件，不经过任何 agent 中间层。

#### Scenario: compose 命令成功渲染视频

- **WHEN** 用户运行 `video-script compose <dir>` 且 script.json 和 screenshots 目录存在
- **THEN** 系统直接调用 renderVideo() 生成 output.mp4 文件

#### Scenario: 截图资源映射构建

- **WHEN** compose 命令需要构建 screenshotResources 映射
- **THEN** 系统基于 scene.order 直接构建文件名：`scene-{order}.png`（如 scene-001.png）

### Requirement: video-renderer.ts 必须兼容新的 ScriptOutputSchema

video-renderer.ts 的 RenderVideoInputSchema SHALL 兼容新的 ScriptOutputSchema 格式（包含 order, segmentOrder, type, content, screenshot, effects 字段），而不是旧的 id/type/title/narration/duration 格式。

#### Scenario: 使用新格式脚本渲染

- **WHEN** renderVideo() 接收使用新格式的 ScriptOutput
- **THEN** 系统正确处理 scenes 数组中的每个场景

#### Scenario: 计算总时长

- **WHEN** ScriptOutput 不包含 totalDuration 字段
- **THEN** renderVideo SHALL 基于 scenes 数量计算总时长（默认每个场景 10 秒）

### Requirement: compose 命令失败时返回明确错误

当视频渲染过程中发生错误时，compose 命令 SHALL 返回用户友好的错误信息，而不是静默失败。

#### Scenario: 渲染失败

- **WHEN** renderVideo() 返回 success: false
- **THEN** CLI SHALL 显示错误信息并以非零退出码终止

### Requirement: renderVideo 直接输出进度日志到 CLI

renderVideo() SHALL 通过 onProgress 回调输出进度信息到 CLI，让用户了解渲染状态。

#### Scenario: 渲染进度日志

- **WHEN** 视频正在渲染
- **THEN** CLI 显示进度百分比（如 "渲染中: 50%"）

### Requirement: SRT 字幕文件生成

compose 命令 SHALL 在视频渲染完成后生成对应的 SRT 字幕文件。

#### Scenario: 字幕文件生成

- **WHEN** 视频渲染成功
- **THEN** 系统在输出目录生成 output.srt 字幕文件
