# Phase 9: types-schema-fix - Research

**Researched:** 2026-03-23
**Domain:** TypeScript package integration, Zod schema bridging, E2E pipeline wiring
**Confidence:** HIGH

## Summary

Phase 9 fixes three blocking integration issues that prevent the E2E pipeline from functioning:

1. **Gap 1:** `@video-script/types` package is not linked in the renderer's `node_modules` — imports fail at runtime
2. **Gap 2:** Schema mismatch between Script Agent output (`narration: object`) and Renderer expected input (`narration: string`)
3. **Gap 3:** `visualLayers` array is empty in `script.json` because no code populates it

The root cause is architectural: the pipeline has three distinct schemas (`NewSceneSchema`, `SceneScriptSchema`, `VisualPlanSchema`) that were designed to flow sequentially but were never wired together. An adapter layer is needed to bridge them.

**Primary recommendation:** Create a schema adapter module that transforms `NewScene` output from the Script Agent into `SceneScript` format for the Renderer, simultaneously fixing narration format and populating placeholder `visualLayers`.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- `@video-script/types` package fix approach: TBD (install/publish OR change to relative imports)
- Gap 2 fix approach: TBD (create schema adapter OR unify schema)
- Gap 3 fix approach: Script Agent should include URL reference from research in scene output

### Claude's Discretion
- Resolution strategy for all three gaps — research options and recommend

### Deferred Ideas (OUT OF SCOPE)
None — all gaps identified in v1.0 audit

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Annotation renderer component renders highlight, underline, circle, number effects | Gap 1 blocks runtime — @video-script/types not in node_modules |
| VIS-02 | Annotations animate correctly using spring/interpolate | Gap 1 blocks runtime |
| VIS-03 | Animation extrapolation properly clamped | Gap 1 blocks runtime |
| SCR-01 | Script generates content with depth — thorough explanations | Gap 2 blocks data flow — narration object vs string |
| SCR-02 | Scene narration is engaging, not generic summaries | Gap 2 blocks data flow |
| RES-01 | Research agent performs deep content analysis | Gap 2 blocks pipeline |
| RES-03 | Research extracts semantic chunks preserving logical flow | Gap 2 blocks pipeline |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.9.3 | Language | Project-wide |
| zod | v4 (main), v3 (renderer) | Runtime validation | Two-process model requires version split |

### Project-Specific
| Package | Location | Purpose | Status |
|---------|----------|---------|--------|
| `@video-script/types` | packages/types | Shared type definitions | Built (dist/ exists), NOT linked to renderer |
| `@video-script/renderer` | packages/renderer | Remotion rendering | Has no dependency on @video-script/types |

---

## Architecture Patterns

### Three-Schema Architecture

The pipeline has three distinct schemas that must flow sequentially:

```
Script Agent                    Visual Agent                    Compose Agent
    │                               │                                │
    ▼                               ▼                                ▼
NewSceneSchema              VisualPlanSchema              SceneScriptSchema
(narration: object)         (mediaResources +             (narration: string)
                           visualLayers)
    │                               │                                │
    │───── adapter needed ─────────▶│                                │
    │                               │                                │
    └─────────────────────── visualLayers populated? ─────────────────┘
                                (BROKEN - Gap 3)
```

### Key Schema Definitions

**`NewSceneSchema`** (`src/types/visual.ts`):
```typescript
narration: z.object({
  fullText: z.string(),
  estimatedDuration: z.number().positive(),
  segments: z.array(NarrationSegmentSchema),
}),
highlights: z.array(SceneHighlightSchema),
codeHighlights: z.array(CodeHighlightSchema),
sourceRef: z.string(),
```

**`SceneScriptSchema`** (`src/types/script.ts`):
```typescript
narration: z.string(),  // <-- Flat string expected
visualLayers: z.array(VisualLayerSchema).optional(),
highlights: z.array(SceneHighlightSchema).optional(),
codeHighlights: z.array(CodeHighlightSchema).optional(),
```

**`VisualPlanSchema`** (`src/types/visual.ts`):
```typescript
mediaResources: z.array(ScreenshotResourceSchema.extend({ narrationBinding })),
visualLayers: z.array(...),  // Full visual layer definitions
```

### Two-Process Model
```
Main Process (zod v4)          Renderer Process (zod v3)
─────────────────────          ──────────────────────────
src/types/visual.ts            packages/renderer/src/types.ts
src/types/script.ts           Inline schemas in generated Scene.tsx
                                 (uses string narration)
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type sharing across processes | Copy-paste types | Workspace packages + npm symlink | Keeps types in sync automatically |
| Zod version conflict | Force same version | Two-process isolation | Remotion requires zod v3, Mastra uses v4 |
| Narration timing data | Discard and re-infer | Extract `fullText` | Preserves timing info for sync |
| Visual layer population | Leave empty | Convert highlights to layers | Gap 3 root cause |

**Key insight:** The adapter is not optional — without it, the Script Agent's rich narration timing data is lost and `visualLayers` remains empty.

---

## Gap 1: @video-script/types Not Installed

**What goes wrong:** Runtime failure when `Scene.tsx` imports from `@video-script/types` — the package is not in renderer's `node_modules`.

**Evidence:**
- `packages/types/dist/` exists (built 2026-03-23 09:44)
- `packages/renderer/node_modules/@video-script/` does NOT exist
- `packages/renderer/package.json` does NOT list `@video-script/types` in dependencies
- `Scene.tsx:8` imports: `import type { Annotation } from "@video-script/types"`

**Root cause:** The renderer is a workspace package but `@video-script/types` was never added as a dependency in `packages/renderer/package.json`.

**How to avoid:** Add workspace packages as explicit dependencies, or use TypeScript path aliases.

### Fix Options

| Option | Approach | Tradeoff |
|--------|----------|----------|
| A | Add `"@video-script/types": "workspace:*"` to renderer deps | npm symlinks automatically; clean but requires published package |
| B | Change imports to relative paths (`../../types/src/visual.js`) | No npm dependency; must ensure source files are available |
| C | Use TypeScript project references | Complex setup; better for large monorepos |

**Recommended: Option A** — add workspace dependency and ensure `packages/types` is built before renderer runs.

---

## Gap 2: Schema Mismatch — Narration Object vs String

**What goes wrong:** Script Agent outputs `narration: { fullText, estimatedDuration, segments }` but Renderer expects `narration: string`. Pipeline fails at render step.

**Evidence:**
- `src/types/visual.ts:125-129`: `NewSceneSchema.narration` is object
- `src/types/script.ts:50`: `SceneScriptSchema.narration` is string
- `packages/renderer/src/types.ts:141`: `SceneScriptSchema.narration` is string
- `packages/renderer/src/remotion-project-generator.ts:296`: generated Scene.tsx expects `narration: string`

**Root cause:** Script Agent was designed to output structured narration with timing segments, but the Renderer/Compose side expects flat strings for the Subtitle component.

**How to avoid:** Design-time contract between agents was not enforced.

### Fix Options

| Option | Approach | Complexity |
|--------|----------|------------|
| A | Create adapter `NewScene → SceneScript` that extracts `fullText` | Medium — new module |
| B | Change Script Agent to output string narration directly | Low — prompt change |
| C | Unify schemas — both use same format | High — cross-cutting change |

**Recommended: Option A** — adapter preserves timing data from segments while providing string to renderer. This is the approach implied by "visualLayers adapter" in Gap 3.

### Adapter Design

```typescript
// src/utils/scene-adapter.ts
interface NewScene {
  narration: {
    fullText: string;
    estimatedDuration: number;
    segments: Array<{ text: string; startTime: number; endTime: number }>;
  };
  highlights: SceneHighlight[];
  codeHighlights: CodeHighlight[];
  sourceRef: string;
}

interface SceneScript {
  narration: string;
  visualLayers: VisualLayer[];
  highlights?: SceneHighlight[];
  codeHighlights?: CodeHighlight[];
  sourceRef?: string;
}

function adaptSceneToRenderer(scene: NewScene): SceneScript {
  return {
    ...scene,
    narration: scene.narration.fullText,
    visualLayers: [], // Populated from highlights/codeHighlights (Gap 3)
  };
}
```

---

## Gap 3: visualLayers Empty in script.json

**What goes wrong:** E2E test shows video has no screenshots — scenes have empty `visualLayers` array.

**Root cause:** No code populates `visualLayers`. The Script Agent outputs `highlights` and `codeHighlights` but these are never converted to `visualLayers`.

**How to avoid:** The adapter (Gap 2 fix) should also convert `highlights` → text `visualLayers` and `codeHighlights` → code `visualLayers`.

### Visual Layer Population Logic

| Script Output | Visual Layer Type | Content Source |
|---------------|-------------------|----------------|
| `highlights[].text` | `text` | Highlight text |
| `codeHighlights[].codeText` | `code` | Code from highlight |
| `sourceRef` | `screenshot` | URL from research manifest |

The Screenshot Agent populates actual screenshot files; the adapter should create placeholder `visualLayers` entries that reference screenshot IDs.

---

## Common Pitfalls

### Pitfall 1: Zod v3/v4 Incompatibility
**What goes wrong:** Zod v4 schemas fail to parse under zod v3 runtime.
**Why it happens:** The two-process model intentionally isolates zod versions.
**How to avoid:** Never pass zod schemas across process boundary; pass plain JSON data validated before sending.

### Pitfall 2: Orphaned Type Imports
**What goes wrong:** Type-only imports from `@video-script/types` fail silently at compile time (type checking passes) but fail at runtime (module not found).
**Why it happens:** TypeScript type-only imports are erased at compile time; the runtime import statement remains.
**How to avoid:** Use `import type { X }` syntax only when the module is guaranteed to be available at runtime, OR use inline type definitions.

### Pitfall 3: Schema Drift
**What goes wrong:** `SceneScriptSchema` in `src/types/script.ts` and `packages/renderer/src/types.ts` get out of sync.
**Why it happens:** Two separate files defining the same schema.
**How to avoid:** Single source of truth in `@video-script/types`; both processes import from shared package.

### Pitfall 4: Circular Dependencies
**What goes wrong:** `@video-script/types` re-exports from `@video-script/renderer` or vice versa.
**Why it happens:** Monorepo workspace circular refs.
**How to avoid:** Keep shared types in isolated `packages/types` with no internal dependencies.

---

## Code Examples

### Adapter Implementation Pattern

```typescript
// src/utils/scene-adapter.ts
import type { NewScene, NewScriptOutput } from "../types/visual.js";
import type { SceneScript, ScriptOutput } from "../types/script.js";
import type { VisualLayer } from "@video-script/types";

/**
 * Adapts NewScene (Script Agent output) to SceneScript (Renderer input)
 * - Converts narration object to flat string
 * - Converts highlights/codeHighlights to visualLayers
 * - Preserves all timing data in highlights/codeHighlights for Visual Agent
 */
export function adaptNewSceneToSceneScript(scene: NewScene): SceneScript {
  const visualLayers: VisualLayer[] = [];

  // Convert highlights to text visual layers
  for (const highlight of scene.highlights || []) {
    visualLayers.push({
      id: `text-${highlight.text.slice(0, 20)}`,
      type: "text",
      position: { x: "center", y: "bottom", width: "auto", height: "auto", zIndex: 0 },
      content: highlight.text,
      animation: { enter: "fadeIn", enterDelay: highlight.timeInScene },
    });
  }

  // Convert codeHighlights to code visual layers
  for (const codeHighlight of scene.codeHighlights || []) {
    visualLayers.push({
      id: `code-${codeHighlight.codeLine}`,
      type: "code",
      position: { x: 0, y: 0, width: "full", height: "auto", zIndex: 0 },
      content: codeHighlight.codeText,
      animation: { enter: "fadeIn", enterDelay: codeHighlight.timeInScene },
    });
  }

  return {
    id: scene.id,
    type: scene.type,
    title: scene.title,
    narration: scene.narration.fullText,
    duration: scene.duration,
    visualLayers: visualLayers.length > 0 ? visualLayers : undefined,
    highlights: scene.highlights,
    codeHighlights: scene.codeHighlights,
    sourceRef: scene.sourceRef,
  };
}

export function adaptNewScriptToScriptOutput(script: NewScriptOutput): ScriptOutput {
  return {
    title: script.title,
    totalDuration: script.totalDuration,
    scenes: script.scenes.map(adaptNewSceneToSceneScript),
  };
}
```

### Placeholder visualLayers from sourceRef

```typescript
// After Screenshot Agent runs, manifest.json contains screenshot IDs mapped to URLs
// The adapter can create screenshot visual layers referencing those IDs

interface ScreenshotManifest {
  [sceneId: string]: {
    [shotId: string]: string; // path to screenshot file
  };
}

export function enrichVisualLayersWithScreenshots(
  scene: SceneScript,
  manifest: ScreenshotManifest,
): SceneScript {
  const screenshots = manifest[scene.id];
  if (!screenshots) return scene;

  const screenshotLayers: VisualLayer[] = Object.entries(screenshots).map(
    ([shotId, path]) => ({
      id: shotId,
      type: "screenshot" as const,
      position: { x: 0, y: 0, width: "full", height: "full", zIndex: -1 },
      content: path, // Will be resolved to imagePaths at render time
      animation: { enter: "fadeIn", enterDelay: 0 },
    }),
  );

  return {
    ...scene,
    visualLayers: [...screenshotLayers, ...(scene.visualLayers || [])],
  };
}
```

---

## Open Questions

1. **Where should the adapter live?**
   - Options: `src/utils/scene-adapter.ts`, `src/mastra/workflows/video-generation.ts`, inline in compose-agent
   - Recommendation: `src/utils/scene-adapter.ts` — clear separation of concerns

2. **Should Visual Agent be wired into the pipeline?**
   - The Visual Agent can populate `visualLayers` with proper screenshot resources and selectors
   - But Gap 3 says "Script Agent should include URL reference from research"
   - Recommendation: Adapter creates placeholder layers; Visual Agent enriches them

3. **Should @video-script/types be published to npm?**
   - Currently it's a workspace package
   - If renderer is published separately (`@video-script/renderer@npm`), types must be published too
   - Recommendation: For now, workspace link is sufficient

4. **Does the Screenshot Agent run before or after the adapter?**
   - If before: adapter can reference screenshot IDs in visualLayers
   - If after: visualLayers populated with placeholder IDs, enriched after screenshots taken
   - Recommendation: Screenshot Agent runs between Script Agent and adapter; adapter references manifest

---

## Validation Architecture

**Skip — `workflow.nyquist_validation` is `false` in `.planning/config.json`.**

---

## Sources

### Primary (HIGH confidence)
- `packages/types/package.json` — @video-script/types package definition (version 0.1.0, built dist/)
- `packages/types/src/script.ts` — SceneScriptSchema with `narration: string`
- `packages/renderer/package.json` — Renderer dependencies (zod v3.25.56, no @video-script/types)
- `packages/renderer/src/remotion/Scene.tsx:8` — Import from @video-script/types that fails
- `src/types/visual.ts` — NewSceneSchema with `narration: object`
- `src/types/script.ts` — SceneScriptSchema with `narration: string`

### Secondary (MEDIUM confidence)
- `.planning/v1.0-MILESTONE-AUDIT.md` — Gap definitions and blocking issues
- `packages/renderer/src/remotion-project-generator.ts` — Generated Scene.tsx expects string narration

### Tertiary (LOW confidence)
- Runtime behavior not verified (no E2E test has run to completion)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — project structure well understood
- Architecture: HIGH — three-schema flow documented with evidence
- Pitfalls: MEDIUM — zod v3/v4 issue is known; runtime failures not confirmed

**Research date:** 2026-03-23
**Valid until:** 30 days (stable domain — monorepo workspace linking patterns well-established)
