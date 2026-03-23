# Phase 7: Wire Layouts to Composition - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 07-wire-layouts
**Areas discussed:** 类型统一策略, 布局选择逻辑, 向后兼容

---

## 类型统一策略

| Option | Description | Selected |
|--------|-------------|----------|
| 适配器模式 | 在 Scene.tsx 中将 SceneScript 转换为 VisualScene，保持两个类型独立 | ✓ |
| 修改布局接受 SceneScript | 让布局组件直接接受 SceneScript 类型，修改所有 8 个布局 | |
| 合并为单一类型 | 合并 SceneScript 和 VisualScene 为单一类型 | |

**User's choice:** 适配器模式（推荐）
**Notes:** 符合 Phase 6 D-05 决定（renderer 使用本地 zod v3 schemas），保持类型分离

---

## 布局选择逻辑

| Option | Description | Selected |
|--------|-------------|----------|
| Agent 驱动 | 在 SceneScript 添加 layoutTemplate 字段，让 script-agent 决定 | ✓ |
| Scene type 映射 | 根据 scene.type 自动选择布局（intro→hero, code→code-focus 等） | |
| 混合模式（回退） | 保留 inline 渲染，只在 layoutTemplate 显式设置时使用布局 | |

**User's choice:** Agent 驱动（推荐）
**Notes:** 更灵活，script-agent 可以根据内容语义选择最合适的布局

---

## 向后兼容

| Option | Description | Selected |
|--------|-------------|----------|
| 回退模式 | layoutTemplate 未设置时保留 inline 渲染，新项目用布局，旧项目兼容 | ✓ |
| 完全替换 | 删除 inline 逻辑，所有场景必须使用布局 | |
| 配置开关 | 在 Composition 级别添加配置开关，允许用户选择模式 | |

**User's choice:** 回退模式（推荐）
**Notes:** 最安全的迁移路径，保持向后兼容

---

## Claude's Discretion

- 转换函数的具体实现细节（字段映射）
- 错误处理和日志格式
- 布局组件的 props 传递方式

## Deferred Ideas

- 布局动画变体（高级过渡效果） — v2.0
- 自定义布局创建功能 — v2.0
- 布局 A/B 测试 — 暂不需要
