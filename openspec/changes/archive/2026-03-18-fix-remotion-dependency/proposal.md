## Why

Remotion 4.0.435 版本存在依赖问题，导致视频渲染失败。错误信息为 `Can't resolve '@remotion/studio/renderEntry'`，这是由于 Remotion 子包之间的导出配置不正确造成的。这个问题阻止了 E2E 流程中的 Compose/Render 步骤，无法生成 MP4 视频文件和 SRT 字幕文件。

## What Changes

- 修复 Remotion 依赖问题，确保 `@remotion/studio/renderEntry` 模块可以正确解析
- 可能需要降级到稳定版本或升级到补丁版本
- 或修改项目配置以适配新版 Remotion
- 验证视频渲染流程能够正常完成

## Capabilities

### New Capabilities

- `remotion-fix`: 修复 Remotion 依赖问题，使视频渲染流程恢复正常

### Modified Capabilities

- 无

## Impact

- 依赖：需要修改 `package.json` 中的 Remotion 版本或项目配置
- CLI：compose 命令需要能够成功渲染视频
- 输出：生成 MP4 视频文件和 SRT 字幕文件
