---
phase: 02-layout-system
plan: 04
subsystem: renderer-layouts
tags:
  - remotion
  - layout-system
  - frosted-glass
  - grid
dependency_graph:
  requires:
    - 02-01 (Grid, FrostedCard, grid-utils)
  provides:
    - VIS-05 (code-focus layout refactored)
    - VIS-05 (comparison layout refactored)
tech_stack:
  added:
    - Grid wrapper import
    - FrostedCard container for code area and A/B panels
    - TYPOGRAPHY constants for 60pt/36pt/24pt/20pt/16pt sizing
  patterns:
    - Grid as outer wrapper providing safe-zone padding (80px top/bottom, 120px left/right)
    - FrostedCard as code area container (low opacity 0.05, 20px blur)
    - FrostedCard for VS badge (60pt typography centered)
    - Spring animations for code scale and title slideUp
key_files:
  created: []
  modified:
    - packages/renderer/src/remotion/layouts/CodeFocus.tsx
    - packages/renderer/src/remotion/layouts/Comparison.tsx
decisions:
  - "CodeFocus: FrostedCard wraps code area with very low opacity (0.05) to maintain dark theme; code text at 16pt caption size"
  - "CodeFocus: Title at 60pt section heading, subtitle at 24pt body primary"
  - "Comparison: Both Before/After panels use FrostedCards with 0.1 opacity, 20px blur, 24px radius"
  - "Comparison: VS badge in FrostedCard with 0.3 opacity, 60pt typography for maximum visual impact"
  - "Both: Spring animations preserved from original implementations"
metrics:
  duration_minutes: 3
  completed_date: "2026-03-22T10:42:26Z"
---

# Phase 02 Plan 04: CodeFocus and Comparison Layout Refactor

**Refactored:** 2026-03-22

## One-Liner

CodeFocus and Comparison layouts refactored to use Grid wrapper and FrostedCard components.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Refactor CodeFocus to use Grid and FrostedCard | d878246 | packages/renderer/src/remotion/layouts/CodeFocus.tsx |
| 2 | Refactor Comparison to use Grid and FrostedCard | d878246 | packages/renderer/src/remotion/layouts/Comparison.tsx |

## What Was Built

### CodeFocus.tsx (103 lines)
- Wrapped content in `<Grid>` for 12-column layout system with safe zones
- Code area uses `<FrostedCard>` with very low opacity (0.05) and 20px blur to maintain dark theme
- Title: 60pt bold (TYPOGRAPHY.title.section) with slideUp spring animation
- Subtitle: 24pt (TYPOGRAPHY.body.primary) in semi-transparent white
- Code text: 16pt caption size (TYPOGRAPHY.body.caption) in Fira Code monospace
- Code area scales in with spring animation (0.95 to 1.0)

### Comparison.tsx (125 lines)
- Wrapped content in `<Grid>` for 12-column layout system with safe zones
- Before/After panels: Both use `<FrostedCard>` with 0.1 opacity, 20px blur, 24px radius
- Labels (Before/After): 20pt (TYPOGRAPHY.body.secondary) in semi-transparent white
- VS badge: Centered `<FrostedCard>` with 0.3 opacity, 60pt bold typography for maximum visual impact
- VS spring animation (scale from center, delayed 20 frames)
- Img elements preserved for screenshot rendering

## Deviations from Plan

**Rule 3 (Auto-fix blocking issues) - Pre-existing type errors not modified:**
- CodeFocus and Comparison have pre-existing implicit `any` type errors on `.find()` and `.filter()` callback parameters from original implementation
- These existed before the refactor and do not affect rendering
- TypeScript compilation errors from `node_modules` (@video-script/types, eslint-scope) are also pre-existing

None - plan executed as written. Minor pre-existing type errors documented but not modified (out of scope for this plan).

## Verification

- `npx tsc --noEmit` runs without new errors introduced by this plan
- CodeFocus: 103 lines (exceeds 70-line minimum per plan spec)
- Comparison: 125 lines (exceeds 80-line minimum per plan spec)
- Both files import Grid, FrostedCard, and TYPOGRAPHY from grid-utils
- Grid wrapper provides 80px top/bottom, 120px left/right safe zones
- Spring animations preserved for code scale, title slideUp, and VS badge

## Self-Check

- [x] CodeFocus.tsx exists at expected path
- [x] Comparison.tsx exists at expected path
- [x] Commit d878246 exists for both files
- [x] CodeFocus uses `<Grid>` wrapper
- [x] CodeFocus uses `<FrostedCard>` for code area
- [x] CodeFocus title uses TYPOGRAPHY.title.section (60pt)
- [x] CodeFocus code text uses TYPOGRAPHY.body.caption (16pt)
- [x] Comparison uses `<Grid>` wrapper
- [x] Comparison uses `<FrostedCard>` for both A/B panels
- [x] Comparison VS badge uses TYPOGRAPHY.title.section (60pt)
- [x] Spring animations preserved
- [x] TypeScript: no new errors introduced by this plan

## Self-Check: PASSED
