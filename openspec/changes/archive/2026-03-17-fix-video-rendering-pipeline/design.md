## Context

当前 video-script 项目的 compose 命令位于 `src/cli/index.ts`（第 447-570 行），该命令的职责是：

1. 读取 script.json 和 screenshots 目录
2. 调用 composeAgent.generate() 获取编排建议
3. 返回 JSON 响应但**不实际渲染视频**

问题根源：

- 第 21 行：`renderVideo` 函数被注释掉（TODO: Enable when video rendering is fully integrated）
- compose 命令仅调用 LLM 获取建议，从未执行实际渲染
- video-renderer.ts 的输入 schema 与新的 ScriptOutputSchema 不匹配

现有组件：

- `renderVideo()` - 完整渲染管道函数（video-renderer.ts）
- `generateRemotionProject()` - Remotion 项目生成器（remotion-project-generator.ts）
- `ScriptOutputSchema` - 当前使用的脚本输出格式（types/script.ts）

## Goals / Non-Goals

**Goals:**

- 让 compose 命令直接调用 renderVideo() 生成 MP4 文件（无 agent 中间层）
- 修复 video-renderer.ts 的 schema 不匹配问题
- 确保新 ScriptOutputSchema 格式（order/segmentOrder/type/content）与渲染器兼容
- renderVideo 直接输出进度日志到 CLI
- 生成 SRT 字幕文件作为输出的一部分

**Non-Goals:**

- 不使用 composeAgent（完全移除该调用）
- 不添加新的视频特效或转场（仅确保现有功能工作）
- 不修改 screenshots 捕获逻辑

## Decisions

### D1: 在 compose 命令中直接调用 renderVideo()

**选择**: 不依赖 composeAgent 的 JSON 输出，而是直接调用 renderVideo()

**理由**:

- composeAgent 仅提供编排建议，不生成实际视频
- renderVideo() 已经封装了完整的生成→渲染流程
- 直接调用可以确保端到端流程可预测

**备选方案**:

- 让 composeAgent 返回结构化指令然后执行 → 增加复杂性且不必要

### D2: 更新 video-renderer.ts schema 而非回退 ScriptOutputSchema

**选择**: 修改 video-renderer.ts 的 RenderVideoInputSchema 以匹配新的 ScriptOutputSchema

**理由**:

- ScriptOutputSchema 已被其他组件使用（screenshot-agent, remotion-project-generator）
- 新格式更灵活（支持截图配置、动画效果）
- 保持一致性比复用旧代码更重要

**备选方案**:

- 在 ScriptOutputSchema 中添加 totalDuration 计算属性 → 增加类型复杂性

### D3: 使用 screenshot 目录中的文件作为 screenshotResources

**选择**: 动态扫描 screenshots 目录构建 screenshotResources 映射

**理由**:

- 简单直接，无需额外配置
- 与现有流程兼容
- 截图命名规则基于场景顺序（scene-001.png, scene-002.png, ...），与 script.scenes[].order 一一对应

**备选方案**:

- 让 composeAgent 返回资源映射 → 增加 agent 复杂度

### D4: 移除 composeAgent，renderVideo 直接输出日志

**选择**: 完全移除 composeAgent 调用，renderVideo 直接处理并输出日志到 CLI

**理由**:

- MVP 原则：减少不必要的复杂性
- renderVideo 已封装完整流程，无需额外 agent 编排
- 直接输出日志更简洁，减少 LLM 调用成本

**备选方案**:

- 保留 composeAgent 用于日志 → 增加复杂性，不符合 MVP

## Risks / Trade-offs

**[风险] renderVideo 可能依赖 totalDuration 字段**

- 当前 video-renderer.ts 第 181 行使用 `script.totalDuration`
- 但新的 ScriptOutputSchema 没有此字段
- → **缓解**: 在渲染前计算总时长：scenes.length \* 默认每个场景时长

**[风险] 截图文件命名不一致**

- screenshot-agent 使用固定命名规则：`scene-{order}.png`（如 scene-001.png）
- compose 命令通过 `scene-${String(scene.order).padStart(3, "0")}.png` 模式匹配
- → **缓解**: 基于 scene.order 直接构建文件名，无需动态扫描

**[风险] 长时间渲染阻塞 CLI**

- 视频渲染可能需要数分钟
- → **考虑**: 保持现状（同步渲染），因为 CLI 本身是同步工具

## Migration Plan

1. 修改 `src/utils/video-renderer.ts`:
   - 更新 RenderVideoInputSchema 移除 totalDuration
   - 添加基于 scenes 计算时长的逻辑
   - 添加 CLI 日志输出（通过 onProgress 回调）

2. 修改 `src/cli/index.ts`:
   - 移除 composeAgent 导入和调用
   - 取消注释 renderVideo 导入
   - 直接调用 renderVideo() 处理视频生成
   - 传递 onProgress 回调输出进度日志

3. 测试:
   - 运行 E2E 测试验证完整流程
   - 确认 output.mp4 和 output.srt 文件生成
   - 验证 CLI 日志输出

## Open Questions

1. **Q: 是否需要保留 composeAgent 调用？**
   - 当前设计：保留 agent 调用用于"处理结果"日志，但实际渲染由 renderVideo 执行
2. **Q: 如何处理渲染失败？**
   - 建议：renderVideo 已包含错误处理，返回 success: false 时显示错误信息
