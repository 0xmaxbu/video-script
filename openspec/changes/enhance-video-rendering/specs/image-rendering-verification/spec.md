## ADDED Requirements

### Requirement: Playwright CLI 截图验证图片渲染

系统 SHALL 提供通过 Playwright CLI 截图验证 Remotion 视频渲染结果的能力。

#### Scenario: 验证 ScreenshotLayer 渲染本地图片

- **WHEN** 执行 `npx playwright screenshot --url "file://<project>/index.html?composition=Video"` 截取视频帧
- **THEN** 截图中 SHALL 显示正确的截图图片，而非空白或错误占位符

#### Scenario: 验证 visualLayers 正确叠加

- **WHEN** 场景包含多个 visualLayers（背景层、内容层、文字层）
- **THEN** 截图 SHALL 正确显示所有图层的叠加效果

#### Scenario: 验证动画效果

- **WHEN** visualLayer 配置了 enter 动画（fadeIn、slideUp 等）
- **THEN** 在动画时间点截取的图片 SHALL 显示正确的动画状态

### Requirement: 截图命令格式

Playwright CLI 截图命令 SHALL 支持以下参数：

- `--output`: 输出截图文件路径
- `--frame`: 指定帧数（可选，默认截取第 0 帧）
- `--viewport`: 视口尺寸（默认 1920x1080）

### Requirement: 截图验证流程

开发者在修改渲染代码后 SHALL 能够：

1. 运行 Remotion 项目
2. 使用 Playwright CLI 截取关键帧
3. 检查截图是否包含预期的视觉内容
