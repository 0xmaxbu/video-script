# Proposal: 统一视频场景 Schema

## Overview

将视频生成系统从当前的两独立 Schema（Schema A: `url|text` + 固定时长， Schema B: `intro|feature|code|outro` + 显式时长）迁移到统一的、面向视频制作的 Schema，支持多视觉层（visualLayers）、场景类型（intro/feature/code/outro）、以及现代化的开发者教程视频风格。

## Motivation

### 当前问题

1. **Schema 冲突**： 主项目生成 Schema A 格式的 `script.json`，但 renderer 期望 Schema B 格式的数据，导致视频渲染失败
2. **信息丢失**： Schema A 缺少视频制作的关键信息：
   - 没有场景标题 (`title`)
   - 没有旁白文本 (`narration`)
   - 没有精确时长（`duration` 是固定的 10 秒）
3. **单视觉限制**： 当前一个场景只能有一个视觉元素（截图或文字），无法实现：
   - 分屏布局（代码 + 讲解）
   - 画中画（截图 + 缩放）
   - 多层叠加（背景 + 内容 + 装饰）

### 目标状态

- 统一的 Schema 定义，支持现代教程视频制作
- 一个场景可以包含多个视觉层
- 每个视觉层可以独立控制动画和布局
- 兼容现有 renderer 组件

## Scope

### In Scope

1. 更新 `SceneScriptSchema` 和 `ScriptOutputSchema`
2. 添加 `VisualLayerSchema` 支持多视觉内容
3. 更新 `script-agent` 的指令
4. 更新 `screenshot-agent` 支持新的 visualLayers 结构
5. 更新所有测试用例

### Out of Scope (Future Phases)

1. TTS 配音集成
2. 9:16 画幅支持
3. 批量视频生成
4. 浏览器池优化
5. Docker 容器化

## Dependencies

- None (这是基础架构变更)

## Success Criteria

1. `npm run typecheck` 通过
2. `npm test` 通过（所有现有测试 + 新测试）
3. 使用新 Schema 生成视频成功
   - 生成的 MP4 文件大小 > 0
   - 视频时长与 totalDuration 误差 < 5 秒
4. 视觉层正确渲染
   - 验证每个 visualLayer 都有对应的渲染组件
   - 截图资源正确映射到 screenshotResources
5. 转场动画正常工作
   - Remotion 项目中存在 transition 配置
   - 至少 50% 场景有 transition 定义

## Risks & Mitigations

| Risk                | Likigelihood | Mitigation                         |
| ------------------- | ------------ | ---------------------------------- |
| Agent 输出格式变化  | 中           | 更新 Agent 指令，提供清晰示例      |
| Renderer 组件不兼容 | 低           | 保持 Schema B 向后兼容，新字段可选 |
| 测试覆盖不足        | 中           | 为所有新 Schema 编写测试           |

## Timeline

- **Phase 1** (1-2 days): Schema 统一
- **Phase 2** (2-3 days): Layer 组件实现
- **Phase 3** (1-2 days): 布局系统
- **Phase 4** (1-2 days): Scene 重写
- **Phase 5** (1 day): Agent 更新
- **Phase 6** (1-2 days): 测试与验证

**Total**: 7-12 days
