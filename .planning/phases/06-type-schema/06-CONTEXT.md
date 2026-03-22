# Phase 6: Type Package + Schema Adapter - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix blocking integration issues — create `@video-script/types` shared package and fix script→renderer schema mismatch. This is a gap closure phase: schemas were created in isolation across `src/types/` and `packages/renderer/src/types.ts`, creating type fragmentation and schema drift between script output and renderer input.
</domain>

<decisions>
## Implementation Decisions

### Type Package Structure
- **D-01:** 创建 `packages/types/` 作为独立 npm 包
- **D-01a:** 通过 conditional exports 处理 zod v3/v4 隔离：主进程用 zod v4，渲染进程通过 conditional exports 用 zod v3 重导出
- **D-01b:** `packages/types` 对外暴露 TypeScript 类型和 zod schemas，供 workspace 内部使用

### Schema Unification
- **D-02:** 统一 `SceneScriptSchema`，合并 `highlights` 和 `codeHighlights` 字段作为可选字段
- **D-02a:** `highlights: z.array(SceneHighlightSchema)` — 标记口播中的重点文字片段及时间点
- **D-02a:** `codeHighlights: z.array(CodeHighlightSchema)` — 标记代码行的讲解时间点和标注类型
- **D-02b:** Renderer 必须处理 highlights/codeHighlights，**确保标注位置正确**（这是 Phase 1 VIS-01/02/03 的核心）
- **D-02c:** `packages/renderer/src/remotion-project-generator.ts` 中的 `transition: z.any()` 和 `annotations: z.array(z.any())` 必须替换为正确的 schema

### ScreenshotConfig Schema
- **D-03:** `ScreenshotConfigSchema` 拆分为两层：
  - 基础 schema：通用字段（background、width、fontSize、fontFamily）
  - 扩展（renderer 专用）：maxLines、padding、theme 等 renderer 特有字段
- **D-03a:** 基础 schema 在 `packages/types` 中定义
- **D-03b:** Renderer 扩展在 `packages/renderer/src/types.ts` 中用 extends 实现

### Migration Strategy
- **D-04:** 破坏性迁移（breaking migration）
- **D-04a:** Phase 6 直接创建 `packages/types` 并使用，清理掉 `src/types/` 和 `packages/renderer/src/types.ts` 中的重复 schemas
- **D-04b:** Phase 7 是 gap closure，干净的重构时机
- **D-04c:** 不使用 adapter 转换层——直接统一 schema

### What's NOT in scope
- 重建 script agent 输出格式（数据结构已确定）
- 改变 renderer 的 Composition/Scene 组件结构
- 发布 npm 包到 registry（workspace 内部使用即可）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Contexts
- `.planning/phases/01-annotation-renderer/01-CONTEXT.md` — Annotation types, spring animation patterns, VIS-01/02/03 requirements
- `.planning/phases/02-layout-system/02-CONTEXT.md` — Grid/FrostedCard, 12-column layout system
- `.planning/phases/05-composition/05-CONTEXT.md` — Two-process model, zod v3/v4 isolation rationale

### Requirements
- `.planning/REQUIREMENTS.md` — VIS-01, VIS-02, VIS-03, RES-01, RES-03, SCR-01, SCR-02, COMP-01
- `.planning/ROADMAP.md` — Phase 6 goal: "Fix blocking integration issues — @video-script/types package and script→renderer schema mismatch"

### Codebase
- `src/types/index.ts` — Main process TypeScript schemas (zod v4)
- `src/types/script.ts` — Script schemas with highlights/codeHighlights
- `packages/renderer/src/types.ts` — Renderer TypeScript schemas (zod v3)
- `packages/renderer/src/remotion-project-generator.ts` — Generator that accepts script input, has `z.any()` for transition/annotations
- `packages/renderer/src/remotion/Scene.tsx` — Scene component that renders annotations

### Specifications
- `openspec/` — Existing spec docs if present

</canonical_refs>

<codebase>
## Existing Code Insights

### Reusable Assets
- `SceneHighlightSchema` (src/types/visual.ts) — 口播重点标记结构
- `CodeHighlightSchema` (src/types/visual.ts) — 代码行标注结构
- `ANNOTATION_COLORS` (src/types/visual.ts) — 标注颜色常量

### Established Patterns
- Two-process model: main = zod v4, renderer = zod v3
- Schema 文件分散在 `src/types/` 和 `packages/renderer/src/types.ts`
- `@video-script/types` 被引用但不存在（需要创建）

### Integration Points
- Script agent 输出 → remotion-project-generator 输入（schema 不匹配位置）
- `packages/types` → `src/` (main) 和 `packages/renderer/` (renderer) 都引用
- highlights/codeHighlights → AnnotationRenderer → Scene.tsx（标注位置必须正确）

</codebase>

<specifics>
## Specific Ideas

- "highlights/codeHighlights 是标记动画的标识！renderer需要好好处理！确保位置正确！"
- 两个进程的 schema 分歧已经造成了实际的集成问题（从 Phase 5 的 pipeline test 可看出）
- Phase 7 将把 layouts 连接到 composition，这是清理 schema 的最后机会

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-type-schema*
*Context gathered: 2026-03-22*
