## ADDED Requirements

### Requirement: 独立的渲染 CLI 命令

独立的渲染 CLI 工具 SHALL 作为一个独立的 npm 包发布，包含以下功能：

#### Scenario: 安装独立渲染包

- **WHEN** 用户执行 `npm install -g @video-script/renderer`
- **THEN** 渲染 CLI 被全局安装，可以执行 `video-script-render` 命令

#### Scenario: 查看渲染帮助

- **WHEN** 用户执行 `video-script-render --help`
- **THEN** 显示可用命令和选项说明

### Requirement: 渲染命令接受标准输入

渲染 CLI SHALL 接受 JSON 格式的输入参数：

#### Scenario: 执行渲染任务

- **WHEN** 用户执行 `video-script-render render --input <json-file>`
- **THEN** CLI 读取输入文件，使用 Remotion 渲染视频，输出到指定目录

#### Scenario: 渲染进度输出

- **WHEN** 渲染过程进行中
- **THEN** CLI 输出实时进度百分比（0-100）

### Requirement: 渲染结果返回

渲染 CLI SHALL 返回标准化的结果：

#### Scenario: 渲染成功

- **WHEN** 视频渲染成功完成
- **THEN** CLI 输出 JSON 格式结果，包含 `success: true`、`videoPath`、`duration` 字段

#### Scenario: 渲染失败

- **WHEN** 视频渲染失败
- **THEN** CLI 输出 JSON 格式错误，包含 `success: false`、`error` 字段，退出码为 1
