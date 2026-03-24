---
phase: 14-animation-engine
plan: GAP-01
subsystem: renderer
tags: [animation, remotion, renderer, gap-closure]
dependency_graph:
  requires: []
  provides:
    - "video-renderer.ts uses packages/renderer/src/remotion/ directly"
    - "script/images passed via Remotion props system"
  affects: ["video-renderer", "cli"]
tech_stack:
  added: ["--props flag for Remotion", "base64 image embedding"]
  patterns: ["props-based data flow to Remotion"]
key_files:
  created:
    - "packages/renderer/src/remotion.config.ts"
  modified:
    - "packages/renderer/src/video-renderer.ts"
decisions:
  - "Use packages/renderer/src directly instead of generating separate project"
  - "Pass script/images via --props flag to Remotion's calculateMetadata/defaultProps system"
  - "Base64-encode screenshot resources for embedding in Remotion"
metrics:
  duration: "2m"
  completed: "2026-03-24T09:38:00Z"
---

# Phase 14 Plan GAP-01: Fix video-renderer to use packages/renderer directly

## Summary

Modified `video-renderer.ts` to use `packages/renderer/src/remotion/` directly instead of generating a separate simplified Remotion project.

## Problem

The original implementation called `generateRemotionProject()` which created a SEPARATE simplified project with its own Scene.tsx, Subtitle.tsx, Composition.tsx. These simplified components only had basic opacity fade animations and completely ignored the full animation system (Ken Burns, parallax, KineticSubtitle) in `packages/renderer/src/remotion/`.

## Solution

Modified `renderVideo()` to:
1. Run `npx remotion render` with `cwd` pointing to `packages/renderer/src`
2. Pass script and images via `--props` flag to Remotion's props system
3. Base64-encode screenshot resources for embedding

## Changes

### packages/renderer/src/video-renderer.ts
- **Removed**: `generateRemotionProject()` import and call
- **Added**: Direct `npx remotion render` invocation pointing to `packages/renderer/src/remotion/index.ts`
- **Added**: Props passing via `--props` JSON flag (script + base64-encoded images)
- **Added**: ESM-compatible `__dirname` via `import.meta.url`

### packages/renderer/src/remotion.config.ts (new)
- Added Remotion config with default dimensions (1920x1080)

## Verification

- TypeScript compilation passes: `npm run typecheck` in packages/renderer
- Commits created:
  - `03143ab`: fix(renderer): use packages/renderer/src/remotion directly with props
  - `5d4fc4e`: chore(renderer): add remotion.config.ts for dimension defaults

## Animation System Now Active

When rendering, the following animation components from `packages/renderer/src/remotion/` are now used:
- **ScreenshotLayer**: Ken Burns effect, parallax, enter/exit animations
- **KineticSubtitle**: Word-by-word highlighting with progress
- **VisualLayerRenderer**: Routes to correct layer type with animations
- **CodeAnimation**: Animated code reveal
- **TextLayer**: Animated text rendering

## Deviation from Plan

None - plan executed as written.
