# Phase 12: Fix Layout Rendering - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix layout template rendering so professional PPT-style layouts display correctly in final video output. Layouts exist (Phase 2) and are wired (Phase 7, Phase 10) but render incorrectly — text stacks at top, Z-index causes blur, content missing from bottom sections.

**Scope:** Fix Z-index, vertical centering, text content mapping, and position field interpretation in layout components.
**Not in scope:** Creating new layouts, screenshot quality (Phase 11)

</domain>

<decisions>
## Implementation Decisions

### Z-index Stacking

- **D-01:** FrostedCard z-index: 10, Text content z-index: 20 (explicit layering ensures glass behind text)

### Split Layout Content

- **D-02:** split-vertical bottom section shows text from visualLayers type="text" (not just titleElement)
- **D-02a:** titleElement appears in top section, text visualLayers appear in bottom section

### Vertical Centering

- **D-03:** Use Flexbox with `alignItems:center` and `justifyContent:center` for content within layout sections

### Position Field Mapping

- **D-04:** position.x maps to horizontal zone (left/right/center)
- **D-04a:** position.y determines which section content belongs to (top/bottom)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Layout Components (Phase 2)

- `packages/renderer/src/remotion/layouts/index.ts` — LayoutProps interface, getLayoutComponent()
- `packages/renderer/src/remotion/layouts/Grid.tsx` — 12-column grid system
- `packages/renderer/src/remotion/layouts/FrostedCard.tsx` — Frosted glass component (needs z-index fix)
- `packages/renderer/src/remotion/layouts/SplitVertical.tsx` — Target layout for bottom content fix
- `packages/renderer/src/remotion/layouts/Comparison.tsx` — Target layout for alignment fix

### Layout Decisions (Phase 2)

- `.planning/phases/02-layout-system/02-CONTEXT.md` — D-05~D-08 (FrostedCard specs), D-10~D-11 (typography)
- `.planning/phases/07-wire-layouts/07-CONTEXT.md` — D-01 (adapter pattern), type differences table

### Scene Adapter (Phase 7)

- `packages/renderer/src/utils/sceneAdapter.ts` — convertToVisualScene(), VisualScene type definitions
- `packages/types/src/script.ts` — VisualScene type (used by sceneAdapter)

### VisualLayer Schema

- `packages/renderer/src/types.ts` — VisualLayerSchema with position.x/y fields

### Render Pipeline (Phase 10)

- `.planning/phases/10-wire-layouts/10-CONTEXT.md` — D-01 (skip generation), D-03~D-04 (props/images)
- `packages/renderer/src/video-renderer.ts` — spawnRenderProcess()

</canonical_refs>

<codebase_context>

## Existing Code Insights

### Reusable Assets

- **FrostedCard**: Already exists with blur, opacity, radius props
- **Grid**: 12-column layout wrapper
- **sceneAdapter**: convertToVisualScene() bridges SceneScript → VisualScene

### Issues to Fix

1. **FrostedCard.tsx**: Missing z-index prop — needs zIndex:10
2. **SplitVertical.tsx**: Bottom section only shows titleElement, ignores text visualLayers
3. **All layouts**: Use `top:80` positioning instead of flexbox centering
4. **sceneAdapter**: textElementToVisualLayer maps positions but layouts don't use visualLayers correctly

### Established Patterns

- Spring animations: damping 100, stiffness 200-300
- VisualScene.mediaResources: screenshots with role (primary/secondary)
- VisualScene.textElements: text with role (title/subtitle/bullet/quote)

### Integration Points

- Layouts receive VisualScene via LayoutProps.scene
- Layouts receive screenshots via LayoutProps.screenshots (Map)
- FrostedCard wraps content with backdrop-filter

</codebase_context>

<deferred>
## Deferred Ideas

- **Screenshot quality** — Phase 11 (AI-guided selectors, ORB mitigation)
- **Layout animation variants** — v2.0 (advanced transition effects)
- **Custom layout creation** — v2.0

</deferred>

---

_Phase: 12-fix-layout-rendering_
_Context gathered: 2026-03-23_
