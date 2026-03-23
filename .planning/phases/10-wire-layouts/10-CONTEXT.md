# Phase 10: Wire Phase 2 Layouts into Composition - Context

**Gathered:** 2026-03-23 (updated)
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the integration gap between the video rendering pipeline and Phase 2 professional layouts. The current path generates a standalone Remotion project with an inline Scene.tsx that ignores the 8 layout templates (HeroFullscreen, SplitHorizontal, etc.) from Phase 2.

**Root cause:** `video-renderer.ts` calls `generateRemotionProject()` which creates a temp project outside the monorepo, then runs `npm install` in that directory. `workspace:*` deps fail outside the monorepo. Meanwhile, `packages/renderer` is already a fully-wired Remotion project with complete layout routing.

**Goal:** Make videos render using Phase 2 layout components so professional visual hierarchy appears in the final MP4.

</domain>

<decisions>
## Implementation Decisions

### D-01: Rendering Strategy — Skip Generation, Use packages/renderer Directly

**Decision:** `spawnRenderProcess` runs `remotion render` directly FROM the `packages/renderer` directory instead of generating a standalone project.

- `packages/renderer/src/remotion/Root.tsx` is the entry point
- `packages/renderer`'s own `node_modules/@remotion/cli` is used — no separate npm install
- `packages/renderer/src/remotion/Scene.tsx` already has full layout routing (Phase 7)
- `generateRemotionProject()` function is kept but no longer called

### D-02: Dependency Packaging — Obsolete

The previous D-02 ("add `@video-script/renderer: workspace:*` to generated package.json") is **invalid and replaced by D-01**. The workspace:\* protocol fails outside the monorepo. By rendering from packages/renderer directly, there is no generated project and no dependency packaging problem.

### D-03: Props Passing — Temp JSON File

Script data and image paths are passed to Remotion via `--props /path/to/temp-props.json` (a temporary file, not inline JSON on the command line). This avoids command-line length limits when base64 screenshots are large.

Props format:

```json
{
  "script": { "title": "...", "totalDuration": 60, "scenes": [...] },
  "images": { "scene-1-layer-1": "data:image/png;base64,..." }
}
```

### D-04: Image Loading — Base64 Data URI via imagePaths

Screenshots are passed as base64 data URIs in the `images` prop (matching `packages/renderer`'s `VideoComposition` which already accepts `images?: Record<string, string>`). No changes to layout components.

- `Scene.tsx` already converts `imagePaths Record<string, string>` → `screenshots Map<string, string>` via `convertToVisualScene(scene, imagePaths)` (Phase 7 implementation)
- Key format: `sceneId-layerId` — matches the format used by `screenshotResources` in `src/cli/index.ts` compose step

### D-05: Fallback Behavior — Preserved

`Scene.tsx` already falls back to `InlineScene` when:

- `layoutTemplate` is undefined or `"inline"`
- `getLayoutComponent` returns null (unknown template)
- Layout rendering throws an error

No changes needed. Old videos without `layoutTemplate` continue to render inline.

### D-06: Screenshot Quality — Deferred

ORB blocking (remote URLs blocked by browser) and screenshot quality issues (missing CSS selectors, low content relevance) are **out of scope for Phase 10**. Phase 10 only ensures the layout routing path is connected and renders correctly. Screenshot quality improvements are deferred to the next phase.

### Claude's Discretion

- Exact temp file path location for props JSON
- Whether to clean up temp props file after render
- Error handling for missing `packages/renderer/node_modules` (npm install guard)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Layout Infrastructure (Phase 7 — already wired)

- `packages/renderer/src/remotion/Scene.tsx` — Layout routing implementation, InlineScene fallback, convertToVisualScene call
- `packages/renderer/src/utils/sceneAdapter.ts` — convertToVisualScene(), inferLayoutFromType(), convertVisualLayersToResources()
- `packages/renderer/src/remotion/layouts/index.ts` — LayoutProps interface, getLayoutComponent(), 8 layout exports

### Rendering Entry Point

- `packages/renderer/src/remotion/Root.tsx` — RemotionRoot with Composition id="Video" and id="VideoPortrait"
- `packages/renderer/src/remotion/Composition.tsx` — VideoComposition({ script, images? }), passes imagePaths to Scene
- `packages/renderer/src/video-renderer.ts` — spawnRenderProcess() — THIS IS WHAT CHANGES in Phase 10

### Current Generation (to be replaced)

- `packages/renderer/src/remotion-project-generator.ts` — generateRemotionProject() — kept but no longer called
- `packages/renderer/src/remotion-project-generator.ts` lines 635-692 — Inline Scene.tsx template (reference for what was bypassed)

### Compose Pipeline

- `src/cli/index.ts` — compose command (line 866): calls adaptScriptForRenderer, then spawnRenderer
- `src/utils/scene-adapter.ts` — adaptScriptForRenderer() — Phase 9 adapter wired into compose step

### Schema Context

- `packages/renderer/src/types.ts` — ScriptOutput, SceneScript types, layoutTemplate field (line 151)
- `.planning/phases/07-wire-layouts/07-CONTEXT.md` — D-01,D-02,D-03 layout routing decisions

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **packages/renderer/src/remotion/Scene.tsx**: Already has layout routing — just needs to be called via packages/renderer render path
- **packages/renderer/src/remotion/Root.tsx**: RemotionRoot entry point — Composition schema accepts `{ script, images }`
- **packages/renderer/src/remotion/Composition.tsx**: VideoComposition passes `images` prop to Scene as `imagePaths`
- **packages/renderer/src/utils/sceneAdapter.ts**: convertToVisualScene() already bridges SceneScript → VisualScene + screenshots Map
- **8 layout components**: HeroFullscreen, SplitHorizontal, SplitVertical, TextOverImage, CodeFocus, Comparison, BulletList, Quote

### Established Patterns

- `imagePaths` key format: `sceneId-layerId` (e.g., `"scene-1-layer-1"`) — used consistently in screenshotResources mapping
- `spawnRenderProcess` in video-renderer.ts already spawns remotion-cli.js with `--props` flag — changing the CWD to packages/renderer is the minimal change
- `generateRemotionProject` reads screenshot files and converts to base64 — this logic needs to move into spawnRenderProcess or a new helper

### Integration Points

- `packages/renderer/src/video-renderer.ts`: `spawnRenderProcess()` is where CWD changes from generated project to packages/renderer
- `src/cli/index.ts` line 904: calls `spawnRenderer()` which calls `video-renderer.ts` functions — no changes needed in CLI
- `packages/renderer/src/remotion/Root.tsx` Composition schema: `{ script: ScriptOutputSchema, images: Record<string, string> }` — props JSON must match this schema

### Type Differences (historical — now resolved by sceneAdapter)

| Field  | SceneScript                     | VisualScene                                     |
| ------ | ------------------------------- | ----------------------------------------------- |
| ID     | `id`                            | `sceneId`                                       |
| Layout | `layoutTemplate` (optional)     | `layoutTemplate` (required, inferred if absent) |
| Images | passed separately as imagePaths | passed via screenshots Map                      |

</code_context>

<specifics>
## Specific Ideas

- "The goal is to connect the render path so layout components are actually used in the final MP4"
- "packages/renderer is already fully wired — the fix is making video-renderer.ts use it as the render entry"
- "Screenshot quality and ORB blocking are the NEXT problem after the layout routing path is connected"
- Generated Scene.tsx (inline) was the workaround before layouts existed — it can now be bypassed entirely

</specifics>

<deferred>
## Deferred Ideas

- **Screenshot quality** — CSS selector guidance, content-relevant screenshot capture (next phase)
- **ORB blocking fix** — Remote URL images blocked by browser; use local screenshot files only (next phase)
- Layout animation variants (advanced transition effects) — v2.0
- Custom layout creation functionality — v2.0

</deferred>

---

_Phase: 10-wire-layouts_
_Context gathered: 2026-03-23_
