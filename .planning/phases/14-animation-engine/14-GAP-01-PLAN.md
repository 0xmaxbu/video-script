---
phase: 14-animation-engine
plan: GAP-01
type: gap_closure
wave: 1
depends_on: []
gap_closure: true
autonomous: true

must_haves:
  truths:
    - "video-renderer.ts uses packages/renderer/src/remotion/ directly instead of generating a simplified project"
    - "Script and images data passed via Remotion props system (defaultProps/calculateMetadata)"
    - "Animation components (Ken Burns, parallax, KineticSubtitle) actually render in output video"
  artifacts:
    - path: "packages/renderer/src/video-renderer.ts"
      provides: "Modified to use packages/renderer Remotion project directly with props-based data flow"
      min_lines: 150
    - path: "packages/renderer/src/cli.ts"
      provides: "Updated to pass correct props to Remotion rendering"
  key_links:
    - from: "video-renderer.ts"
      to: "packages/renderer/src/remotion/index.ts"
      via: "spawn npx remotion render with cwd pointing to packages/renderer"
      pattern: "remotion.*render.*packages/renderer"
    - from: "video-renderer.ts"
      to: "RenderVideoInput"
      via: "props passed via calculateMetadata/defaultProps"
      pattern: "calculateMetadata|defaultProps"
---
# Gap Closure: Fix video-renderer to use packages/renderer directly

## Problem
`video-renderer.ts` calls `generateRemotionProject()` which creates a SEPARATE simplified Remotion project with its own Scene.tsx, Subtitle.tsx, Composition.tsx. These simplified components DON'T use the animation implementations (Ken Burns, parallax, KineticSubtitle, animation-utils.ts) in `packages/renderer/src/remotion/`.

## Root Cause
- `remotion-project-generator.ts` generates complete inline code for Scene.tsx, Subtitle.tsx, Composition.tsx
- The generated code has basic opacity fade only
- Phase 14 animation work in `packages/renderer/src/remotion/` is completely ignored

## Required Fix

### Task 1: Analyze current video-renderer flow
- Read `packages/renderer/src/video-renderer.ts` — understand current render flow
- Read `packages/renderer/src/cli.ts` — understand CLI entry point
- Read `packages/renderer/src/remotion/index.ts` — understand Remotion entry point
- Verify how props (script, images) currently flow through the system

### Task 2: Modify video-renderer.ts
- Keep `generateRemotionProject()` for output directory setup
- Instead of using generated project's Scene.tsx/Subtitle.tsx
- Run `npx remotion render` with entry point pointing to `packages/renderer/src/remotion/index.ts`
- Pass script/images via Remotion props system

### Task 3: Verify props flow
- Ensure `VideoComposition` in `packages/renderer/src/remotion/Composition.tsx` receives script/images props
- Verify `Scene.tsx` receives scene data and renders with animations

### Task 4: Test render output
- Run a test render
- Verify Ken Burns effect is visible on screenshots
- Verify KineticSubtitle shows word-by-word highlighting
- Verify exit animations play on text/code layers
