# Phase 1: Annotation Renderer - Research

**Researched:** 2026-03-22
**Domain:** Remotion SVG annotation overlay system
**Confidence:** HIGH

## Summary

Phase 1 implements SVG-based animated annotation overlays (circle, underline, arrow, box, highlight, number) on top of screenshots and code blocks in Remotion. All annotations use a hand-drawn wobbly style with stroke-dashoffset draw-on animation and spring physics. The existing `Circle.tsx` is the reference implementation; five more annotation types need to be built following the same pattern. `Scene.tsx` needs to be updated to accept an `annotations` prop and render an `AnnotationRenderer` component that orchestrates all annotation types.

**Primary recommendation:** Mirror Circle.tsx's architecture for each new type. Each annotation component accepts x/y position, dimensions, color, and appearAt frame; generates a wobbly SVG path; and animates stroke-dashoffset from pathLength to 0 using spring(progress) + interpolate with clamp.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- All annotation types use hand-drawn wobbly style with `generateWobblyPath()`
- All annotation types use stroke-dashoffset draw-on animation (not type-specific)
- Spring config: damping: 100, stiffness: 300
- All `interpolate()` calls use `extrapolateRight: "clamp"`
- Annotations stay visible after appearing (no fade out)
- Region/coordinates positioning with absolute pixels
- Per-scene layering — each scene has its own annotation array
- Scene receives `annotations: Annotation[]` prop directly
- Z-order determined by timestamp (earlier-appearing annotations render below)
- Reuse `generateWobblyPath()` and `getAnnotationColor()` from existing annotations/index.ts

### Claude's Discretion

- Component file organization (one file per type vs. grouped)
- Internal implementation details of each annotation SVG path
- Whether to add helper utilities

### Deferred Ideas (OUT OF SCOPE)

- crossout and checkmark annotation types
- Text-matching annotation targeting (region/coordinates only)
- Per-annotation-type animation variation
- Annotation undraw/fade-out lifecycle

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Annotation renderer component renders highlight, underline, circle, number effects | Circle.tsx exists; need Underline, Arrow, Box, Highlight, Number components |
| VIS-02 | Annotations animate correctly using spring/interpolate | Circle.tsx uses spring({damping:100, stiffness:300}) + interpolate with clamp |
| VIS-03 | Animation extrapolation properly clamped (no values beyond intended range) | Circle.tsx uses `extrapolateRight: "clamp"` in interpolate call |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| remotion | 4.0.436 | Video rendering framework | Project uses Remotion for all video composition |
| react | 19.2.4 | UI rendering | Remotion is React-based |
| zod | 3.25.56 (renderer), 4.3.6 (main) | Schema validation | Used for Annotation schema validation |

### Project Utilities (Already Exist)
| Utility | File | Purpose |
|---------|------|---------|
| `generateWobblyPath()` | packages/renderer/src/remotion/annotations/index.ts | Generates hand-drawn SVG path with configurable wobble |
| `getAnnotationColor()` | packages/renderer/src/remotion/annotations/index.ts | Maps AnnotationColor enum to hex |
| `ANNOTATION_COLORS` | src/types/visual.ts + annotations/index.ts | Color constants (attention, highlight, info, success) |
| `Circle.tsx` | packages/renderer/src/remotion/annotations/Circle.tsx | Reference implementation |

### Not Used In This Phase
| Library | Reason |
|---------|--------|
| @remotion/transitions | Scene transitions are Phase 4 |
| @remotion/studio | Not needed for annotation rendering |

---

## Architecture Patterns

### Recommended Project Structure
```
packages/renderer/src/remotion/
├── annotations/
│   ├── index.ts              # Exports + utilities (existing)
│   ├── Circle.tsx            # Reference implementation (existing)
│   ├── AnnotationRenderer.tsx # NEW: Orchestrates all annotation types
│   ├── Underline.tsx         # NEW
│   ├── Arrow.tsx             # NEW
│   ├── Box.tsx               # NEW
│   ├── Highlight.tsx        # NEW
│   └── Number.tsx            # NEW
├── Scene.tsx                 # MODIFIED: Add annotations prop
└── components/               # Existing layer components (untouched)
```

### Pattern 1: Hand-Drawn Wobbly Path + Stroke-Dashoffset Animation

**What:** Each annotation type generates a wobbly SVG path and animates it using stroke-dashoffset.

**When to use:** All 6 annotation types.

**Reference (from Circle.tsx):**
```tsx
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { getAnnotationColor, generateWobblyPath } from "./index.js";
import type { AnnotationColor } from "@video-script/types";

export interface CircleProps {
  x: number;
  y: number;
  radius: number;
  color: AnnotationColor;
  strokeWidth?: number;
  wobble?: number;
  appearAt?: number; // 帧数
}

export const Circle: React.FC<CircleProps> = ({
  x, y, radius, color,
  strokeWidth = 3,
  wobble = 3,
  appearAt = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation progress after appearAt
  const effectiveFrame = Math.max(0, frame - appearAt);
  const progress = spring({
    frame: effectiveFrame,
    fps,
    config: { damping: 100, stiffness: 300 },
  });

  // Generate wobbly circle path
  const points: Array<{ x: number; y: number }> = [];
  const segments = 36;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
    });
  }
  const path = generateWobblyPath(points, wobble);
  const pathLength = 2 * Math.PI * radius;

  // stroke-dashoffset draw-on effect
  const strokeDashoffset = interpolate(progress, [0, 1], [pathLength, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <svg
      style={{
        position: "absolute",
        left: x - radius - 10,
        top: y - radius - 10,
        width: radius * 2 + 20,
        height: radius * 2 + 20,
        overflow: "visible",
      }}
    >
      <path
        d={path}
        stroke={getAnnotationColor(color)}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
        style={{
          filter: `drop-shadow(0 0 4px ${getAnnotationColor(color)}40)`,
        }}
      />
    </svg>
  );
};
```

**Key observations:**
- `spring()` returns a raw number (0 at start, 1 when settled) - NOT an object
- When `from`/`to` are not specified, spring() defaults to [0, 1]
- The `interpolate()` maps spring output [0, 1] to strokeDashoffset [pathLength, 0]
- `extrapolateRight: "clamp"` prevents overshoot beyond 0
- SVG uses `overflow: "visible"` to show drop-shadow filter without clipping
- Circle is centered at (x, y) by adding radius offset to path points

### Pattern 2: AnnotationRenderer Orchestrator

**What:** A component that maps over an array of annotations and renders the appropriate component per type.

**When to use:** Scene rendering annotations from a VisualScene's annotations array.

**Expected shape:**
```tsx
// packages/renderer/src/remotion/annotations/AnnotationRenderer.tsx
import React from "react";
import { Circle } from "./Circle.js";
import { Underline } from "./Underline.js";
import { Arrow } from "./Arrow.js";
import { Box } from "./Box.js";
import { Highlight } from "./Highlight.js";
import { Number } from "./Number.js";
import type { Annotation } from "@video-script/types";

interface AnnotationRendererProps {
  annotations: Annotation[];
}

export const AnnotationRenderer: React.FC<AnnotationRendererProps> = ({
  annotations,
}) => {
  // Sort by appearAt for z-ordering (earlier = below later)
  const sorted = [...annotations].sort(
    (a, b) => a.narrationBinding.appearAt - b.narrationBinding.appearAt
  );

  return (
    <>
      {sorted.map((annotation, index) => {
        const { type, target, style, narrationBinding } = annotation;
        const { appearAt } = narrationBinding;

        switch (type) {
          case "circle":
            // D-08: position via x, y, radius (region/coordinates)
            return (
              <Circle
                key={index}
                x={target.region ? /* ... */ : 0}
                y={target.region ? /* ... */ : 0}
                radius={50}
                color={style.color}
                strokeWidth={style.size === "small" ? 2 : style.size === "large" ? 4 : 3}
                appearAt={appearAt}
              />
            );
          case "underline":
            return <Underline key={index} x={0} y={0} width={100} color={style.color} appearAt={appearAt} />;
          case "arrow":
            return <Arrow key={index} x1={0} y1={0} x2={100} y2={50} color={style.color} appearAt={appearAt} />;
          case "box":
            return <Box key={index} x={0} y={0} width={100} height={60} color={style.color} appearAt={appearAt} />;
          case "highlight":
            return <Highlight key={index} x={0} y={0} width={100} height={20} color={style.color} appearAt={appearAt} />;
          case "number":
            return <Number key={index} x={0} y={0} n={1} color={style.color} appearAt={appearAt} />;
          default:
            return null;
        }
      })}
    </>
  );
};
```

### Pattern 3: Per-Scene Annotation Prop

**What:** Scene receives annotations as a direct prop (not nested in visualLayers).

**When to use:** Scene.tsx integration.

**Note:** The current `SceneScript` type (packages/renderer/src/types.ts) does NOT have an annotations field. VisualScene (src/types/visual.ts) does have `annotations: z.array(AnnotationSchema)`. The phase D-11/D-16 says Scene receives `annotations: Annotation[]` prop directly. This means the plan needs to decide whether to:
1. Extend `SceneScript` schema to add an optional `annotations` field, or
2. Pass annotations as a separate prop to Scene component outside the scene prop

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| Hand-drawn SVG paths | Custom path generation with Math.random() per render | `generateWobblyPath()` | Consistent wobble algorithm, already exists |
| Color mapping | Hardcoded hex strings per color | `getAnnotationColor()` + `ANNOTATION_COLORS` | Single source of truth |
| Spring animation | Manual spring physics calculations | `spring()` from remotion | Physics-based, already used in Circle |
| Path length calculation | String-length estimation | `2 * Math.PI * radius` for circles, `Math.sqrt((x2-x1)²+(y2-y1)²)` for lines | Accurate measurement |

**Key insight:** Circle.tsx's `calculatePathLength()` uses `path.length * 0.5` which is a rough approximation. For straight-line annotations (underline, arrow, box edges), use proper geometric formulas.

---

## Common Pitfalls

### Pitfall 1: Wrong `interpolate` Clamping
**What goes wrong:** Annotation overshoots/flickers when spring settles.
**Why it happens:** Missing `extrapolateRight: "clamp"` in interpolate call.
**How to avoid:** Always include `extrapolateRight: "clamp"` when mapping spring [0,1] to animation values.
**Warning signs:** Annotations visibly "bounce" or flash when appearing.

### Pitfall 2: Wobbly Path Changes Every Render
**What goes wrong:** Path regenerates with different wobble on each frame, causing jitter.
**Why it happens:** `generateWobblyPath()` uses `Math.random()` which produces different values each call.
**How to avoid:** Memoize the path generation or accept that the wobbly style is intentionally imperfect. The current Circle.tsx regenerates the path every render but this is acceptable for the hand-drawn aesthetic.
**Note:** This is actually desired behavior for hand-drawn style - the "imperfection" is the feature.

### Pitfall 3: SVG Clipping
**What goes wrong:** Drop shadow or wobbly edges get cut off.
**Why it happens:** SVG default `overflow: hidden` clips content at SVG boundaries.
**How to avoid:** Use `overflow: "visible"` on the SVG element (as seen in Circle.tsx).

### Pitfall 4: Wrong Spring Config Results in Over/Under Damping
**What goes wrong:** Animation too bouncy or too sluggish.
**Why it happens:** damping: 100, stiffness: 300 is a specific feel (fairly damped, snappy). Default remotion spring is {damping: 10, stiffness: 100} which is very bouncy.
**How to avoid:** Use EXACTLY `{ damping: 100, stiffness: 300 }` per D-05.

### Pitfall 5: Annotation Path Bounding Box Too Small
**What goes wrong:** SVG container clips the annotation.
**Why it happens:** Calculating SVG left/top/size without accounting for wobble overshoot.
**How to avoid:** Add padding (e.g., `x - radius - 10` in Circle.tsx for a 10px padding).

---

## Code Examples

### Underline Annotation Path
```tsx
// Start point and end point define a horizontal line below text
const x1 = x;
const y1 = y + height + 5; // Below the text with 5px gap
const x2 = x + width;
const y2 = y + height + 5;
const points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
const path = generateWobblyPath(points, wobble);
const pathLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
```

### Arrow Annotation Path
```tsx
// Line from (x1, y1) to (x2, y2) with arrowhead
// Body: straight wobbly line
const bodyPoints = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
const bodyPath = generateWobblyPath(bodyPoints, wobble);
// Arrowhead: could use a second path for the arrow tip
// Or construct a single path with arrowhead geometry
```

### Box Annotation Path
```tsx
// Four corners: top-left, top-right, bottom-right, bottom-left
const points = [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];
const path = generateWobblyPath([...points, points[0]], wobble); // close the path
const pathLength = 2 * (width + height);
```

### Highlight Annotation (Rectangle Fill)
```tsx
// Unlike box (stroke), highlight is a filled rectangle with opacity
// Uses fill, not stroke
const opacity = interpolate(progress, [0, 1], [0, 0.3], { extrapolateRight: "clamp" });
// This is different from stroke-dashoffset draw-on - it's a fade-in fill
```

### Number Annotation
```tsx
// Circle with number inside
// Render a Circle component with n rendered as text inside
// Or just a text element with a circle behind it
// The Circle.tsx already exists - reuse it with a number overlay
```

---

## State of the Art

| Aspect | Current State |
|--------|---------------|
| Annotation types | Circle exists, 5 more needed |
| Path generation | `generateWobblyPath()` exists and is reusable |
| Animation | Circle uses stroke-dashoffset draw-on, proven pattern |
| Spring config | damping: 100, stiffness: 300 documented in Circle.tsx |
| Clamping | Circle uses `extrapolateRight: "clamp"` |
| Color mapping | `getAnnotationColor()` + `ANNOTATION_COLORS` exist |
| Integration point | Scene.tsx needs `annotations` prop |

**Deprecated/outdated:**
- None relevant to this phase.

---

## Open Questions

1. **SceneScript schema gap:** `SceneScript` (packages/renderer/src/types.ts) lacks an `annotations` field, but VisualScene (src/types/visual.ts) has one. Should `SceneScript` be extended, or should annotations be passed as a separate prop?
   - What we know: VisualPlan contains scenes with annotations array; Scene.tsx renders SceneScript objects
   - What's unclear: Whether SceneScript needs to be extended or annotations flow separately
   - Recommendation: Pass annotations as a separate optional prop to Scene component (cleaner separation)

2. **Region positioning:** AnnotationSchema has `target.region` enum (top-left, top-right, etc.) and `target.textMatch`/`target.lineNumber`. D-07/D-08 say use region/coordinates with x, y, radius/width/height. How should target.region enum map to pixel coordinates?
   - What we know: D-07/D-08 specify absolute pixel positioning
   - What's unclear: Whether target.region enum values need resolution to pixels, or if region targeting is deferred
   - Recommendation: D-09 defers text-matching targeting; implement region enum as no-ops (return 0,0) for Phase 1

3. **Highlight animation:** Circle/Underline/Arrow/Box use stroke-dashoffset draw-on. Highlight might be better as a filled rectangle that fades in (opacity animation). Should highlight use stroke-dashoffset or opacity fade-in?
   - What we know: D-02 says "same draw animation for all types"
   - What's unclear: Whether fill-based highlight should still use stroke-dashoffset (which would be a filled rect drawn with a perimeter)
   - Recommendation: Stick with stroke-dashoffset for consistency per D-02, even if it means drawing the highlight perimeter rather than fading in the fill

---

## Sources

### Primary (HIGH confidence)
- `packages/renderer/src/remotion/annotations/Circle.tsx` - Reference implementation, verified working
- `packages/renderer/src/remotion/annotations/index.ts` - generateWobblyPath, getAnnotationColor, ANNOTATION_COLORS
- `src/types/visual.ts` - AnnotationSchema, AnnotationTypeEnum, AnnotationColorEnum, VisualSceneSchema
- `packages/renderer/src/types.ts` - SceneScript schema (needs extension)
- `packages/renderer/src/remotion/Scene.tsx` - Current scene rendering (needs annotation support)
- `node_modules/remotion/dist/cjs/spring/index.d.ts` - Verified spring() signature: returns number, not object

### Secondary (MEDIUM confidence)
- `.agents/skills/remotion/rules/timing.md` - Spring config documentation
- `.agents/skills/remotion/rules/animations.md` - Animation patterns, extrapolateRight: "clamp" requirement

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - remotion, react, existing utilities confirmed
- Architecture: HIGH - Circle.tsx provides complete reference pattern
- Pitfalls: MEDIUM - Potential issues identified from Circle.tsx analysis

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable domain, Remotion API rarely changes)
