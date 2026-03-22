# Phase 1: Annotation Renderer - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

SVG-based animated annotation overlays rendered on screenshots and code blocks. The AnnotationRenderer component handles: circle, underline, arrow, box, highlight, number annotation types — all with spring-animated draw-on effects. This is purely visual; annotation data comes from the visual plan's scene data.

</domain>

<decisions>
## Implementation Decisions

### Annotation Style
- **D-01:** All annotation types use hand-drawn wobbly style with `generateWobblyPath()`
- **D-02:** All annotation types use the same stroke-dashoffset draw-on animation (not type-specific)
- **D-03:** Wobbly path generation is consistent across all annotation types

### Animation Behavior
- **D-04:** Annotations stay visible after appearing — no fade out or undraw
- **D-05:** Spring animation config: damping: 100, stiffness: 300 (existing Circle config)
- **D-06:** All `interpolate()` calls use `extrapolateRight: "clamp"` to prevent extrapolation artifacts

### Positioning/Targeting
- **D-07:** Region/coordinates positioning — absolute pixels (not percentages)
- **D-08:** Annotations position via `x`, `y`, `radius`/`width`/`height` props (pixel-based)
- **D-09:** Target types (text, code-line) are defined in schema but not the primary positioning mode for this phase

### Layer Integration
- **D-10:** Annotations use per-scene layering — each scene has its own annotation array
- **D-11:** Scene receives `annotations: Annotation[]` prop directly (not via visualLayers)
- **D-12:** AnnotationRenderer orchestrates all annotation types within a scene

### Z-Ordering
- **D-13:** Z-order determined by timestamp — earlier-appearing annotations render below later ones
- **D-14:** No fixed z-index per annotation type — purely temporal ordering

### Data Flow
- **D-15:** Annotations flow from visual plan → Scene component prop → AnnotationRenderer
- **D-16:** Scene component updated to pass `annotations` prop to AnnotationRenderer

### Annotation Types to Implement
- **D-17:** Required: circle, underline, arrow, box, highlight, number
- **D-18:** Nice-to-have (deferred): crossout, checkmark

### Reuse
- **D-19:** `generateWobblyPath()` from `annotations/index.ts` reused for all annotation types
- **D-20:** `getAnnotationColor()` from `annotations/index.ts` reused
- **D-21:** Spring + interpolate from Remotion for all animations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Annotation types and colors
- `src/types/visual.ts` — AnnotationTypeEnum, AnnotationColorEnum, AnnotationSchema, ANNOTATION_COLORS

### Existing annotation implementation
- `packages/renderer/src/remotion/annotations/index.ts` — Circle component, generateWobblyPath, getAnnotationColor, ANNOTATION_COLORS
- `packages/renderer/src/remotion/annotations/Circle.tsx` — Reference implementation (hand-drawn circle with stroke-dashoffset)
- `packages/renderer/src/remotion/components/VisualLayerRenderer.tsx` — Layer rendering pattern to follow for annotation layer

### Scene rendering
- `packages/renderer/src/remotion/Scene.tsx` — Scene component that will receive annotations prop

### Visual plan
- `src/types/visual.ts` §NarrationBindingSchema — narrationBinding used for appearAt timing

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `generateWobblyPath(points, wobble)` — Already handles hand-drawn path generation with configurable wobble
- `getAnnotationColor(color)` — Already maps AnnotationColor enum to hex values
- `ANNOTATION_COLORS` constant — Already defined in both `types/visual.ts` and `annotations/index.ts`
- Spring + interpolate from Remotion — Already used in Circle.tsx, reusable pattern

### Established Patterns
- Hand-drawn SVG with stroke-dashoffset for draw-on animation (Circle.tsx)
- Scene component receives `scene: SceneType` prop and `imagePaths` record
- Visual layers positioned via `getPositionStyle()` helper

### Integration Points
- Scene.tsx needs to add `annotations` prop and render AnnotationRenderer
- VisualLayerRenderer.tsx doesn't need modification (annotations bypass visualLayers)
- New `AnnotationRenderer.tsx` component needed in `packages/renderer/src/remotion/annotations/`

</code_context>

<specifics>
## Specific Ideas

- "Consistent hand-drawn style across all annotations — like Circle"
- "Same draw animation for all types — stroke-dashoffset draw-on effect"
- "Annotations stay visible once they appear — no fade out"
- "Per-scene layers — each scene manages its own annotations"
- "Scene receives annotations array directly from visual plan"

</specifics>

<deferred>
## Deferred Ideas

- crossout and checkmark annotation types — not in scope for v1.1 Phase 1
- Text-matching annotation targeting — region/coordinates only for now
- Per-annotation-type animation variation — all use same draw animation
- Annotation undraw/fade-out lifecycle — annotations persist until scene ends

</deferred>

---

*Phase: 01-annotation-renderer*
*Context gathered: 2026-03-22*
