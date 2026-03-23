# Phase 9: types-schema-fix - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Source:** Gap closure from v1.0 audit

<domain>
## Phase Boundary

Fix blocking integration issues that prevent the E2E pipeline from working:
1. `@video-script/types` package not installed/published
2. Schema mismatch: Script Agent outputs narration as object, Renderer expects string

</domain>

<decisions>
## Implementation Decisions

### Gap 1: @video-script/types package
- **Issue:** Files import `@video-script/types` but package is not in node_modules
- **Fix approach:** TBD — either install/publish package OR change imports to relative paths
- **Affected files:**
  - `packages/renderer/src/remotion/Scene.tsx:8`
  - `packages/renderer/src/remotion/layouts/index.ts:22`
  - `packages/renderer/src/remotion/annotations/AnnotationRenderer.tsx:8`
  - All annotation components (6 files)

### Gap 2: Schema Mismatch
- **Issue:** Script Agent outputs `SceneScriptSchema` with `narration: object` but Renderer expects `narration: string`
- **Script Agent output** (`src/types/visual.ts`):
  ```typescript
  narration: { fullText: string, estimatedDuration: number, segments: Array }
  ```
- **Renderer expects** (`packages/renderer/src/types.ts`):
  ```typescript
  narration: z.string()
  ```
- **Fix approach:** TBD — create schema adapter OR unify schema

### Gap 3: visualLayers empty in script.json
- **Issue:** E2E test shows video has no screenshots — script.json scenes have empty `visualLayers`
- **Root cause:** Script Agent doesn't generate `mediaResources` → Screenshot Agent has no URLs → visualLayers stays empty
- **Fix approach:** Script Agent should include URL reference from research in scene output

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/v1.0-MILESTONE-AUDIT.md` — Gap definitions and blocking issues
- `packages/types/src/script.ts` — Script agent SceneScriptSchema (renderer side)
- `src/types/visual.ts` — Script agent output schema (main side)
- `packages/renderer/src/types.ts` — Renderer expected types

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Key Files
- `src/types/visual.ts` — Main process Scene/VisualPlan schemas
- `packages/types/src/script.ts` — Shared type definitions (installed as @video-script/types)
- `packages/renderer/src/types.ts` — Renderer-side type expectations
- `packages/renderer/src/remotion-project-generator.ts` — Generates Scene.tsx for Remotion
- `src/mastra/agents/screenshot-agent.ts` — Screenshot capture agent

### Integration Points
- Script Agent → script.json (JSON file)
- Screenshot Agent → screenshots directory (PNG files)
- Compose → screenshotResources mapping

</codebase_context>

<deferred>
## Deferred Ideas

None — all gaps identified in v1.0 audit

</deferred>

---
*Phase: 09-types-schema-fix*
*Context gathered: 2026-03-23 via gap closure*
