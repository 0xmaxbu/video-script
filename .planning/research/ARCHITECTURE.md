# Architecture Research: video-script

**Domain:** AI video generation tool (technical tutorial videos)
**Researched:** 2026-03-22
**Confidence:** MEDIUM-HIGH (codebase analysis + verified Remotion docs)

---

## Executive Summary

The project uses a **four-agent pipeline** (Research -> Script -> Visual -> Screenshot -> Compose) with a **two-process architecture** (Main CLI + Renderer subprocess). The existing architecture already supports the core flow; the three integration points focus on enhancing capabilities within existing component boundaries rather than changing fundamental structure.

---

## Current Architecture

### Agent Pipeline

```
Input (title + links)
  |
  v
Research Agent --> Markdown (priority-tagged)
  |
  v
Script Agent --> JSON (narration + segments + highlights)
  |
  v
Visual Agent --> Visual Plan (layouts + annotations + bindings)
  |
  v
Screenshot Agent --> Screenshots (manifest.json)
  |
  v
Compose Agent --> Remotion Project
  |
  v
Renderer Subprocess --> MP4 + SRT
```

### Two-Process Model

| Process | Zod Version | Responsibility |
|---------|-------------|----------------|
| Main CLI | v4 | Agents, orchestration, tools |
| Renderer | v3 | Remotion rendering, isolated |

**Reason:** Runtime type errors and Node.js v24 native module compatibility.

### Data Flow

1. **Research** outputs Markdown with `[priority: essential|important|supporting|skip]` tags
2. **Script** converts to narration with time-segmented highlights
3. **Visual** creates layout + annotation plans with `narrationBinding`
4. **Screenshot** captures based on `ScreenshotType` (decorative vs informational)
5. **Compose** generates Remotion TSX project
6. **Renderer** spawns subprocess for actual video rendering

---

## Integration Point 1: Deep Research Agent

### Current State

Single `webFetchTool` call per URL, with Markdown synthesis. No iterative research or cross-referencing.

### Enhancement: Multi-Round Research

**Architecture Pattern:** Agent tool-use loop

```
Research Agent (Loop)
  |-- webFetch (fetch content)
  |-- analyzeCode (extract code examples)
  |-- crossReference (link related content)
  |-- evaluateQuality (score source reliability)
  `-- synthesize (merge findings)
```

**Integration Points:**

| Component | Change | Complexity |
|-----------|--------|------------|
| `src/mastra/tools/web-fetch.ts` | Add response caching | Low |
| `src/mastra/agents/research-agent.ts` | Add tool selection logic | Medium |
| `src/types/research.ts` | Add source quality scoring | Low |

**Key Insight:** The current `webFetchTool` already returns structured content. Deep research adds:
- Iterative refinement (fetch -> analyze gaps -> fetch more)
- Code example extraction (currently just text)
- Source credibility scoring

**Implementation:**

```typescript
// New tool: researchLoop
const deepResearchTool = createTool({
  id: "deep-research",
  inputSchema: z.object({
    topic: z.string(),
    urls: z.array(z.string()),
    depth: z.enum(["surface", "deep", "comprehensive"]).default("deep"),
    focusAreas: z.array(z.string()).optional(),
  }),
  execute: async ({ topic, urls, depth }) => {
    // Phase 1: Initial fetch
    const initial = await Promise.all(urls.map(url => webFetch(url)));

    // Phase 2: Gap analysis (what's missing?)
    const gaps = analyzeGaps(initial, topic);

    // Phase 3: Follow-up fetches for gaps
    const followUps = gaps.length > 0
      ? await researchGaps(gaps, depth)
      : [];

    // Phase 4: Synthesis
    return synthesize([...initial, ...followUps], topic);
  }
});
```

**Mastra Integration:**

The existing `researchAgent` uses a single tool. To add multi-round research:

1. Add `deepResearchTool` as additional tool
2. Update agent instructions to use loop when `depth: "comprehensive"`
3. No pipeline change needed (single agent handles it)

**Verification:**
- Run `npm run test` for existing tests
- Add integration test: `research-agent-deep.test.ts`

---

## Integration Point 2: Visual Effects (Annotations + Animations)

### Current State

**Annotations defined in:** `src/types/visual.ts`
- Types: circle, underline, arrow, highlight, box, number, crossout, checkmark
- Colors: attention (#FF3B30), highlight (#FFCC00), info (#007AFF), success (#34C759)
- Timing: `narrationBinding` with `appearAt` seconds

**Animation in:** `src/remotion/components/FeatureSlide.tsx`
- Uses `spring()` and `interpolate()` from Remotion
- Per-element animations with delays

**Gap:** Annotations are defined in types but **not rendered** in the current `Scene.tsx`.

### Enhancement: Annotation Renderer Component

**Architecture Pattern:** Composition layer addition

```
Scene (existing)
  |-- Background Layer (screenshot/image)
  |-- Content Layer (title, code, text)
  |-- Annotation Layer (NEW - overlay annotations)
  `-- Subtitle Layer (SRT overlay)
```

**Integration Points:**

| Component | Change | Complexity |
|-----------|--------|------------|
| `src/remotion/components/AnnotationRenderer.tsx` | New component | Medium |
| `src/remotion/Scene.tsx` | Add annotation layer | Low |
| `src/types/visual.ts` | Annotation types already exist | N/A |

**Remotion Verified Patterns:**

From official docs:
```tsx
// Animation primitives (verified working)
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

// Spring for physics-based motion
const progress = spring({
  frame: frame - delay,
  fps,
  config: { damping: 12, stiffness: 100 },
});

// Interpolate for smooth transitions
const opacity = interpolate(frame, [0, 20], [0, 1]);
const scale = interpolate(frame, [0, 10, 20], [0.5, 1.1, 1]);

// Layering: render order = z-index (later = on top)
<AbsoluteFill> {/* Bottom layer */}
<AbsoluteFill> {/* Middle layer */}
<AbsoluteFill> {/* Top layer */}
```

**Annotation Renderer Design:**

```tsx
// src/remotion/components/AnnotationRenderer.tsx
interface AnnotationRendererProps {
  annotations: Annotation[];
  narrationSegments: NarrationSegment[];
  fps: number;
  width: number;
  height: number;
}

export const AnnotationRenderer: React.FC<AnnotationRendererProps> = ({
  annotations,
  narrationSegments,
  fps,
}) => {
  const frame = useCurrentFrame();

  return (
    <>
      {annotations.map((annotation) => {
        const triggerFrame = annotation.narrationBinding.appearAt * fps;
        const isActive = frame >= triggerFrame;

        // Interpolate visibility
        const opacity = interpolate(
          frame,
          [triggerFrame, triggerFrame + 10],
          [0, 1]
        );

        if (!isActive) return null;

        return (
          <AbsoluteFill
            key={annotation.id}
            style={{ opacity, pointerEvents: "none" }}
          >
            <AnnotationShape annotation={annotation} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};
```

**Animation Preset Mapping:**

| Preset | damping | stiffness | Use Case |
|--------|---------|-----------|----------|
| fast | 15 | 200 | Code highlights |
| medium | 12 | 100 | Feature callouts |
| slow | 8 | 50 | Emphasis |
| dramatic | 5 | 300 | Key moments |

**Verification:**
- Build: `npm run build`
- Visual test: `remotion studio` to preview

---

## Integration Point 3: PPT-Style Layout System

### Current State

**Layout templates defined** in `visual.ts`:
- hero-fullscreen, split-horizontal, split-vertical
- text-over-image, code-focus, comparison
- bullet-list, quote

**Layout mapping in** `compose-agent.ts`:
```typescript
const mapping = {
  "hero-fullscreen": "HeroFullscreen",
  "split-horizontal": "SplitHorizontal",
  // ...
};
```

**Gap:** Limited layout component library. `src/remotion/components/` has only `FeatureSlide.tsx`, `CodeAnimation.tsx`, `Transitions.tsx`.

### Enhancement: Grid-Based Layout System

**Architecture Pattern:** Layout composition with grid zones

```
Layout Grid (12-column, 16:9 aspect)
  |
  +-- Header Zone (title placement)
  +-- Main Zone (content: screenshot, code, etc.)
  +-- Side Zone (supplementary content)
  +-- Footer Zone (subtitle/captions)
  +-- Overlay Zone (annotations)
```

**PPT-Style Features to Add:**

| Feature | Description | Complexity |
|---------|-------------|------------|
| Grid zones | 12-column responsive layout | Medium |
| Master slides | Base layouts with placeholders | Medium |
| Slide transitions | fade, slide, wipe, iris | Low |
| Element anchoring | top-left, center, bottom-right | Low |
| Content placeholders | "insert title here" zones | Medium |

**Integration Points:**

| Component | Change | Complexity |
|-----------|--------|------------|
| `src/remotion/layouts/` | New layout components | Medium |
| `src/remotion/components/SlideGrid.tsx` | Grid system | Medium |
| `src/remotion/components/Transition.tsx` | Slide transitions | Low |
| `src/types/visual.ts` | Add `gridZone` to LayoutTemplate | Low |

**Layout Component Structure:**

```
src/remotion/layouts/
  |-- index.ts (exports all layouts)
  |-- MasterSlide.tsx (base component)
  |-- HeroFullscreen.tsx
  |-- SplitHorizontal.tsx
  |-- SplitVertical.tsx
  |-- TextOverImage.tsx
  |-- CodeFocus.tsx
  |-- Comparison.tsx
  |-- BulletList.tsx
  |-- Quote.tsx
  |-- TitleSlide.tsx (NEW - intro/outro)
  |-- ThreeColumn.tsx (NEW - for comparisons)
  |-- GridLayout.tsx (NEW - flexible grid)
```

**Grid Zone Schema Extension:**

```typescript
// Extend LayoutTemplateEnum in visual.ts
export const LayoutTemplateEnum = z.enum([
  // ... existing
  "grid-flexible", // NEW: User-defined grid zones
  "title-content", // NEW: Title + content areas
  "four-quadrant", // NEW: 2x2 grid for comparisons
]);

// Zone definitions
export const GridZoneSchema = z.object({
  id: z.string(),
  row: z.number().int().min(0),
  rowSpan: z.number().int().positive(),
  col: z.number().int().min(0),
  colSpan: z.number().int().positive(),
  content: z.enum(["title", "screenshot", "code", "text", "annotation"]),
});
```

**Master Slide Pattern:**

```tsx
// src/remotion/layouts/MasterSlide.tsx
interface MasterSlideProps {
  children: {
    header?: React.ReactNode;
    main?: React.ReactNode;
    side?: React.ReactNode;
    footer?: React.ReactNode;
    overlays?: React.ReactNode;
  };
  backgroundColor?: string;
  gridTemplate?: string; // CSS grid template
}

export const MasterSlide: React.FC<MasterSlideProps> = ({
  children,
  backgroundColor = "#1a1a1a",
  gridTemplate = `
    "header header" 60px
    "main side" 1fr
    "footer footer" 40px
  `,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <div
        style={{
          display: "grid",
          grid-template: gridTemplate,
          width: "100%",
          height: "100%",
          padding: 40,
          gap: 20,
        }}
      >
        <div style={{ gridArea: "header" }}>{children.header}</div>
        <div style={{ gridArea: "main" }}>{children.main}</div>
        <div style={{ gridArea: "side" }}>{children.side}</div>
        <div style={{ gridArea: "footer" }}>{children.footer}</div>
      </div>
      {children.overlays}
    </AbsoluteFill>
  );
};
```

**Verification:**
- Type check: `npm run typecheck`
- Build: `npm run build`

---

## Cross-Cutting Concerns

### 1. Narration Binding (all three integration points)

All visual elements must bind to narration timing:

```typescript
const narrationBinding = {
  triggerText: "闭包类型收窄",
  segmentIndex: 1,
  appearAt: 4.5, // seconds into narration
};
```

**Pattern:** `secondsToFrames(appearAt, fps)` for Remotion frame calculations.

### 2. Two-Process Constraints

Any new tools or components must be compatible with:

| Constraint | Implication |
|------------|-------------|
| Zod v4 in main, v3 in renderer | No v4-specific features in renderer TSX |
| JSON file communication | No functions/classes passed to renderer |
| Separate node_modules | Duplicate dependencies if used in both |

### 3. Error Propagation

Current error codes: INVALID_INPUT, WEB_FETCH_FAILED, SCREENSHOT_FAILED, CODE_HIGHLIGHT_FAILED, REMOTION_RENDER_FAILED, LLM_API_ERROR

Add: RESEARCH_DEPTH_INCOMPLETE, ANNOTATION_RENDER_FAILED, LAYOUT_TEMPLATE_INVALID

---

## Phase-Specific Recommendations

| Phase | Focus | Integration Point |
|-------|-------|-------------------|
| 1 | Annotation Renderer | Visual Effects |
| 2 | Grid Layout System | PPT-Style Layouts |
| 3 | Deep Research Loop | Research Agent |
| 4 | Transition Effects | Visual Effects |
| 5 | Master Slides | PPT-Style Layouts |

**Reasoning:**
- Start with annotation renderer (clear value, self-contained component)
- Then grid system (foundational for complex layouts)
- Then deep research (affects upstream only, lower risk)
- Transitions enhance existing layouts (low effort, high impact)
- Master slides abstract layout composition (advanced)

---

## Sources

**Verified (HIGH confidence):**
- Remotion `spring()`: https://remotion.dev/docs/spring
- Remotion `interpolate()`: https://remotion.dev/docs/interpolate
- Remotion `AbsoluteFill`: https://remotion.dev/docs/absolute-fill
- Remotion `Sequence`: https://remotion.dev/docs/sequence

**Codebase Analysis (MEDIUM confidence):**
- Agent pipeline: `src/mastra/agents/*.ts`
- Visual types: `src/types/visual.ts`
- Remotion components: `src/remotion/*.tsx`, `src/remotion/components/*.tsx`
- Renderer: `packages/renderer/src/*.ts`

**WebSearch unavailable during research.**

---

## Open Questions

1. **Deep Research:** How should source quality scoring weight against quantity?
2. **Annotations:** Should annotations be SVG-based or CSS-based (performance difference)?
3. **Grid Layout:** Should it support responsive breakpoints for different video formats?
4. **Master Slides:** Should they support theme/brand customization?
