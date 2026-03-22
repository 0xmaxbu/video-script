# Phase 4: Transitions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 04-transitions
**Areas discussed:** Scene transition wiring, Transition style per scene type, Code typewriter behavior, Spring settling frames, First/last scene handling

---

## Scene Transition Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Composition 层 | Composition.tsx 统一包装所有场景，逻辑集中 | ✓ |
| Scene 层 | 每个 Scene 组件自己处理进入/退出动画 | |
| Layout 层 | 每个布局模板自己决定转场 | |

**User's choice:** Composition 层 (推荐)
**Notes:** 集中管理，所有转场在一处，易于维护和调试

---

## Transition Type Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| 按 scene.type 自动推断 | intro/outro=fade, feature=slide, code=fade | ✓ |
| 从 visual plan 读取 | 每个场景可指定 transition 字段 | |
| Composition 硬编码 | 所有场景使用相同转场 | |

**User's choice:** 按 scene.type 自动推断 (推荐)
**Notes:** 简单统一，无需额外配置

---

## Transition Duration

| Option | Description | Selected |
|--------|-------------|----------|
| 30帧 | ≈1秒，适合大多数场景 | |
| 20帧 | ≈0.67秒，快速切换 | |
| 45帧 | ≈1.5秒，更戏剧化 | |
| 按场景类型区分 | intro/outro 45帧, feature/code 30帧 | ✓ |

**User's choice:** 按场景类型区分
**Notes:** intro/outro 是情感节点，需要更长的转场；feature/code 是内容，需要更紧凑

---

## Slide Direction

| Option | Description | Selected |
|--------|-------------|----------|
| 固定左到右 | 总是从左滑入 | |
| 交替方向 | 奇数场景左滑，偶数场景右滑 | ✓ |
| 固定右到左 | 总是从右滑入 | |

**User's choice:** 交替方向 (推荐)
**Notes:** 创造来回流动感，视觉节奏更有趣

---

## Code Typewriter Speed

| Option | Description | Selected |
|--------|-------------|----------|
| 2 字符/帧 | 当前默认值 | |
| 4 字符/帧 | 更快 | |
| 动态计算 | 根据场景时长和代码长度自动确定 | ✓ |

**User's choice:** 动态计算 (推荐)
**Notes:** 确保所有代码能在场景时长内展示完

---

## Code Scroll Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| 跟随光标 | 当前行保持在视窗内 | |
| 不滚动 | 只显示前N行 | |
| 镜头缩放 + 平移 | 从全景开始，然后缩放到关键代码段 | ✓ |

**User's choice:** 镜头缩放 + 平移 (推荐)
**Notes:** 匹配 Phase 3 D-07 的设计意图，更专业的代码展示效果

---

## Code Line Highlight Timing

| Option | Description | Selected |
|--------|-------------|----------|
| 立即高亮 | 行显示后立即高亮 | |
| 延后高亮 | 代码全部显示后，按 narration timing 依次高亮 | ✓ |

**User's choice:** 延后高亮 (推荐)
**Notes:** 更适合教程讲解，先展示完整代码再逐行解释

---

## Spring Settling Frames

| Option | Description | Selected |
|--------|-------------|----------|
| 15帧 | 最小缓冲 | |
| 30帧 | 保守估计，damping=100 配置 | ✓ |
| 动态计算 | 30帧 * (100/damping) | |

**User's choice:** 30帧 (推荐)
**Notes:** damping=100 的 spring 在 20-25 帧内基本稳定，30帧是保守缓冲

---

## Settling Frame Scope

| Option | Description | Selected |
|--------|-------------|----------|
| 仅最终渲染 | 预览时不加，保持响应速度 | ✓ |
| 预览和渲染都加 | 确保任何地方都稳定 | |

**User's choice:** 仅最终渲染 (推荐)
**Notes:** 预览时跳过额外帧数，保持开发体验

---

## First Scene Entry

| Option | Description | Selected |
|--------|-------------|----------|
| 无入场 | 第一个场景直接显示 | ✓ |
| fade 入场 | 从黑屏渐入 | |

**User's choice:** 无入场 (推荐)
**Notes:** intro 场景本身就有 fade 效果，无需额外入场

---

## Last Scene Exit

| Option | Description | Selected |
|--------|-------------|----------|
| 无退场 | 最后一个场景结束后视频直接结束 | ✓ |
| fade 退场 | 渐出到黑屏 | |

**User's choice:** 无退场 (推荐)
**Notes:** outro 场景本身已有淡出效果

---

## Adjacent Scene Transition

| Option | Description | Selected |
|--------|-------------|----------|
| 先出后入 | 场景A完全退出后场景B才开始 | |
| 交叉过渡 | 场景A退出的同时场景B入场 | ✓ |
| 提前入场 | 场景A还在时场景B就开始入场 | |

**User's choice:** 交叉过渡 (推荐)
**Notes:** 流畅但有短暂重叠，更适合视频叙事

---

## Claude's Discretion

- Exact spring config for transitions (use existing from Phase 1)
- Exact zoom/pan curves for code scenes
- Cross-fade overlap duration (half of exit duration)

## Deferred Ideas

- Custom transition per scene (v2)
- 3D flip/rotate transitions (v2)
- Code diff animations (v2)

---

*Discussion completed: 2026-03-22*
