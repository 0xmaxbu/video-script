---
phase: 02-layout-system
plan: 03
subsystem: layout-templates
tags: [remotion, layout, grid, frosted-card]
dependency_graph:
  requires:
    - 02-01  # Grid and FrostedCard foundation
  provides:
    - VIS-05  # Layout templates
  affects:
    - packages/renderer/src/remotion/layouts
tech_stack:
  added:
    - Grid wrapper for consistent layout structure
    - FrostedCard component for frosted glass effect
  patterns:
    - 12-column grid positioning via getGridColumnPx/getGridSpanPx
    - TYPOGRAPHY constants for consistent font sizing
    - Spring animations preserved (damping: 100, stiffness: 200)
key_files:
  created: []
  modified:
    - packages/renderer/src/remotion/layouts/SplitHorizontal.tsx
    - packages/renderer/src/remotion/layouts/TextOverImage.tsx
decisions:
  - "SplitHorizontal uses 6-column FrostedCards for 50/50 left/right split (columns 1-6 and 7-12)"
  - "TextOverImage uses 8-column centered FrostedCard (columns 3-10) for text overlay"
  - "Both layouts use Grid wrapper for consistent padding via safeZone"
  - "Title typography uses TYPOGRAPHY.title.card (36pt) in SplitHorizontal"
  - "TextOverImage title uses TYPOGRAPHY.title.section (60pt), subtitle uses TYPOGRAPHY.body.primary (24pt)"
metrics:
  duration: "~3 minutes"
  completed: "2026-03-22T10:43:24Z"
---

# Phase 02 Plan 03: SplitHorizontal and TextOverImage Refactor

## One-Liner

Refactored SplitHorizontal and TextOverImage layouts to use Grid wrapper and FrostedCard components following the 12-column layout system.

## Truths

- SplitHorizontal uses Grid wrapper and FrostedCards for left/right split
- TextOverImage uses Grid wrapper with FrostedCard for text overlay

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Refactor SplitHorizontal to use Grid and FrostedCard | d878246 | packages/renderer/src/remotion/layouts/SplitHorizontal.tsx |
| 2 | Refactor TextOverImage to use Grid and FrostedCard | d878246 | packages/renderer/src/remotion/layouts/TextOverImage.tsx |

## What Was Built

### SplitHorizontal Layout
- **Structure**: 50/50 horizontal split using two FrostedCards
- **Left panel**: 6-column span (columns 1-6), displays primary screenshot
- **Right panel**: 6-column span (columns 7-12), displays secondary screenshot and title
- **Typography**: Title uses `TYPOGRAPHY.title.card` (36pt)
- **Animations**: Spring animations preserved (damping: 100, stiffness: 200) with slide-in from left/right
- **Positioning**: Absolute positioning within Grid using `getGridColumnPx()` and `getGridSpanPx()`

### TextOverImage Layout
- **Structure**: Background image with centered FrostedCard overlay
- **Background**: Full-screen image with 0.6 opacity and gradient overlay
- **Text overlay**: 8-column centered FrostedCard (columns 3-10)
- **Typography**: Title uses `TYPOGRAPHY.title.section` (60pt), subtitle uses `TYPOGRAPHY.body.primary` (24pt)
- **Animations**: Spring animations preserved with slide-up effect

## Verification

- TypeScript compilation: PASSED (`npm run typecheck`)
- Both files compile without errors
- Spring animations preserved with original config
- Grid positioning uses `getGridColumnPx()` and `getGridSpanPx()` helpers
- TYPOGRAPHY constants used for all text sizing

## Deviations from Plan

None - plan executed exactly as written.

## Artifacts

| Path | Provides | Min Lines |
| ---- | -------- | --------- |
| packages/renderer/src/remotion/layouts/SplitHorizontal.tsx | Horizontal split layout refactored to use Grid + FrostedCard | 70 |
| packages/renderer/src/remotion/layouts/TextOverImage.tsx | Text over image layout refactored to use Grid + FrostedCard | 70 |

## Key Links

| From | To | Via |
| ---- | --- | ----- |
| packages/renderer/src/remotion/layouts/SplitHorizontal.tsx | packages/renderer/src/remotion/layouts/Grid.tsx | imports Grid |
| packages/renderer/src/remotion/layouts/TextOverImage.tsx | packages/renderer/src/remotion/layouts/Grid.tsx | imports Grid |
| packages/renderer/src/remotion/layouts/SplitHorizontal.tsx | packages/renderer/src/remotion/layouts/FrostedCard.tsx | imports FrostedCard |
| packages/renderer/src/remotion/layouts/TextOverImage.tsx | packages/renderer/src/remotion/layouts/FrostedCard.tsx | imports FrostedCard |

## Requirements Satisfied

- VIS-05: Layout templates - SplitHorizontal and TextOverImage refactored to use grid system

---

## Self-Check: PASSED

- [x] SplitHorizontal.tsx exists and uses Grid wrapper and FrostedCards
- [x] TextOverImage.tsx exists and uses Grid wrapper with FrostedCard
- [x] Both files compile without TypeScript errors
- [x] Spring animations preserved
- [x] TYPOGRAPHY constants used correctly
- [x] Grid positioning via getGridColumnPx/getGridSpanPx
