# Phase 10: Wire Phase 2 Layouts into Composition - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the integration gap between the generated Remotion project (Scene.tsx) and Phase 2 professional layouts. The generated project uses inline rendering instead of the 8 layout templates (HeroFullscreen, SplitHorizontal, etc.) that Phase 2 created.

**Root cause:** `remotion-project-generator.ts` generates its own inline Scene.tsx that:
1. Hardcodes type switch (intro/feature/code/outro)
2. Uses raw `AbsoluteFill` + `Img` directly
3. Does NOT import any Phase 2 layout components
4. Does NOT route through `layoutTemplate`

</domain>

<decisions>
## Implementation Decisions

### Architecture Analysis

**Two Separate Scene.tsx Files:**
1. `packages/renderer/src/remotion/Scene.tsx` (Phase 7) — Uses layouts via `getLayoutComponent()`, has `InlineScene` fallback
2. Generated `Scene.tsx` (from `remotion-project-generator.ts`) — Inline implementation, doesn't use layouts

**Key Finding:** Generated projects do NOT include `@video-script/renderer` as dependency. Only `@remotion/*` packages.

### Recommended Approach (SOLID Principles)

**Recommended: Option A — Generated projects import @video-script/renderer layout components**

SOLID Analysis:
- **SRP**: Generator only handles project structure, layout rendering responsibility is in layout components
- **OCP**: Adding new layouts doesn't require modifying the generator, just add to @video-script/renderer
- **LSP**: All layout components implement the same `LayoutProps` interface
- **ISP**: LayoutProps interface is designed specifically for layouts, lean enough
- **DIP**: Generator depends on layout abstraction (layoutTemplate string), not concrete components

**Problems with Alternatives:**
- Option B (copy layout code): Violates DRY, layout updates require regeneration
- Option C (inline layouts): Complexity in generator, loses professional layout benefits

### D-01: Generated Scene.tsx Routing Strategy
- **Recommended:** Use `layoutTemplate` field + `getLayoutComponent()` routing
- When `layoutTemplate` is empty or "inline", fall back to `InlineScene` (Phase 7 already implemented)

### D-02: Layout Component Packaging
- **Recommended:** Layout components already exist in `@video-script/renderer/src/remotion/layouts/`
- Add `"@video-script/renderer": "workspace:*"` to generated project's package.json

### D-03: Fallback Behavior
- **Recommended:** Silent fallback to inline rendering (Phase 7 InlineScene mode)
- Maintain backward compatibility, old videos without layoutTemplate continue using inline

### Claude's Discretion
- Specific file structure of generated project (can reference Phase 7's `InlineScene` implementation)
- TypeScript type safety handling

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Layout Infrastructure (Phase 7)
- `packages/renderer/src/remotion/layouts/index.ts` — LayoutProps interface, getLayoutComponent(), 8 layout exports
- `packages/renderer/src/utils/sceneAdapter.ts` — convertToVisualScene() SceneScript→VisualScene conversion
- `packages/renderer/src/remotion/Scene.tsx` — Layout routing implementation, has InlineScene fallback

### Current Generation
- `packages/renderer/src/remotion-project-generator.ts` — Generates Scene.tsx
- `packages/renderer/src/video-renderer.ts` — renderVideo() calls generateRemotionProject()

### Phase 2 Layouts
- `packages/renderer/src/remotion/layouts/HeroFullscreen.tsx`
- `packages/renderer/src/remotion/layouts/SplitHorizontal.tsx`
- `packages/renderer/src/remotion/layouts/CodeFocus.tsx`
- `packages/renderer/src/remotion/layouts/Grid.tsx`
- `packages/renderer/src/remotion/layouts/FrostedCard.tsx`

### Schema Context
- `packages/types/src/script.ts` — VisualLayer, SceneScript types
- `.planning/phases/07-wire-layouts/07-CONTEXT.md` — D-01,D-02,D-03 layout routing decisions

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Architecture Flow
```
video-renderer.ts (renderer)
  └── renderVideo()
        └── generateRemotionProject()  ← Generate project to .remotion-project/
              └── spawnRenderProcess()  ← Use npx remotion render

Generated .remotion-project/:
  ├── package.json (no @video-script/renderer dependency!)
  └── src/
        ├── Scene.tsx (inline implementation, doesn't use layouts)
        ├── Composition.tsx
        └── ...
```

### Reusable Assets
- **8 layout components**: HeroFullscreen, SplitHorizontal, SplitVertical, TextOverImage, CodeFocus, Comparison, BulletList, Quote
- **Grid + FrostedCard**: Base components
- **getLayoutComponent(template)**: Routing function returning layout component
- **sceneAdapter**: SceneScript → VisualScene conversion
- **InlineScene**: Phase 7's inline fallback component

### Integration Points
- `remotion-project-generator.ts` line 88: package.json generation (needs @video-script/renderer dependency)
- `remotion-project-generator.ts` lines 635-692: Inline Scene.tsx template (needs layout routing)
- Phase 7's `InlineScene` mode can be used as fallback reference

### Type Differences
| Field | SceneScript (Generator) | VisualScene (Layouts) |
|-------|------------------------|---------------------|
| Scene ID | `id` | `sceneId` |
| Title | `title` | `textElements.find(role=title)` |
| Narration | `narration` | `narrationTimeline.text` |
| Visual Layers | `visualLayers[]` | `mediaResources[] + textElements[]` |
| Layout | none | `layoutTemplate` |

</codebase_context>

<specifics>
## Specific Ideas

- "Phase 2 layout components exist but are never used by generated video projects"
- "remotion-project-generator.ts needs update to use layout components"
- "Generated Scene.tsx should be consistent with the sceneAdapter pattern established in Phase 7"

## Critical Issues Identified

1. **Image Loading ORB Block** — Remote URL images blocked by browser ORB (Opaque Response Blocking)
   - Affects: visualLayers with type: screenshot that use URL content
   - Need: Use local screenshot files from Screenshot Agent, not remote URLs

2. **Screenshot Quality Poor** — Current screenshots are meaningless
   - Screenshot Agent captures full-page screenshots without selector guidance
   - Need: Content-relevant screenshots using CSS selectors to capture specific regions

</specifics>

<deferred>
## Deferred Ideas

- Layout animation variants (advanced transition effects) — v2.0
- Custom layout creation functionality — v2.0
- Layout A/B testing —暂不需要

</deferred>

---

*Phase: 10-wire-layouts*
*Context gathered: 2026-03-23*
