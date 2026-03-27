---
phase: "16"
plan: "01"
subsystem: renderer
tags: [theme, dark-mode, layout, remotion, refactor]
dependency_graph:
  requires: []
  provides: [THEME constants, centralized dark mode colors]
  affects: [all layout components, FrostedCard]
tech_stack:
  added: [theme.ts, vitest test]
  patterns: [centralized theme constants, as const TypeScript pattern]
key_files:
  created:
    - packages/renderer/src/remotion/theme.ts
    - packages/renderer/src/remotion/__tests__/theme.test.ts
  modified:
    - packages/renderer/src/remotion/layouts/FrostedCard.tsx
    - packages/renderer/src/remotion/layouts/BulletList.tsx
    - packages/renderer/src/remotion/layouts/Quote.tsx
    - packages/renderer/src/remotion/layouts/HeroFullscreen.tsx
    - packages/renderer/src/remotion/layouts/SplitVertical.tsx
    - packages/renderer/src/remotion/layouts/SplitHorizontal.tsx
    - packages/renderer/src/remotion/layouts/Comparison.tsx
    - packages/renderer/src/remotion/layouts/TextOverImage.tsx
    - packages/renderer/src/remotion/layouts/CodeFocus.tsx
decisions:
  - "Used THEME.glass.bg as fixed default for FrostedCard, removing opacity/color props — callers that passed custom opacity now rely on the unified value"
  - "CodeFocus: replaced #1e1e1e with THEME.bg.primary (#0a0a0a) for consistent dark mode; #0d0d0d replaced with THEME.bg.card (#1a1a1a)"
  - "SplitVertical needs explicit AbsoluteFill dark bg since Grid doesn't provide one — added as first child"
metrics:
  duration: "~15 minutes"
  completed: "2026-03-27T02:12:18Z"
  tasks_completed: 3
  files_modified: 9
---

# Phase 16 Plan 01: Dark Mode Theme Constants + Layout Migration Summary

Centralized all dark mode color values into a single `theme.ts` module and migrated all 9 layout components to consume `THEME` constants instead of hardcoded hex/rgba strings.

## What Was Built

### `packages/renderer/src/remotion/theme.ts`

New centralized theme constants module:

```typescript
export const THEME = {
  bg: { primary: "#0a0a0a", secondary: "#111111", card: "#1a1a1a" },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255,255,255,0.7)",
    muted: "rgba(255,255,255,0.4)",
  },
  accent: {
    yellow: "#FFD700",
    yellowMuted: "rgba(255,215,0,0.3)",
    blue: "#3b82f6",
  },
  glass: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
} as const;
```

### `FrostedCard.tsx` (simplified interface)

Removed `color` and `opacity` props. Now uses `THEME.glass.bg` and `THEME.glass.border` directly, eliminating per-callsite color overrides.

New interface:

```typescript
interface FrostedCardProps {
  children: ReactNode;
  style?: React.CSSProperties;
  blur?: number; // default 25
  radius?: number; // default 32
  zIndex?: number; // default 10
}
```

### Layout Migrations (8 files)

All layouts now import `{ THEME } from '../theme.js'` and use:

- `THEME.bg.primary` for dark backgrounds (replaces `#0a0a0a`, `#1e1e1e`)
- `THEME.bg.card` for code panels (replaces `#0d0d0d`)
- `THEME.text.primary` for main text (replaces `"white"`, `"#ffffff"`)
- `THEME.text.secondary` for muted text (replaces `rgba(255,255,255,0.7)`, `rgba(255,255,255,0.8)`)
- `THEME.text.muted` for dimmed labels (replaces `rgba(255,255,255,0.6)`)
- `THEME.accent.blue` for accent dots (replaces `#3b82f6`)
- `THEME.glass.border` for frosted borders (replaces inline `rgba(255,255,255,0.1)`)

**Dark bg AbsoluteFill added to:** `SplitVertical`, `CodeFocus` (previously relied on Grid's implicit background; now explicit).

## Commits

| Hash      | Message                                                  |
| --------- | -------------------------------------------------------- |
| `0ef7aee` | test(16-01): add failing THEME constants test            |
| `7dd4804` | feat(16-01): create theme.ts with THEME constants        |
| `1e7e260` | feat(16-01): migrate FrostedCard to THEME.glass defaults |
| `9c11ae8` | feat(16-01): migrate all layouts to THEME constants      |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Comparison.tsx had `opacity` prop calls that became type errors**

- **Found during:** Task 3
- **Issue:** After removing `opacity` from FrostedCard's interface in Task 2, Comparison.tsx still called `<FrostedCard opacity={0.1}>` and `<FrostedCard opacity={0.3}>` — TypeScript errors
- **Fix:** Removed the `opacity` prop from all three FrostedCard usages in Comparison.tsx; they now use the unified `THEME.glass.bg` value
- **Files modified:** `Comparison.tsx`
- **Commit:** `9c11ae8`

**2. [Rule 2 - Missing] CodeFocus.tsx had `opacity={0.05}` call**

- **Found during:** Task 3
- **Issue:** Same as above — CodeFocus also passed `opacity={0.05}` to FrostedCard
- **Fix:** Removed the `opacity` prop; now uses `THEME.glass.bg` (`rgba(255,255,255,0.05)` — same value)
- **Files modified:** `CodeFocus.tsx`
- **Commit:** `9c11ae8`

## Known Stubs

None — all THEME constants are fully wired and consumed by layout components.

## Self-Check: PASSED

Files created/verified:

- ✅ `packages/renderer/src/remotion/theme.ts`
- ✅ `packages/renderer/src/remotion/__tests__/theme.test.ts`
- ✅ `packages/renderer/src/remotion/layouts/FrostedCard.tsx`
- ✅ All 8 layout files migrated

Tests: 4/4 passing (`vitest run`)

Commits verified:

- ✅ `0ef7aee` test(16-01): add failing THEME constants test
- ✅ `7dd4804` feat(16-01): create theme.ts with THEME constants
- ✅ `1e7e260` feat(16-01): migrate FrostedCard to THEME.glass defaults
- ✅ `9c11ae8` feat(16-01): migrate all layouts to THEME constants
