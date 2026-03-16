## ADDED Requirements

### Requirement: 读取 script.json

系统 SHALL 从输出目录读取 script.json 和所有截图文件。

#### Scenario: 读取成功
- **WHEN** 执行 `video-script compose <目录>`
- **THEN** 系统 SHALL 读取 `script.json` 和所有 scene-*.png 文件

### Requirement: 视频输出
系统 SHALL 生成 `output.mp4` 文件，使用 H.264 编码。

#### Scenario: 生成成功
- **WHEN** compose 阶段完成
- **THEN** 系统 SHALL 生成 `output.mp4`

### Requirement: 字幕输出

系统 SHALL 生成 `output.srt` 文件。

#### Scenario: 生成成功
- **WHEN** compose 阶段完成
- **THEN** 系统 SHALL 生成 `output.srt`
