## Why

由于 Node.js v24 与当前 Remotion 版本存在兼容性问题，导致视频渲染功能无法正常工作。为了解决这个依赖冲突问题，同时保持系统的模块化和可维护性，需要将 Remotion 视频渲染等功能独立为单独的 CLI 命令（独立打包）。主系统通过 CLI 调用的方式与渲染模块交互，避免版本冲突。

## What Changes

- 创建独立的 `@video-script/renderer` npm 包，必须包含 Remotion 视频渲染相关功能
- 新增独立 CLI 命令 `video-script-render`，可独立安装和使用
- 修改主 CLI `video-script` 通过子进程调用 `video-script-render` 执行渲染任务
- 将截图、代码高亮等功能迁移到独立包中
- 实现进程隔离，必须避免不同模块间的依赖冲突

## Capabilities

### New Capabilities

- `renderer-cli`: 独立的视频渲染 CLI 工具包，可独立部署和调用
- `renderer-api`: 渲染模块的 API 接口定义，供主系统调用
- `process-manager`: 子进程管理模块，处理 CLI 调用和结果

### Modified Capabilities

- `cli-composition`: 主 CLI 的 compose 命令改为调用子进程渲染

## Impact

- 新增 `packages/renderer` 目录，包含独立渲染模块
- 修改 `src/cli/index.ts` 中的 compose 命令实现
- 修改 `package.json` 添加新包依赖或独立包配置
- 移除主项目对 `@remotion/studio` 的直接依赖
