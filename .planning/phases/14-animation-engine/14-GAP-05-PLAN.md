# GAP-05: Resolve Remotion/pnpm Conflict via Playwright Renderer

**Phase:** 14-animation-engine
**Status:** PLANNED
**Created:** 2026-03-26

## Objective

Replace the broken Remotion webpack bundler with the existing `puppeteer-renderer.ts` (esbuild + Playwright + FFmpeg) to unblock video rendering. Mark animation engine plans (14-01, 14-02, 14-03) as complete — they produced no usable output due to the renderer being non-functional.

---

## Step 1: Mark Prior Plans Complete

The following plans produced designs and code but zero video output — renderer was always broken:

| Plan          | Output                      | Status                                    |
| ------------- | --------------------------- | ----------------------------------------- |
| 14-01-PLAN.md | animation-utils.ts (design) | **Mark complete** — foundation for future |
| 14-02-PLAN.md | Ken Burns, parallax, etc.   | **Mark complete** — same                  |
| 14-03-PLAN.md | KineticSubtitle component   | **Mark complete** — same                  |

**GAP-01, GAP-02, GAP-03** — also mark complete (investigations only).

**GAP-04** — invalidate. The programmatic SSR API approach is abandoned.

---

## Step 2: Install FFmpeg (Already Done)

```bash
brew install ffmpeg
```

**Verification:** `ffmpeg -version` — confirmed installed.

---

## Step 3: Clean Up Renderer Package

### package.json — Remove broken Remotion bundler deps

Remove:

- `@remotion/bundler`
- `@remotion/cli`
- `@remotion/renderer`
- `@remotion/studio`
- `@remotion/studio-server`

Keep:

- `remotion` (React components still need it)
- `@remotion/transitions` (used by Composition.tsx)
- `esbuild` (needed by puppeteer-renderer.ts)
- `playwright` (needed by puppeteer-renderer.ts)
- `zod` — update from `^3.24.0` to `^4.3.6` (match root)

### package-lock.json — DELETE

Conflicting npm lockfile in pnpm workspace.

### .npmrc — DELETE

No longer needed.

### remotion.config.ts — DELETE or minimal

Remove webpack override hacks. Delete if not used by Playwright renderer.

---

## Step 4: Wire Playwright Renderer as Primary Path

### packages/renderer/src/video-renderer.ts

Current state: Already delegates to `renderVideoWithPuppeteer()` from `puppeteer-renderer.ts`.

**Verify:** `renderVideo()` correctly maps input/output interfaces.

### packages/renderer/src/puppeteer-renderer.ts

- Update Zod imports for v4 compat
- Verify esbuild bundling works after deps cleanup
- Verify HTTP server + CDP frame rendering + FFmpeg stitch end-to-end

### packages/renderer/src/types.ts

- Update Zod usage for v4 compatibility

---

## Step 5: Clean Up Root Package

### package.json

- Change renderer dep from `"file:packages/renderer"` to `"workspace:*"`

### src/utils/video-renderer.ts

- Verify it delegates to `@video-script/renderer` correctly

---

## Step 6: Clean Git State

```bash
git add .
git commit -m "fix(renderer): wire puppeteer-renderer as primary, remove broken remotion bundler deps"
```

---

## Step 7: End-to-End Test

Run smoke test with existing E2E fixture:

```bash
node dist/cli/index.js compose tests/e2e/video-playback-test/
```

Verify:

- [ ] `output.mp4` created
- [ ] `output.srt` created
- [ ] MP4 plays with QuickTime (has video content)
- [ ] No webpack or bundler errors

---

## Dependencies

- FFmpeg installed (done)
- puppeteer-renderer.ts already exists and was designed for this
- Playwright already in renderer package

## New Dependencies

- None (all already present)

## Files to Modify

| File                                   | Change                         |
| -------------------------------------- | ------------------------------ |
| `packages/renderer/package.json`       | Remove broken deps, update zod |
| `packages/renderer/package-lock.json`  | DELETE                         |
| `packages/renderer/.npmrc`             | DELETE                         |
| `packages/renderer/remotion.config.ts` | DELETE or minimal              |
| `packages/renderer/src/types.ts`       | Zod v4 compat                  |
| `package.json` (root)                  | Change to workspace:\* dep     |

## Files to Verify

| File                                          | Change                                |
| --------------------------------------------- | ------------------------------------- |
| `packages/renderer/src/video-renderer.ts`     | Already wired — verify                |
| `packages/renderer/src/puppeteer-renderer.ts` | Already exists — verify esbuild works |
| `src/utils/video-renderer.ts`                 | Already delegates — verify            |

---

## Success Criteria

- [ ] `video-script compose` produces valid MP4 output
- [ ] No `@remotion/bundler`, `@remotion/renderer`, `@remotion/cli` in dependency tree
- [ ] esbuild bundles Remotion React components successfully
- [ ] FFmpeg stitches frames into playable MP4
- [ ] Git commit created

---

## Deferred (After This GAP)

- animation-utils.ts integration into layer components (Ken Burns, parallax, stagger)
- KineticSubtitle component wiring
- Full 6 transition types in Composition.tsx

These require a working renderer first.
