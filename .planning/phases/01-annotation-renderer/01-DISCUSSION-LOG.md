# Phase 1: Annotation Renderer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 01-annotation-renderer
**Areas discussed:** Annotation style, Positioning/targeting, Layer integration

---

## Annotation Style

| Option | Description | Selected |
|--------|-------------|----------|
| Consistent hand-drawn | All annotations use wobbly paths and draw-on animation — cohesive quirky feel | ✓ |
| Clean geometric | All annotations use clean shapes — more professional/minimal | |
| Per-type choice | Hand-drawn for circles/arrows, clean for boxes/highlights | |

**User's choice:** Consistent hand-drawn
**Notes:** All annotations should use hand-drawn wobbly style like the existing Circle component

---

## Animation Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Same draw animation | All annotations draw on using stroke-dashoffset — underline, box, circle all animate the same way | ✓ |
| Type-specific animation | Circles/arrows draw on, boxes/highlights fade in, numbers pop | |

**User's choice:** Same draw animation
**Notes:** All annotation types use the same stroke-dashoffset draw-on effect

---

## Positioning/Targeting

| Option | Description | Selected |
|--------|-------------|----------|
| Code line numbers | Annotations attach to specific code line numbers — precise, works well for code focus scenes | |
| Region/coordinates | Annotations use pixel coordinates with region anchoring — flexible for any layout | ✓ |
| Text matching | Annotations find and highlight matching text — works for any content | |

**User's choice:** Region/coordinates
**Notes:** Annotations use absolute pixel coordinates

---

## Coordinate System

| Option | Description | Selected |
|--------|-------------|----------|
| Absolute pixels | Fixed pixel coordinates — simpler, but requires knowing exact layout dimensions | ✓ |
| Relative percentages | 0-1 range positions — works at any resolution, more flexible | |

**User's choice:** Absolute pixels
**Notes:** Fixed pixel coordinates for annotation positioning

---

## Layer Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Global annotation layer | All annotations render in a single overlay layer above everything — simpler z-index management | |
| Per-scene layers | Annotations attached to individual scenes — more granular control, more complex | ✓ |
| Per-layer overlays | Annotations attached to specific layers (screenshot/code) — tight coupling | |

**User's choice:** Per-scene layers
**Notes:** Each scene manages its own annotation layer

---

## Z-Ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Timestamp order | Earlier-appearing annotations draw below later ones — simple, predictable | ✓ |
| Fixed z-index per type | Numbers above highlights above arrows etc. — consistent visual hierarchy | |
| Configurable per annotation | Each annotation has explicit z-index — maximum flexibility | |

**User's choice:** Timestamp order
**Notes:** Z-order determined by when annotations appear (appearAt)

---

## Lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Stay visible | Annotations persist until scene ends — simple, high information density | ✓ |
| Fade out | Annotations fade after draw completes — cleaner visual, less clutter | |
| Undraw animation | Annotations reverse-draw when next annotation appears — theatrical | |

**User's choice:** Stay visible
**Notes:** Annotations remain visible after drawing on — no fade out

---

## Data Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Annotations in scene data | Scene receives annotations array prop — renderer reads from scene data directly | ✓ |
| Separate annotation layer | Visual plan emits annotation layer in visualLayers array — unified layer pipeline | |
| AnnotationRenderer component | Annotations passed to AnnotationRenderer component with appearAt timing | |

**User's choice:** Annotations in scene data
**Notes:** Scene receives annotations array directly as a prop

---

## Deferred Ideas

- crossout and checkmark annotation types — Phase 2+
- Text-matching annotation targeting — future enhancement
- Per-annotation-type animation variation — all use same draw animation
- Annotation undraw/fade-out lifecycle — annotations persist until scene ends
