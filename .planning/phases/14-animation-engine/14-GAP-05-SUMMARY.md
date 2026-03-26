# GAP-05: Summary — Playwright Renderer Black Frame Fix

**Phase:** 14-animation-engine
**Status:** COMPLETE
**Completed:** 2026-03-26

## Objective

Fix the Playwright-based renderer producing entirely black MP4 output.

## Root Causes Found and Fixed

### Bug 1: `npm install` on every render (fixed in prior session)

`generateRemotionProject()` ran `npm install` before each render. Removed — esbuild resolves from workspace root `node_modules` via `nodePaths` + `alias`.

### Bug 2: `window.remotion_script` fallback with no `type` field (fixed in prior session)

`index.tsx` used `window.remotion_script` with no `type` field, causing the composition to fail silently. Fixed by embedding actual `script` and `processedScreenshotResources` as JSON literals in the generated file.

### Bug 3: `remotion_ready` check and timing (fixed in prior session)

Playwright was checking `remotion_ready` without the `=== true` guard, and the 50ms wait was insufficient. Fixed by adding `remotion_ready === true` check and reducing wait to 16ms.

### Bug 4: `index.tsx` template — useEffect override + initialFrame re-render (fixed this session)

Two sub-bugs in the `index.tsx` template:

1. **`useEffect` overriding `remotion_setFrame`**: A `useEffect` block in the `App` component replaced the synchronous `remotion_setFrame` with an async `seekTo()` call after mount. This raced with the 16ms screenshot timer.

2. **`initialFrame` is mount-only on `@remotion/player`**: Without `key={frame}`, changing `initialFrame` after initial mount has no effect — the Player ignores prop updates for `initialFrame`.

**Fix**: Rewrote `index.tsx` template:

- Removed `useEffect` and `playerRef` entirely
- Added `key={frame}` to `<Player>` — forces full unmount+remount per frame, making `initialFrame` effective
- `remotion_setFrame` calls `flushSync(() => reactRoot.render(<App frame={frame} />))` — synchronous DOM commit before returning
- `remotion_ready = true` set via `Promise.resolve().then()` after initial render

### Bug 5: Wrong import for `flushSync` (found during this session)

`flushSync` was imported from `react-dom/client` — it does not exist there. It must be imported from `react-dom`. Fixed the template import split:

```ts
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
```

### Bug 6: `deviceScaleFactor: 2` producing 3840×2160 output (fixed this session)

`puppeteer-renderer.ts` was launching the browser with `deviceScaleFactor: 2`, doubling the capture resolution to 3840×2160 instead of 1920×1080. Fixed to `deviceScaleFactor: 1`.

## Verification

End-to-end compose test with fixture at `tests/e2e/video-playback-test/`:

```
node dist/cli/index.js compose tests/e2e/video-playback-test/
```

Results:

- **Resolution**: 1920×1080 ✅ (was 3840×2160)
- **Frame rate**: 30fps ✅
- **Total frames**: 900 (30s × 30fps) ✅
- **Frame 60 YAVG**: 28.68 (non-black) ✅
- **Scene 1** (frame 60): "TypeScript Generics Explained" title card ✅
- **Scene 2** (frame 450): "What are Generics?" with caption overlay ✅
- **SRT subtitles**: generated ✅

## Files Modified

| File                                                  | Change                                                                |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `packages/renderer/src/remotion-project-generator.ts` | Rewrote `index.tsx` template: key={frame}, flushSync, correct imports |
| `packages/renderer/src/puppeteer-renderer.ts`         | `deviceScaleFactor: 2 → 1`                                            |

## Architecture Notes

- The `key={frame}` approach forces React to fully remount `@remotion/player` for each frame capture. This is slower than a `seekTo()` approach but guarantees correctness — no async races, no stale frames.
- `flushSync` ensures the DOM is committed synchronously before `remotion_setFrame` returns, so Playwright can screenshot immediately.
- `remotion_ready` is set via `Promise.resolve().then()` (microtask) after the initial synchronous render, ensuring it's only `true` once React has processed the first render.

## Phase Status

GAP-05 is complete. The animation engine (Phase 14) now produces valid MP4 output. Remaining deferred work:

- `animation-utils.ts` integration (Ken Burns, parallax, stagger)
- `KineticSubtitle` component wiring
- Full 6 transition types in `Composition.tsx`
