## Why

当前 E2E 测试在 Step 4 (Compose/Render) 阶段失败，因为 CLI 的 `compose` 命令没有实际调用视频渲染函数。compose 命令仅调用了 composeAgent.generate() 获取结果，但从未调用 `renderVideo()` 或 `generateRemotionProject()` 来生成实际的 MP4 视频文件。这导致整个视频生成流程在最后一步无法产生最终输出。

## What Changes

1. **启用 renderVideo 函数调用** - 在 compose 命令中取消注释并调用 `renderVideo()` 函数
2. **修复 video-renderer.ts schema 不匹配** - 更新 `RenderVideoInputSchema` 以匹配新的 `ScriptOutputSchema` 格式（移除 totalDuration 和旧字段）
3. **传递 screenshotResources** - 收集截图资源路径并传递给渲染函数
4. **生成 SRT 字幕文件** - 在渲染完成后调用 SRT 生成器创建字幕文件
5. **移除 composeAgent** - MVP 简化流程，直接调用 renderVideo()
6. **renderVideo 输出日志** - 通过 onProgress 回调输出进度到 CLI

## Capabilities

### New Capabilities

- `video-render-integration`: 集成完整的视频渲染管道到 CLI compose 命令

### Modified Capabilities

- `script-schema`: 现有脚本 schema 已被修改为新格式（order/segmentOrder/type/content），需要更新 video-renderer 以兼容

## Impact

- 需要修改 `src/cli/index.ts` - compose 命令实现
- 需要修改 `src/utils/video-renderer.ts` - 输入 schema 更新
- 需要修改 `src/types/script.ts` - 可能需要添加 totalDuration 计算属性
