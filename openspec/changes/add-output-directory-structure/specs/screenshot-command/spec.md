## ADDED Requirements

### Requirement: 读取 script.json

系统 SHALL 从输出目录读取 script.json 进行批量截图。

#### Scenario: 批量截图
- **WHEN** 执行 `video-script screenshot <目录>`
- **THEN** 系统 SHALL 按顺序为每个 scene 生成截图文件，- 系统自动生成文件名 `scene-001.png`, `scene-002.png` 等
- 保存到输出目录

### Requirement: 网页截图
- **WHEN** 场景类型为 `url`
- **THEN** 系统 SHALL 使用 Playwright 截取指定 URL 的网页

### Requirement: 纯文字截图
- **WHEN** 场景类型为 `text`
- **THEN** 系统 SHALL 生成临时 HTML 并截图
