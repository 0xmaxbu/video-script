# Phase 2: Layout System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 02-layout-system
**Areas discussed:** Grid System, Frosted Glass, Typography Hierarchy, Layout Refactor Approach

---

## Grid System

| Option | Description | Selected |
|--------|-------------|----------|
| 宽松网格 | 大间距，专业感强，40-60%留白 | ✓ |
| 紧凑网格 | 更多的内容空间，信息密度高 | |
| 中等网格 | 平衡型 | |

**User's choice:** 宽松网格
**Notes:** 用户选择专业感强的宽松网格

---

### Safe Zone Margins

| Option | Description | Selected |
|--------|-------------|----------|
| 宽松 | 左右120px，上下80px | ✓ |
| 中等 | 左右80px，上下50px | |
| 紧凑 | 左右40px，上下30px | |

**User's choice:** 宽松 (120px/80px)

---

### Gutter Width

| Option | Description | Selected |
|--------|-------------|----------|
| 宽松 | 24px | ✓ |
| 中等 | 16px | |
| 紧凑 | 8px | |

**User's choice:** 宽松 (24px)

---

## Frosted Glass Styling

### Blur Radius

| Option | Description | Selected |
|--------|-------------|----------|
| 强模糊 | 40px | |
| 中等 | 25px | ✓ |
| 弱模糊 | 15px | |

**User's choice:** 中等 (25px)

---

### Background Opacity

| Option | Description | Selected |
|--------|-------------|----------|
| 10% | 非常透明 | |
| 20% | 轻度半透明 | ✓ |
| 30% | 中等半透明 | |

**User's choice:** 20%

---

### Border Radius

| Option | Description | Selected |
|--------|-------------|----------|
| 大圆角 | 32px | ✓ |
| 中圆角 | 16px | |
| 小圆角 | 8px | |

**User's choice:** 32px (Deer Flow参考)

---

### Background Color

| Option | Description | Selected |
|--------|-------------|----------|
| 深色 | rgba(20,20,20,0.8) | |
| 浅色 | rgba(255,255,255,0.1) | |
| 主题色 | 根据内容色调 | ✓ |

**User's choice:** 主题色

---

## Typography Hierarchy

### Title Sizes

| Option | Description | Selected |
|--------|-------------|----------|
| 80/60/36pt | 大/中/小标题 | ✓ |
| 72/48/32pt | 传统PPT尺寸 | |
| 其他 | 自定义 | |

**User's choice:** 80/60/36pt

### Body Sizes

| Option | Description | Selected |
|--------|-------------|----------|
| 24/20/16pt | 大/中/小正文 | ✓ |
| 18/16/14pt | 紧凑尺寸 | |
| 其他 | 自定义 | |

**User's choice:** 24/20/16pt

**Notes:** 用户确认"可以，就这样先看看"

---

## Layout Refactor Approach

### Refactor Scope

| Option | Description | Selected |
|--------|-------------|----------|
| 重构全部 | 所有8个布局都用网格 | ✓ |
| 只重构关键布局 | Hero等主要场景 | |
| 新建布局用网格 | 现有不改 | |

**User's choice:** 重构全部

---

### Component Form

| Option | Description | Selected |
|--------|-------------|----------|
| Wrapper组件 | `<Grid>{children}</Grid>` | ✓ |
| 工具函数 | getGridPosition() | |

**User's choice:** Wrapper组件

---

## Deferred Ideas

- Custom font family selection — system fonts for now
- Layout animation variants — basic refactor first
- Theme color extraction automation — manual theme for now

---
