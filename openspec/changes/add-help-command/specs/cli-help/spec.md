## ADDED Requirements

### Requirement: CLI 帮助信息显示

CLI 帮助系统 SHALL 在用户执行 `video-script help` 或 `video-script --help` 时显示项目级帮助信息，包括：

- 项目简介（一句话描述工具用途）
- 工作流程说明（research → script → screenshot → compose）
- 快速开始命令示例
- 所有子命令列表及简要说明
- 配置要求说明

#### Scenario: 显示项目帮助

- **WHEN** 用户执行 `video-script help` 命令
- **THEN** 系统显示项目级帮助信息，包含上述所有内容

#### Scenario: 显示命令帮助

- **WHEN** 用户执行 `video-script <command> --help` 命令
- **THEN** 系统显示特定命令的详细帮助信息

### Requirement: 帮助内容中文显示

帮助信息 SHALL 使用中文显示。

#### Scenario: 中文帮助显示

- **WHEN** 用户执行 `video-script help`
- **THEN** 系统显示中文帮助信息
