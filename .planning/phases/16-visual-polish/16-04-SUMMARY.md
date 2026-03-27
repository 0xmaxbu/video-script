---
phase: "16"
plan: "04"
subsystem: renderer
tags: [typography, remotion, fittext, layout-utils, text-overflow]
dependency_graph:
  requires: [16-01, packages/renderer]
  provides: [VIS-14, text-overflow-prevention]
  affects: [BulletList, HeroFullscreen, TextLayer]
tech_stack:
  added: ["@remotion/layout-utils"]
  patterns: [fitText, Math.max/min clamping, floor/cap font scaling]
key_files:
  created:
    - packages/renderer/src/remotion/components/__tests__/fitText.test.ts
  modified:
    - packages/renderer/package.json
    - packages/renderer/src/remotion/components/TextLayer.tsx
    - packages/renderer/src/remotion/layouts/BulletList.tsx
    - packages/renderer/src/remotion/layouts/HeroFullscreen.tsx
decisions:
  - fitText is browser-only (calls measureText/DOM); tests verify math patterns not live calls
  - Use titleElement.content (not .text) per sceneAdapter TextElement type
  - BulletList floor=24px cap=60px; HeroFullscreen floor=36px cap=80px; TextLayer floor=12px
  - heroTitleWidth computed from GRID_CONSTANTS (1680px = 1920 - 120*2 safeZone)
metrics:
  duration: "~25 min"
  completed: "2026-03-27"
  tasks_completed: 3
  files_changed: 5
---

# Phase 16 Plan 04: fitText Integration Summary

**One-liner:** Integrated `@remotion/layout-utils fitText` into TextLayer, BulletList, and HeroFullscreen to prevent title text overflow using Math.max/min clamping with per-component floors and caps.

## What Was Built

Installed `@remotion/layout-utils` and wired `fitText()` into three Remotion components so title text dynamically scales down to fit its container width — with a minimum floor to remain readable and a maximum cap to preserve visual hierarchy.

| Component      | Width basis                                  | Floor | Cap                               |
| -------------- | -------------------------------------------- | ----- | --------------------------------- |
| TextLayer      | `position.width` (numeric)                   | 12px  | —                                 |
| BulletList     | `getGridSpanPx(12)` (usable grid width)      | 24px  | 60px (`TYPOGRAPHY.title.section`) |
| HeroFullscreen | `GRID_CONSTANTS.width - safeZone*2` = 1680px | 36px  | 80px (`TYPOGRAPHY.title.hero`)    |

When `position.width` is non-numeric (e.g. `"auto"`, `"full"`), TextLayer falls back to `TYPOGRAPHY.body.primary` (24px). When `titleElement` has no content, components fall back to their respective `TYPOGRAPHY` defaults.

## Tasks Completed

| Task | Description                                                           | Commit    |
| ---- | --------------------------------------------------------------------- | --------- |
| 1    | Install `@remotion/layout-utils` + create `fitText.test.ts` (6 tests) | `4210529` |
| 2    | Integrate fitText into `TextLayer.tsx`                                | `b38b8e5` |
| 3    | Apply fitText to `BulletList.tsx` and `HeroFullscreen.tsx`            | `23c11ea` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan spec referenced `.text` instead of `.content` on TextElement**

- **Found during:** Task 3
- **Issue:** Plan's pseudocode used `titleElement.text` but `TextElement` type from `sceneAdapter.ts` uses `.content`
- **Fix:** Used `titleElement.content` in both BulletList and HeroFullscreen
- **Files modified:** BulletList.tsx, HeroFullscreen.tsx
- **Commit:** `23c11ea`

**2. [Rule 2 - Missing] GRID_CONSTANTS not originally imported in HeroFullscreen**

- **Found during:** Task 3
- **Issue:** HeroFullscreen only imported `TYPOGRAPHY` from grid-utils; needed `GRID_CONSTANTS` to compute `heroTitleWidth`
- **Fix:** Added `GRID_CONSTANTS` to the import
- **Files modified:** HeroFullscreen.tsx
- **Commit:** `23c11ea`

**3. [Rule 3 - Blocking] fitText is browser-only (DOM dependency)**

- **Found during:** Task 1
- **Issue:** `fitText()` calls `measureText()` which requires a real browser DOM — cannot be called in Node.js/jsdom test environment
- **Fix:** Tests verify: (a) module importability, (b) the Math.max/Math.min floor/cap patterns used in components — not live fitText calls
- **Files modified:** `fitText.test.ts` (adapted test strategy)
- **Commit:** `4210529`

## Known Stubs

None — all three components have real fitText calls wired to actual content fields.

## Pre-existing Issues (Out of Scope)

- `sceneAdapter.ts` not under Remotion `rootDir` — pre-existing tsconfig conflict, affects all layout files, not caused by this plan.

## Self-Check: PASSED

| Item                      | Status |
| ------------------------- | ------ |
| `fitText.test.ts`         | FOUND  |
| `TextLayer.tsx`           | FOUND  |
| `BulletList.tsx`          | FOUND  |
| `HeroFullscreen.tsx`      | FOUND  |
| `16-04-SUMMARY.md`        | FOUND  |
| Commit `4210529` (Task 1) | FOUND  |
| Commit `b38b8e5` (Task 2) | FOUND  |
| Commit `23c11ea` (Task 3) | FOUND  |
