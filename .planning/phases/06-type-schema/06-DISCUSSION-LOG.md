# Phase 6: Type Package + Schema Adapter - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 06-type-schema
**Areas discussed:** Type package structure, Schema unification strategy, Migration approach

---

## Type Package Structure

| Option | Description | Selected |
|--------|-------------|----------|
| packages/types/ 独立包 | 创建独立 npm 包，conditional exports 处理 zod v3/v4 隔离。最干净但需处理包发布。 | ✓ |
| packages/renderer/src/types 迁移 | 移到 packages/types/ 作为内部类型。不对外发布。 | |
| src/types 作为源码共享 | 通过 workspace 引用或复制。schema 重复定义问题仍存在。 | |

**User's choice:** packages/types/ 独立包
**Notes:** None

---

## Schema Unification — Highlights/CodeHighlights

| Option | Description | Selected |
|--------|-------------|----------|
| 保留在 script 输出，renderer 忽略 | 最简单，但 script→renderer 接口不干净。 | |
| 合并到统一 schema | renderer 也使用相同 schema，接口干净。 | ✓ |
| 移除，只保留 renderer 需要的字段 | 需要改 script agent。 | |

**User's choice:** 合并到统一Schema，这两个字段是标记动画的标识！renderer需要好好处理！确保位置正确！
**Notes:** Renderer 必须处理 highlights/codeHighlights 并确保标注位置正确

---

## Schema Unification — ScreenshotConfig

| Option | Description | Selected |
|--------|-------------|----------|
| 合并所有字段 | 完整 schema，两个进程都用。 | |
| 拆分：基础 + 扩展 | 基础 schema 通用，renderer 用 extends 扩展。 | ✓ |
| main/renderer 各用自己的 | 保持现状，adapter 转换。 | |

**User's choice:** 拆分：基础 + 扩展
**Notes:** None

---

## Migration Approach

| Option | Description | Selected |
|--------|-------------|----------|
| 破坏性迁移 | 直接用新 types 包，清理重复 schemas。Phase 7 是 gap closure，时机干净。 | ✓ |
| 向后兼容（adapter） | 保留两套 schemas，adapter 转换。需要维护两套代码。 | |
| 渐进式迁移 | 逐步替换，每次一小部分。耗时长。 | |

**User's choice:** 破坏性迁移（推荐）
**Notes:** None

---

## Claude's Discretion

None — all decisions made by user.

---

## Deferred Ideas

None — discussion stayed within phase scope.

---
