---
phase: 16-visual-polish
plan: "05"
subsystem: renderer
tags: [remotion, bundler, renderer, node-api, video-rendering]
dependency_graph:
  requires: []
  provides: [per-video-remotion-project, node-renderer-pipeline]
  affects: [video-renderer, cli]
tech_stack:
  added: ["@remotion/bundler@4.0.436", "@remotion/renderer@4.0.436"]
  patterns: [project-generator, node-renderer, webpack-override]
key_files:
  created:
    - packages/renderer/src/utils/project-generator.ts
    - packages/renderer/src/utils/__tests__/project-generator.test.ts
    - packages/renderer/src/utils/remotion-renderer.ts
    - packages/renderer/src/utils/__tests__/remotion-renderer.test.ts
  modified:
    - packages/renderer/package.json
    - packages/renderer/src/video-renderer.ts
    - packages/renderer/src/cli.ts
decisions:
  - "Use ../types.js import instead of @video-script/types — renderer package has its own ScriptOutput type and does not depend on @video-script/types"
  - "Use fileURLToPath(import.meta.url) ESM pattern for __dirname — project uses ES modules throughout"
  - "Update RenderVideoInput/Output interfaces to match plan spec — screenshotResources→images, resolution string→object, add framesRendered"
  - "Fix cli.ts to remove screenshotResources/videoFileName — these no longer exist in updated interface"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-03-27"
  tasks_completed: 4
  files_changed: 7
---

# Phase 16 Plan 05: Node Renderer Pipeline Summary

**One-liner:** Replaced esbuild+Puppeteer frame capture hack with official `@remotion/bundler` + `@remotion/renderer` Node.js API pipeline, generating a permanent per-video Remotion project with `file:` protocol linking.

## What Was Built

### Task 1: Install @remotion/bundler + @remotion/renderer

Installed both packages at `4.0.436` (matching existing `remotion` version) into `packages/renderer`.

### Task 2: project-generator.ts

New `packages/renderer/src/utils/project-generator.ts` that:

- Generates a permanent Remotion project **directly at** `outputDir` (no `.remotion-project` subdir)
- `package.json` uses `file:` protocol: `"@video-script/renderer": "file:<rendererDir>"`
- Generates `src/index.ts` (registerRoot) and `src/Root.tsx` (VideoComposition + embedded defaultProps)
- Runs `npm install --legacy-peer-deps` to resolve file: symlinks
- ESM-compatible using `fileURLToPath(import.meta.url)` for `__dirname`
- **8 unit tests** passing

### Task 3: remotion-renderer.ts

New `packages/renderer/src/utils/remotion-renderer.ts` that:

- Orchestrates: `generateProject()` → `bundle()` → `selectComposition()` → `renderMedia()`
- Webpack override (`removeStudioAlias`) fixes `@remotion/studio` subpath import bug
- Progress forwarded in two phases: 0–30% bundling, 30–100% rendering
- Returns `NodeRenderOutput` with `resolution: { width, height }` and `framesRendered`
- **7 unit tests** passing

### Task 4: Update video-renderer.ts

- Replaced `renderVideoWithPuppeteer` import with `renderWithNodeRenderer`
- Updated `RenderVideoInput`: `screenshotResources` → `images`, added `framesRendered`
- Updated `RenderVideoOutput`: `resolution: string` → `resolution: { width: number; height: number }`, added `framesRendered`
- Also fixed `cli.ts` which was broken by the interface change (removed `screenshotResources`/`videoFileName`)

## Verification Results

```
✅ @remotion/bundler@^4.0.436 in packages/renderer/package.json
✅ @remotion/renderer@^4.0.436 in packages/renderer/package.json
✅ project-generator.ts exports generateProject
✅ remotion-renderer.ts exports renderWithNodeRenderer
✅ video-renderer.ts uses renderWithNodeRenderer (no renderVideoWithPuppeteer)
✅ All 29 utils tests passing (3 test files)
✅ TypeScript clean for all modified files
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Import @video-script/types → use ../types.js**

- **Found during:** Task 2 implementation
- **Issue:** Plan specifies `import type { ScriptOutput } from "@video-script/types"` but `packages/renderer` does not depend on `@video-script/types` — it has its own `ScriptOutput` in `src/types.ts`
- **Fix:** Changed import to `from "../types.js"` — same type, correct module
- **Files modified:** packages/renderer/src/utils/project-generator.ts

**2. [Rule 1 - Bug] \_\_dirname ESM pattern**

- **Found during:** Task 2 implementation
- **Issue:** Plan uses bare `__dirname` but project uses ES modules (no CommonJS `__dirname`)
- **Fix:** Added `fileURLToPath(import.meta.url)` ESM pattern (same as existing `remotion-project-generator.ts`)
- **Files modified:** packages/renderer/src/utils/project-generator.ts

**3. [Rule 1 - Bug] exactOptionalPropertyTypes conflict in video-renderer.ts**

- **Found during:** Task 4
- **Issue:** Passing `images: input.images` (which could be `undefined`) to `NodeRenderInput.images?` fails strict TypeScript with `exactOptionalPropertyTypes`
- **Fix:** Use spread pattern: `...(input.images !== undefined && { images: input.images })`
- **Files modified:** packages/renderer/src/video-renderer.ts

**4. [Rule 1 - Bug] cli.ts broken by interface change**

- **Found during:** Task 4 TypeScript check
- **Issue:** `cli.ts` still referenced `screenshotResources` and `videoFileName` from the old `RenderVideoInput` which no longer exist
- **Fix:** Updated cli.ts to use new interface (removed `screenshotResources`/`videoFileName`, use `images`)
- **Files modified:** packages/renderer/src/cli.ts

## Commits

| Hash    | Message                                                                               |
| ------- | ------------------------------------------------------------------------------------- |
| cf276d9 | chore(16-05): install @remotion/bundler@4.0.436 and @remotion/renderer@4.0.436        |
| f81e34b | feat(16-05): create project-generator.ts for permanent per-video Remotion projects    |
| 68739d5 | feat(16-05): create remotion-renderer.ts using @remotion/bundler + @remotion/renderer |
| a4418b2 | feat(16-05): update video-renderer.ts to use renderWithNodeRenderer                   |

## Known Stubs

None — all implemented functionality is wired end-to-end.

## Self-Check: PASSED
