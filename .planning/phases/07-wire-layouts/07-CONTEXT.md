# Phase 7: Wire Layouts to Composition - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Connect orphaned Phase 2 layouts (Grid, FrostedCard, 8 templates) to generated Scene.tsx so videos use professional PPT-style layouts instead of inline rendering. This is an integration phase — layouts exist but are never called.

</domain>

<decisions>
## Implementation Decisions

### 类型统一策略
- **D-01:** 适配器模式 — Scene.tsx 中创建 `convertToVisualScene()` 函数，将 `SceneScript` 转换为 `VisualScene`，保持两个类型独立（符合 Phase 6 D-05: renderer 使用本地 zod v3 schemas）
- **D-01a:** 转换函数位置： `packages/renderer/src/utils/sceneAdapter.ts`
- **D-01b:** 保留 `SceneScript` 和 `VisualScene` 分离，不合并类型

### 布局选择逻辑
- **D-02:** Agent 驱动布局选择 — 在 `SceneScriptSchema` 添加可选 `layoutTemplate` 字段，由 script-agent 决定使用哪个布局
- **D-02a:** layoutTemplate 可选值: `hero-fullscreen | split-horizontal | split-vertical | text-over-image | code-focus | comparison | bullet-list | quote | inline`
- **D-02b:** 当 layoutTemplate 为空或 "inline" 时，使用现有 inline 渲染（回退模式）
- **D-02c:** script-agent 提示词更新： 根据场景内容推荐合适的布局模板

### 向后兼容
- **D-03:** 回退模式 — 当 `layoutTemplate` 未设置或为 "inline" 时，保留现有 inline 渲染逻辑
- **D-03a:** 新项目默认使用布局，旧项目/未设置场景自动回退到 inline
- **D-03b:** 布局渲染失败时，降级到 inline 渲染并记录警告

### Claude's Discretion
- 转换函数的具体实现细节（字段映射）
- 错误处理和日志格式
- 布局组件的 props 传递方式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 2 Layouts
- `packages/renderer/src/remotion/layouts/index.ts` — LayoutProps 接口, getLayoutComponent()
- `packages/renderer/src/remotion/layouts/Grid.tsx` — 12 列网格系统
- `packages/renderer/src/remotion/layouts/FrostedCard.tsx` — 毛玻璃卡片组件
- `packages/renderer/src/remotion/layouts/HeroFullscreen.tsx` — 参考布局实现

### Current Scene Rendering
- `packages/renderer/src/remotion/Scene.tsx` — 当前 inline 渲染逻辑
- `packages/renderer/src/types.ts` — SceneScript 类型定义
- `packages/types/src/script.ts` — VisualScene 类型定义

### Schema Context
- `.planning/phases/06-type-schema/06-CONTEXT.md` — D-05: renderer 使用本地 zod v3 schemas

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Layout 组件**: 8 个布局已存在 — HeroFullscreen, SplitHorizontal, SplitVertical, TextOverImage, CodeFocus, Comparison, BulletList, Quote
- **Grid + FrostedCard**: 基础组件已实现
- **getLayoutComponent()**: 布局选择器函数已存在，接收 template 字符串返回组件

### Type Differences
| 字段 | SceneScript (Scene.tsx) | VisualScene (Layouts) |
|------|------------------------|----------------------|
| 场景ID | `id` | `sceneId` |
| 类型 | `type` (intro/feature/code/outro) | 无对应 |
| 标题 | `title` | `textElements.find(role=title)` |
| 口播 | `narration` | `narrationTimeline.text` |
| 视觉层 | `visualLayers[]` | `mediaResources[] + textElements[]` |
| 布局 | 无 | `layoutTemplate` |
| 标注 | `highlights/codeHighlights` | `annotations[]` |

### Established Patterns
- AbsoluteFill 用于全屏布局
- Spring 动画: damping 100, stiffness 200-300
- 布局通过 `LayoutProps` 接收 scene + screenshots

### Integration Points
- Scene.tsx 的 type switch (intro/feature/code) → 替换为 layoutTemplate 选择
- getLayoutComponent(template) 返回组件 → 渲染布局
- 无 layoutTemplate → 回退到现有 inline 逻辑

</code_context>

<specifics>
## Specific Ideas

- "布局组件存在但从未被调用，这是 Phase 2 的遗留问题"
- "Script agent 应该根据内容类型推荐布局：代码场景用 code-focus，特性对比用 comparison"
- "保持向后兼容，旧视频不指定 layoutTemplate 时继续用 inline 渲染"

</specifics>

<deferred>
## Deferred Ideas

- 布局动画变体（高级过渡效果） — v2.0
- 自定义布局创建功能 — v2.0
- 布局 A/B 测试 — 暂不需要

</deferred>

---

*Phase: 07-wire-layouts*
*Context gathered: 2026-03-23*
