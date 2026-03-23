# Phase 12: Fix Layout Rendering - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 12-fix-layout-rendering
**Areas discussed:** Z-index stacking, Split content, Vertical centering, Position mapping

---

## Z-index Stacking

| Option                             | Description                                                                   | Selected |
| ---------------------------------- | ----------------------------------------------------------------------------- | -------- |
| FrostedCard z-index: -1            | Glass behind everything. Simple, works with existing text zIndex:10           |          |
| Text z-index: 20, Card z-index: 10 | Explicit layering. More explicit but requires changes to text layer z-indices | ✓        |

**User's choice:** Text z-index: 20, Card z-index: 10
**Notes:** Explicit layering preferred over magic negative z-index

---

## Split Content

| Option                    | Description                                                                                  | Selected |
| ------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| VisualLayers text content | Bottom shows text from visualLayers type='text', not just title. Title shows in top section. | ✓        |
| Narration text            | Bottom shows narration text extracted from scene.narration                                   |          |

**User's choice:** VisualLayers text content
**Notes:** Text content should come from visualLayers, not just scene title

---

## Vertical Centering

| Option                         | Description                                                                             | Selected |
| ------------------------------ | --------------------------------------------------------------------------------------- | -------- |
| Flexbox center                 | Use flexbox with alignItems:center and justifyContent:center inside each layout section | ✓        |
| Absolute center with transform | Use position:absolute + top:50%, transform:translateY(-50%)                             |          |

**User's choice:** Flexbox center
**Notes:** Flexbox is cleaner and more maintainable

---

## Position Mapping

| Option                                                   | Description                                                                                             | Selected |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| position.x → horizontal zone, position.y → which section | x:left/right/center maps to layout zone. y:top/bottom determines top-section vs bottom-section content. | ✓        |
| position maps to CSS left/top values directly            | Use numeric x/y values as exact CSS left/top pixel positions                                            |          |

**User's choice:** position.x → horizontal zone, position.y → which section
**Notes:** Semantic mapping preferred over raw pixel values

---

## Deferred Ideas

None — discussion stayed within phase scope

---

_Phase: 12-fix-layout-rendering_
_Discussion completed: 2026-03-23_
