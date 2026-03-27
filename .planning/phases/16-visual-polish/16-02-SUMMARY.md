---
phase: 16-visual-polish
plan: "02"
subsystem: renderer
tags: [visual-layer, callout, remotion, component]
dependency_graph:
  requires: [16-01]
  provides: [callout-layer-component, callout-schema]
  affects: [VisualLayerRenderer, types]
tech_stack:
  added: []
  patterns: [TDD, zod-schema, css-triangle-arrow, remotion-animation]
key_files:
  created:
    - packages/renderer/src/remotion/components/CalloutLayer.tsx
    - packages/renderer/src/remotion/components/__tests__/CalloutLayer.test.tsx
    - packages/renderer/src/types.ts (CalloutContentSchema + callout type)
  modified:
    - packages/renderer/src/remotion/components/VisualLayerRenderer.tsx
key_decisions:
  - "Followed TextLayer animation pattern exactly for consistency (useEnterAnimation + useExitAnimation with exit.opacity !== undefined guard)"
  - "Used CSS border trick for directional arrow triangles (no extra dependencies)"
  - "Arrow display gated on style==='arrow-label' || style==='box' to preserve highlight style without arrows"
metrics:
  duration: "~10 minutes"
  completed: "2026-03-27"
  tasks_completed: 3
  files_changed: 4
---

# Phase 16 Plan 02: CalloutLayer Component Summary

**One-liner:** Yellow highlight callout VisualLayer with CSS triangle arrows and zod schema using Remotion animation hooks.

## What Was Built

Added `"callout"` as a new VisualLayer type that the Script Agent can generate. The callout renders as a yellow rounded rectangle with optional directional arrow, supporting three style variants:

- **highlight**: Semi-transparent yellow background (`rgba(255,215,0,0.3)`) + yellow border
- **box**: Solid dark card background (`#1a1a1a`) + yellow border
- **arrow-label**: Box style + directional CSS triangle arrow in any of 4 directions

## Tasks Completed

| Task | Name                                          | Commit    | Files                                                                                             |
| ---- | --------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| 1    | Extend VisualLayer schema with 'callout' type | `559f366` | `packages/renderer/src/types.ts`, `packages/renderer/src/__tests__/callout-schema.test.ts`        |
| 2    | Create CalloutLayer component + test          | `b469a08` | `packages/renderer/src/remotion/components/CalloutLayer.tsx`, `…/__tests__/CalloutLayer.test.tsx` |
| 3    | Wire CalloutLayer into VisualLayerRenderer    | `58e0935` | `packages/renderer/src/remotion/components/VisualLayerRenderer.tsx`                               |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect test assertion for invalid JSON**

- **Found during:** Task 2 (GREEN phase)
- **Issue:** The plan's test had `expect(() => JSON.parse("not json")).not.toThrow()` — but `JSON.parse("not json")` always throws a SyntaxError, making this assertion incorrect
- **Fix:** Changed to `expect(() => JSON.parse(layer.content)).toThrow()` which correctly documents that invalid JSON throws
- **Files modified:** `packages/renderer/src/remotion/components/__tests__/CalloutLayer.test.tsx`
- **Commit:** `b469a08`

**2. [Rule 1 - Bug] Removed duplicate `position: "absolute"` in containerStyle**

- **Found during:** Task 2 (component creation)
- **Issue:** Plan's component code had `position: "absolute"` declared twice in the same object literal (once early, once late — the second would silently override the first)
- **Fix:** Kept only the first declaration, added `transform` and `transformOrigin` following the TextLayer pattern
- **Files modified:** `packages/renderer/src/remotion/components/CalloutLayer.tsx`
- **Commit:** `b469a08`

## Tests

All 7 tests pass:

- `callout-schema.test.ts`: 4 tests (highlight, arrow-label, invalid style rejection, callout type acceptance)
- `CalloutLayer.test.tsx`: 3 tests (component is function, handles invalid JSON, named export)

## Known Stubs

None — all functionality is wired end-to-end.

## Self-Check: PASSED
