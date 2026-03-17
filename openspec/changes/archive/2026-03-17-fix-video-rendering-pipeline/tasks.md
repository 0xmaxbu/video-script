## 1. 修复 video-renderer.ts Schema 兼容性

- [x] 1.1 更新 RenderVideoInputSchema，移除 totalDuration 依赖，改用 scenes.length 计算
- [x] 1.2 添加 calculateTotalDuration 辅助函数
- [x] 1.3 验证 schema 与 ScriptOutputSchema 兼容

## 2. 修改 CLI compose 命令

- [x] 2.1 移除 composeAgent 导入（cli/index.ts）
- [x] 2.2 取消注释 renderVideo 导入
- [x] 2.3 直接调用 renderVideo() 替代 composeAgent.generate()
- [x] 2.4 构建 screenshotResources（基于 scene.order）
- [x] 2.5 添加 onProgress 回调输出进度日志到 CLI

## 3. 添加 SRT 字幕生成

- [x] 3.1 在 renderVideo 完成后调用 SRT 生成器
- [x] 3.2 验证 output.srt 文件正确生成

## 4. 测试验证

- [x] 4.1 运行完整 E2E 测试验证视频生成
- [x] 4.2 验证 output.mp4 和 output.srt 文件存在
- [x] 4.3 验证 CLI 日志输出
- [x] 4.4 测试错误处理场景
