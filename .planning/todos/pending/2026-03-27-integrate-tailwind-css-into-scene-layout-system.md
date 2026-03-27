---
created: 2026-03-27T09:00:25.487Z
title: Integrate Tailwind CSS into Scene Layout System
area: general
files:
  - packages/renderer/src/utils/remotion-renderer.ts
  - packages/renderer/remotion.config.ts
  - packages/renderer/package.json
---

## Problem

Phase 15 requirement: Tailwind CSS should be integrated into the Remotion scene layout system so layout components can use utility classes.

Currently: `@remotion/tailwind-v4`, `tailwindcss`, `@tailwindcss/node`, `@tailwindcss/oxide` are installed as dependencies in `packages/renderer/package.json`, but:

1. `remotion-renderer.ts` webpack bundler config has no `enableTailwind()` call
2. No layout/component `.tsx` files use `className` with Tailwind utilities
3. `remotion.config.ts` is empty (just a comment saying it's for Studio only)
4. No `tailwind.config.*` or CSS entry file with `@tailwind` directives exists

The dependency is dead code — installed but not wired up.

## Solution

1. Add `enableTailwind()` from `@remotion/tailwind-v4` to the webpack override in `packages/renderer/src/utils/remotion-renderer.ts`
2. Create a CSS entry file (e.g. `packages/renderer/src/remotion/styles/global.css`) with `@import "tailwindcss"`
3. Import the CSS file in the Remotion entry point (`packages/renderer/src/remotion/index.tsx` or generated `src/index.ts`)
4. Update `remotion.config.ts` to also call `enableTailwind()` for Studio preview
5. Migrate at least one layout component (e.g. `FeatureSlide.tsx`) to use Tailwind utilities to validate the integration
6. Add a test verifying the bundler config includes the Tailwind plugin
