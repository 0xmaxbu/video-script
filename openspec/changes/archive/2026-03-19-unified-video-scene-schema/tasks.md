# Tasks: 统一视频场景 Schema

## 1. Schema 定义更新

- [ ] 1.1 更新 `src/types/script.ts` - 采用新的 SceneSchema（id, type, title, narration, duration, visualLayers）
- [ ] 1.2 更新 `packages/renderer/src/types.ts` - 确保与主项目 Schema 一致
- [ ] 1.3 添加 VisualLayerSchema 定义（type, position, animation, content）
- [ ] 1.4 添加 SceneNarrativeType 枚举（intro, feature, code, outro）
- [ ] 1.5 添加 SceneTransitionSchema 定义（type, duration）
- [ ] 1.6 运行 `npm run typecheck` 验证类型定义

## 2. Zod 验证实现

- [ ] 2.1 创建 `src/types/validations.ts` - Schema 验证函数
- [ ] 2.2 实现 validateScriptOutput() 函数
- [ ] 2.3 实现 validateVisualLayer() 函数
- [ ] 2.4 在 workflow 中集成验证逻辑

## 3. Script Agent 更新

- [ ] 3.1 更新 `src/mastra/agents/script-agent.ts` 指令
- [ ] 3.2 添加场景类型定义和示例（intro/feature/code/outro）
- [ ] 3.3 添加 visualLayers 结构说明和示例
- [ ] 3.4 添加时长规划指导（中文 3 字/秒）
- [ ] 3.5 明确要求输出 id, title, narration, duration 字段
- [ ] 3.6 测试 Agent 输出格式

## 4. Screenshot Agent 适配

> 基于实现发现：当前 screenshot-agent 逻辑基于旧 schema，需要完全重写

- [ ] 4.1 重写 `src/mastra/agents/screenshot-agent.ts`
- [ ] 4.2 遍历 visualLayers 而非 scenes
- [ ] 4.3 根据 layer.type 决定截图策略（fullPage/element/viewport）
- [ ] 4.4 返回每个 visualLayer 的截图结果，key = visualLayer.id

## 5. Workflow 数据流修复

> 基于实现发现：screenshotResources key 不匹配 + totalDuration 计算错误

- [ ] 5.1 修复 `src/mastra/workflows/video-generation.ts` 中的 screenshotResources 映射
- [ ] 5.2 改用 `scene.id` 或 `visualLayer.id` 作为 key
- [ ] 5.3 修复 totalDuration 计算：`scenes.reduce((sum, s) => sum + s.duration, 0)`
- [ ] 5.4 移除 CLI 中的临时绕过方案

## 6. CLI 适配

> 基于实现发现：CLI 当前有临时绕过方案

- [ ] 6.1 更新 `src/cli/index.ts` 的 compose 命令
- [ ] 6.2 移除手动构造场景数据的代码
- [ ] 6.3 直接使用 Agent 输出的场景数据

## 7. Renderer 集成验证

- [ ] 7.1 运行 `npm run build` 确保项目构建成功
- [ ] 7.2 测试完整流程：research → script → screenshot → compose
- [ ] 7.3 验证生成的视频渲染正确

## 8. VisualLayer 渲染组件

> 基于实现发现：Renderer 缺少 VisualLayer 动态渲染

- [ ] 8.1 在 `packages/renderer/src/` 创建 VisualLayerRenderer 组件
- [ ] 8.2 实现 ScreenshotLayer、CodeLayer、TextLayer 子组件
- [ ] 8.3 更新 Scene 组件以支持 visualLayers

## 9. Transition 支持

> 基于实现发现：transition 配置缺失

- [ ] 9.1 在 SceneSchema 中添加 transition 字段
- [ ] 9.2 在 Renderer 中实现 transition 动画
- [ ] 9.3 确保至少 50% 场景有 transition 定义

## 10. 测试

- [ ] 10.1 更新 Schema 验证测试
- [ ] 10.2 添加 visualLayers 结构测试
- [ ] 10.3 端到端测试验证
- [ ] 10.4 运行 `npm test` 确保所有测试通过

## 11. 文档更新

- [ ] 11.1 更新 AGENTS.md 中的 Schema 说明
- [ ] 11.2 更新 README.md 中的数据流说明（如果需要）
- [ ] 11.3 更新 CLI 命令说明（如果参数有变化）

## 12. 清理与验证

- [ ] 12.1 运行完整的 typecheck 和 lint
- [ ] 12.2 运行完整测试套件
- [ ] 12.3 Git commit 并 push

---

## 实现优先级

| 优先级 | 任务          | 原因       |
| ------ | ------------- | ---------- |
| P0     | 1, 2, 3       | 基础架构   |
| P1     | 4, 5, 6       | 修复数据流 |
| P2     | 7, 8          | 渲染验证   |
| P3     | 9, 10, 11, 12 | 完善功能   |
