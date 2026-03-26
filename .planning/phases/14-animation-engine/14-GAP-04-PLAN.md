# GAP-04: Implement Programmatic SSR API

**Phase:** 14-animation-engine
**Status:** PLANNED
**Created:** 2026-03-25

## Objective

Replace CLI `spawn('npx remotion render')` with `@remotion/renderer` programmatic SSR API to fix pnpm monorepo bundler issues.

**Root Cause:** CLI spawn approach fails in pnpm monorepo due to:
- Webpack 5 removed Node.js polyfills (`path`, `fs`, `stream`)
- pnpm symlink structure breaks module resolution to `.pnpm` store
- Path with spaces (`/Volumes/SN350-1T 1/`) exacerbates issues

**Solution:** Use programmatic SSR API with `webpackOverride` to handle polyfills.

---

## Task Breakdown

### Task 1: Create test data in packages/renderer/
**Output:** `packages/renderer/test-render/input.json`
- Create minimal test input matching `RenderVideoInputSchema`
- Use existing script structure if available
- Reference actual screenshot paths

**Verification:** File exists, valid JSON, passes schema validation

---

### Task 2: Implement bundle() function
**Output:** Modified `video-renderer.ts` with `bundle()` call
- Import `bundle` from `@remotion/bundler`
- Create `webpackOverride` function with polyfills for `path`, `fs`, `stream`
- Call `bundle()` with entry point `packages/renderer/src/remotion/index.ts`
- Use `/tmp/video-script-bundles` as `outDir` for caching

**Key Code:**
```typescript
import {bundle} from '@remotion/bundler';

const webpackOverride: WebpackOverrideFn = (config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    fallback: {
      ...config.resolve?.fallback,
      path: require.resolve('path-browserify'),
      fs: require.resolve('path-browserify'),
      stream: false,
    },
  },
});

const bundleLocation = await bundle({
  entryPoint: path.resolve('./src/remotion/index.ts'),
  webpackOverride,
  outDir: '/tmp/video-script-bundles',
});
```

**Verification:** `tsc --noEmit` passes, bundle completes without error

---

### Task 3: Implement selectComposition()
**Output:** `composition` object retrieved
- Pass `serveUrl: bundleLocation`
- Pass `id: compositionId` (default "Video")
- Pass `inputProps` with script and images

**Verification:** `composition.id === 'Video'`, dimensions/fps/duration populated

---

### Task 4: Implement renderMedia()
**Output:** MP4 file created at output path
- Use `bundleLocation` as `serveUrl`
- Pass `composition` object
- Use `codec: 'h264'`, `crf: 20`
- Pass `inputProps` again

**Verification:** `renderMedia()` promise resolves, output file exists

---

### Task 5: End-to-end test
**Output:** `packages/renderer/test-render/output.mp4`
- Run full `renderVideo()` function with test data
- Verify progress callback fires (10% → 30% → 90% → 100%)
- Verify output file size > 1MB
- Verify `ffprobe` reports valid MP4

**Verification:**
```bash
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=noprint_wrappers=1 output.mp4
```

---

### Task 6: Update types and commit
**Output:** Git commit with all changes
- Update `RenderVideoOutput` type if needed
- Delete `demo-e2e*` directories (already deleted in git)
- Commit modified files

**Files to commit:**
- `packages/renderer/src/video-renderer.ts`
- `packages/renderer/src/remotion-project-generator.ts` (may need updates)
- `packages/renderer/package.json` (if new deps added)
- `test-render/` directory

**Verification:** `git log` shows new commit, `git status` clean

---

## Implementation Order

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6
```

## Dependencies

- Task 2-4 depend on Task 1 (test data needed)
- Task 5 depends on Tasks 2-4
- Task 6 depends on Task 5

## New Dependencies

May need to add to `packages/renderer/package.json`:
- `path-browserify` (if not already present)
- `node-polyfill-webpack-plugin` (optional, for more complete polyfills)

## Bundle Output Location

**Decision:** `/tmp/video-script-bundles`

**Rationale:**
- System temp directory, OS handles cleanup
- Path typically不含空格
- Can be reused across renders (bundle is cached)
- Bundle only recreated when source changes

## Test Directory Location

**Decision:** `packages/renderer/test-render/`

**Rationale:**
- Within renderer package, independent testing
- Consistent with monorepo structure
- Easy to clean up (delete directory)
- CI/CD can run tests in package context

---

## Rollback Plan

If programmatic API fails:

1. **Try Rspack:** Add `rspack: true` to bundle options
   ```typescript
   const bundleLocation = await bundle({
     entryPoint,
     rspack: true,  // Use Rspack instead of Webpack
   });
   ```

2. **If Rspack fails:** Consider `dependenciesMeta.injected: true` for renderer package

3. **Last resort:** Keep CLI spawn but fix path issues with proper escaping

---

## Success Criteria

- [ ] `bundle()` completes without "Can't resolve 'path'" errors
- [ ] `renderMedia()` produces valid MP4 output
- [ ] Output video plays correctly with ffplay
- [ ] All animations (Ken Burns, parallax, kinetic subtitles) preserved
- [ ] No "Module not found" errors in webpack bundling
- [ ] Git commit created with all changes
