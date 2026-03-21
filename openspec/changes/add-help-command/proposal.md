## Why

当前项目的 `help` 命令仅依赖 Commander.js 内置的简短帮助信息，无法为用户提供完整的使用指导。新用户难以理解完整的工作流程、配置要求和最佳实践。需要一个更详细的内置帮助系统。

## What Changes

- 添加 `video-script help` 子命令，显示项目级帮助信息
- 添加 `video-script quickstart` 子命令，提供交互式快速入门引导
- 在 `--help` 输出中增加工作流程说明和常见用例
- 添加中文帮助支持

## Capabilities

### New Capabilities

- `cli-help`: CLI 帮助系统，包括项目介绍、工作流程、使用示例和配置说明

## Impact

- 改动范围：`src/cli/` 目录
- 无需新增依赖
- 向后兼容：现有命令行为不变
