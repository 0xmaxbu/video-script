# Phase 7: Wire Layouts to Composition - Research

**Researched:** 2026-03-23
**Domain:** React/Remotion layout integration, type adapters
**Confidence:** HIGH

## Summary

This phase connects orphaned Phase 2 layout components (Grid, FrostedCard, 8 templates) to the generated Scene.tsx renderer. Currently, Scene.tsx uses inline rendering based on scene type (intro/feature/code/outro) but never calls the professional layout templates that were built in Phase 2. The layouts exist at `packages/renderer/src/remotion/layouts/` and expect `VisualScene` type input, but Scene.tsx receives `SceneScript` type input from the main process.

The core challenge is a **type mismatch**: layouts expect `VisualScene` (with `sceneId`, `layoutTemplate`, `textElements[]`, `mediaResources[]`, `annotations[]`) but Scene.tsx receives `SceneScript` (with `id`, `type`, `title`, `narration`, `visualLayers[]`). Per D-01, we implement an adapter pattern with `convertToVisualScene()` function.

**Primary recommendation:** Create sceneAdapter.ts to convert SceneScript to VisualScene, modify Scene.tsx to use getLayoutComponent() when layoutTemplate is set, and add optional layoutTemplate field to SceneScriptSchema with fallback to inline rendering.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Adapter pattern — Create `convertToVisualScene()` function in Scene.tsx to convert `SceneScript` to `VisualScene`, keeping both types separate (aligns with Phase 6 D-05: renderer uses local zod v3 schemas)
- D-01a: Adapter function location: `packages/renderer/src/utils/sceneAdapter.ts`
- D-01b: Keep `SceneScript` and `VisualScene` separate, do not merge types

**D-02:** Agent-driven layout selection — Add optional `layoutTemplate` field to `SceneScriptSchema`, let script-agent decide which layout to use
- D-02a: layoutTemplate values: `hero-fullscreen | split-horizontal | split-vertical | text-over-image | code-focus | comparison | bullet-list | quote | inline`
- D-02b: When layoutTemplate is empty or "inline", use existing inline rendering (fallback mode)
- D-02c: script-agent prompt update: recommend appropriate layout based on scene content

**D-03:** Backward compatibility — Fallback mode when `layoutTemplate` is unset or "inline"
- D-03a: New projects default to layouts, old projects/unset scenes auto-fallback to inline
- D-03b: Layout render failure degrades to inline rendering with warning log

### Claude's Discretion

- Adapter function implementation details (field mapping)
- Error handling and log format
- Layout component props passing method

### Deferred Ideas (OUT OF SCOPE)

- Layout animation variants (advanced transitions) — v2.0
- Custom layout creation feature — v2.0
- Layout A/B testing — not needed now
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-04 | Grid-based layout system with safe zones (12-column) | Grid.tsx + grid-utils.ts already implement 12-column system with safe zones (80px top/bottom, 120px left/right) |
| VIS-05 | Layout templates: hero-fullscreen, comparison, split-vertical, bullet-list, text-over-image | 8 layout components exist in layouts/index.ts, getLayoutComponent() maps template strings to components |
| VIS-06 | PPT-style visual hierarchy (headlines 72pt+, body 18-24pt) | TYPOGRAPHY constants in grid-utils.ts: title.hero=80, title.section=60, body.primary=24, body.secondary=20 |
| VIS-07 | Frosted glass cards with backdrop-filter effects | FrostedCard.tsx implements backdrop-filter blur with configurable opacity/blur/radius |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI component framework | Remotion dependency, project standard |
| Remotion | 4.0.436 | Video rendering | Core renderer, already integrated |
| zod | v3 (renderer) | Runtime validation | Per Phase 6 D-05: renderer uses local zod v3 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @video-script/types | workspace | Shared type definitions | Type imports only, not runtime validation in renderer |
| @remotion/transitions | 4.0.436 | Scene transitions | Already used in Composition.tsx |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Adapter pattern | Unified schema | Adapter preserves Phase 6 D-05 decision (zod v3/v4 isolation) |
| Per-scene layoutTemplate | Global layout | Per-scene allows mixed layouts for better visual variety |

**Installation:** No new packages required — all dependencies already in place.

**Version verification:**
```
packages/renderer uses zod ^3.24.4 (local node_modules)
main process uses zod ^4.3.6
```

## Architecture Patterns

### Recommended Project Structure
```
packages/renderer/src/
├── utils/
│   └── sceneAdapter.ts          # NEW: convertToVisualScene() adapter
├── remotion/
│   ├── Scene.tsx                # MODIFY: add layout routing
│   ├── Composition.tsx          # UNCHANGED: already passes SceneScript
│   └── layouts/
│       ├── index.ts             # LayoutProps, getLayoutComponent()
│       ├── Grid.tsx             # 12-column wrapper
│       ├── FrostedCard.tsx      # Glass morphism card
│       ├── grid-utils.ts        # TYPOGRAPHY, GRID_CONSTANTS
│       └── [8 layout components].tsx
└── types.ts                     # SceneScript, VisualLayer (zod v3)
```

### Pattern 1: Scene Adapter Pattern
**What:** Convert `SceneScript` (main process output) to `VisualScene` (layout component input)
**When to use:** When bridging two type systems with different structures
**Example:**
```typescript
// packages/renderer/src/utils/sceneAdapter.ts
import type { SceneScript, VisualLayer } from "../types.js";
import type { VisualScene, TextElement, MediaResource, NarrationTimeline } from "@video-script/types";

export function convertToVisualScene(
  scene: SceneScript,
  screenshots: Record<string, string>
): VisualScene {
  // Map SceneScript.id -> VisualScene.sceneId
  // Map SceneScript.title -> textElements.find(role=title)
  // Map SceneScript.narration -> narrationTimeline
  // Map SceneScript.visualLayers -> mediaResources
  // Map SceneScript.highlights -> annotations (if present)

  const textElements: TextElement[] = [
    {
      content: scene.title,
      role: "title",
      position: "center",
      narrationBinding: {
        triggerText: scene.title,
        segmentIndex: 0,
        appearAt: 0,
      },
    },
  ];

  const narrationTimeline: NarrationTimeline = {
    text: scene.narration,
    duration: scene.duration,
    segments: [{ text: scene.narration, startTime: 0, endTime: scene.duration }],
  };

  const mediaResources = convertVisualLayersToResources(scene.visualLayers || [], screenshots);

  return {
    sceneId: scene.id,
    layoutTemplate: scene.layoutTemplate || inferLayoutFromType(scene.type),
    narrationTimeline,
    mediaResources,
    textElements,
    annotations: convertHighlightsToAnnotations(scene.highlights || []),
    animationPreset: "medium",
    transition: scene.transition || { type: "fade", duration: 0.5 },
  };
}
```

### Pattern 2: Layout Selection with Fallback
**What:** Route scene rendering through layout templates with inline fallback
**When to use:** Scene.tsx needs to decide between layout components and legacy inline rendering
**Example:**
```typescript
// packages/renderer/src/remotion/Scene.tsx (modified)
import { getLayoutComponent } from "./layouts/index.js";
import { convertToVisualScene } from "../utils/sceneAdapter.js";

export const Scene: React.FC<SceneProps> = ({ scene, imagePaths, annotations }) => {
  const layoutTemplate = scene.layoutTemplate;

  // D-03: Fallback to inline when no template or explicit "inline"
  if (!layoutTemplate || layoutTemplate === "inline") {
    return <InlineScene scene={scene} imagePaths={imagePaths} annotations={annotations} />;
  }

  const LayoutComponent = getLayoutComponent(layoutTemplate);

  // D-03b: Degrade gracefully on layout failure
  if (!LayoutComponent) {
    console.warn(`Unknown layout template: ${layoutTemplate}, falling back to inline`);
    return <InlineScene scene={scene} imagePaths={imagePaths} annotations={annotations} />;
  }

  try {
    const visualScene = convertToVisualScene(scene, imagePaths || {});
    const screenshotsMap = new Map(Object.entries(imagePaths || {}));

    return (
      <LayoutComponent scene={visualScene} screenshots={screenshotsMap}>
        <AnnotationRenderer annotations={annotations} />
        <Subtitle text={scene.narration} />
      </LayoutComponent>
    );
  } catch (error) {
    console.warn(`Layout render failed: ${error}, falling back to inline`);
    return <InlineScene scene={scene} imagePaths={imagePaths} annotations={annotations} />;
  }
};
```

### Anti-Patterns to Avoid
- **Don't merge SceneScript and VisualScene types:** This violates Phase 6 D-05 (renderer uses local zod v3)
- **Don't remove inline rendering:** Backward compatibility requires fallback (D-03)
- **Don't skip the adapter:** Direct type casting will cause runtime errors
- **Don't forget Subtitle/AnnotationRenderer:** Layouts don't render these by default

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Layout component selection | Custom switch statement | getLayoutComponent(template) | Already exists in layouts/index.ts |
| Grid positioning | Manual pixel calculations | getGridColumnPx(), getGridSpanPx() | grid-utils.ts provides these |
| Typography sizes | Magic numbers | TYPOGRAPHY constants | grid-utils.ts: hero=80, section=60, body=24 |
| Frosted glass effect | Custom backdrop-filter | FrostedCard component | Already implements blur + opacity + radius |

**Key insight:** All visual components exist — this is purely an integration phase.

## Common Pitfalls

### Pitfall 1: Type Field Name Mismatch
**What goes wrong:** SceneScript uses `id` but VisualScene uses `sceneId`; SceneScript uses `title` but VisualScene uses `textElements.find(role=title)`
**Why it happens:** Two types evolved independently (main process vs renderer)
**How to avoid:** Use adapter pattern with explicit field mapping, document mapping in comments
**Warning signs:** TypeScript errors about missing properties, undefined values at runtime

### Pitfall 2: Forgetting Subtitle and Annotations
**What goes wrong:** Layouts render visual content but subtitle/narration text and annotations disappear
**Why it happens:** Layout components don't include Subtitle or AnnotationRenderer by design
**How to avoid:** Always compose layouts with `<Subtitle text={scene.narration} />` and `<AnnotationRenderer annotations={annotations} />` as children or siblings
**Warning signs:** Video plays without captions, highlights don't appear

### Pitfall 3: Screenshots Map vs Record Type Mismatch
**What goes wrong:** Layouts expect `Map<string, string>` but Scene.tsx receives `Record<string, string>`
**Why it happens:** Different data structures used in different parts of codebase
**How to avoid:** Convert Record to Map in adapter: `new Map(Object.entries(imagePaths))`
**Warning signs:** "screenshots.get is not a function" runtime error

### Pitfall 4: Missing layoutTemplate Field
**What goes wrong:** All scenes render with inline fallback even after integration
**Why it happens:** SceneScriptSchema doesn't have layoutTemplate field, script-agent doesn't set it
**How to avoid:** Add optional `layoutTemplate` field to SceneScriptSchema, update script-agent prompt
**Warning signs:** Layout components never invoked, console shows fallback warnings

## Code Examples

### Type Field Mapping (from CONTEXT.md)
```typescript
// Field mapping reference for adapter implementation
// | SceneScript (Scene.tsx) | VisualScene (Layouts)    |
// |------------------------|--------------------------|
// | id                     | sceneId                  |
// | type                   | (no direct mapping)      |
// | title                  | textElements.find(title) |
// | narration              | narrationTimeline.text   |
// | visualLayers[]         | mediaResources[]         |
// | (none)                 | layoutTemplate           |
// | highlights/codeHighlights | annotations[]        |
```

### Layout Template to Scene Type Mapping
```typescript
// D-02c: Recommend layout based on scene content
function inferLayoutFromType(
  type: "intro" | "feature" | "code" | "outro",
  visualLayers?: VisualLayer[]
): LayoutTemplate {
  switch (type) {
    case "intro":
      return "hero-fullscreen";
    case "feature":
      const hasCode = visualLayers?.some(l => l.type === "code");
      return hasCode ? "split-horizontal" : "text-over-image";
    case "code":
      return "code-focus";
    case "outro":
      return "bullet-list";
    default:
      return "hero-fullscreen";
  }
}
```

### SceneScriptSchema Extension
```typescript
// packages/renderer/src/types.ts (add to existing SceneScriptSchema)
export const SceneScriptSchema = z.object({
  // ... existing fields ...

  // D-02: Optional layout template selection
  layoutTemplate: z.enum([
    "hero-fullscreen",
    "split-horizontal",
    "split-vertical",
    "text-over-image",
    "code-focus",
    "comparison",
    "bullet-list",
    "quote",
    "inline"
  ]).optional(),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline scene rendering by type | Layout templates with adapter | Phase 7 | Professional PPT-style visuals |
| No layoutTemplate field | Optional layoutTemplate in SceneScript | Phase 7 | Agent-driven layout selection |
| Single type for all | SceneScript + VisualScene separation | Phase 6 | zod v3/v4 isolation preserved |

**Deprecated/outdated:**
- Direct scene.type-based rendering: Will coexist with layout-based rendering via fallback (D-03)

## Open Questions

1. **Should annotations be part of VisualScene or passed separately?**
   - What we know: AnnotationRenderer currently receives annotations as prop, layouts expect annotations in VisualScene
   - What's unclear: Whether to merge highlights into VisualScene.annotations or keep separate
   - Recommendation: Merge in adapter — convert highlights/codeHighlights to VisualScene.annotations format

2. **How should script-agent determine layoutTemplate?**
   - What we know: visual-agent already has `recommendLayout()` function based on scene type
   - What's unclear: Whether script-agent should call this or let renderer infer
   - Recommendation: Let script-agent set layoutTemplate based on content analysis, use `inferLayoutFromType()` as fallback in adapter

## Sources

### Primary (HIGH confidence)
- `packages/renderer/src/remotion/layouts/index.ts` — LayoutProps interface, getLayoutComponent() function
- `packages/renderer/src/remotion/Scene.tsx` — Current inline rendering logic
- `packages/renderer/src/types.ts` — SceneScript schema (zod v3)
- `src/types/visual.ts` — VisualScene schema definition

### Secondary (MEDIUM confidence)
- `.planning/phases/06-type-schema/06-CONTEXT.md` — D-05: renderer uses local zod v3 schemas
- `.agents/skills/remotion/SKILL.md` — Remotion best practices

### Tertiary (LOW confidence)
- None — all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components exist, no new dependencies
- Architecture: HIGH — adapter pattern well-established, CONTEXT.md provides clear direction
- Pitfalls: HIGH — type mismatches documented in CONTEXT.md code_context section

**Research date:** 2026-03-23
**Valid until:** 30 days (stable codebase, integration phase)
