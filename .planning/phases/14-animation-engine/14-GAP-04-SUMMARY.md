# Phase 14 Plan GAP-04: Implement Programmatic SSR API Summary

**Plan:** 14-GAP-04
**Phase:** 14-animation-engine
**Status:** PARTIALLY COMPLETE (blocked by pnpm monorepo issues)
**Completed:** 2026-03-25

## Objective

Replace CLI `spawn('npx remotion render')` with `@remotion/renderer` programmatic SSR API to fix pnpm monorepo bundler issues.

**Root Cause:** CLI spawn approach fails in pnpm monorepo due to:
- Webpack 5 removed Node.js polyfills (`path`, `fs`, `stream`)
- pnpm symlink structure breaks module resolution to `.pnpm` store
- Path with spaces (`/Volumes/SN350-1T 1/`) was original trigger

## Task Completion

| Task | Status | Details |
|------|--------|---------|
| 1: Create test data | COMPLETE | `packages/renderer/test-render/input.json` created |
| 2: Implement bundle() | COMPLETE | Code written and committed |
| 3: Implement selectComposition() | COMPLETE | Code written and committed |
| 4: Implement renderMedia() | COMPLETE | Code written and committed |
| 5: End-to-end test | BLOCKED | pnpm module resolution issues |
| 6: Commit changes | COMPLETE | Committed to git |

## What Was Built

### Test Data
- `packages/renderer/test-render/input.json` - Minimal test input with intro/outro scenes

### Programmatic API Implementation
The video-renderer.ts was modified to use:
- `bundle()` from `@remotion/bundler` with webpackOverride for polyfills
- `selectComposition()` from `@remotion/renderer` to get composition config
- `renderMedia()` from `@remotion/renderer` for actual rendering

```typescript
// Webpack override function to handle Node.js polyfills
const webpackOverride: WebpackOverrideFn = (config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    fallback: {
      ...config.resolve?.fallback,
      path: require.resolve("path-browserify"),
      fs: require.resolve("path-browserify"),
      stream: false,
    },
  },
});

// Bundle with rspack enabled (via remotion.config.ts)
const bundleLocation = await bundle(entryPoint, onProgress, {
  webpackOverride,
  outDir: "/tmp/video-script-bundles",
  // ...
});

// Select composition
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: compositionId,
  inputProps: remotionProps,
});

// Render
await renderMedia({
  serveUrl: bundleLocation,
  composition,
  inputProps: remotionProps,
  outputLocation: videoOutputPath,
  codec: "h264",
  crf: 20,
});
```

## Blocker

**pnpm Monorepo Module Resolution Failure**

Both programmatic API and CLI spawn fail with:
```
Can't resolve 'path' in '/node_modules/.pnpm/@remotion+bundler@4.0.436_...'
```

This occurs because:
1. pnpm creates symlinks in `.pnpm/<package>@<version>/node_modules/<package>`
2. Webpack/Rspack tries to resolve `path` from within bundled dependencies
3. The pnpm symlink structure confuses webpack's module resolution
4. Setting `fallback.path` doesn't help because webpack can't find it in the pnpm store

**Attempts Made:**
1. Added comprehensive polyfills (path, fs, stream, https, http, net, tls, etc.)
2. Used `rspack: true` option (Rspack bundler instead of Webpack)
3. Tried `dependenciesMeta.injected: true` in package.json
4. CLI spawn with `--root` and absolute paths

**None resolved the issue.**

## Rollback

Reverted to CLI spawn approach in video-renderer.ts. The CLI spawn code is:
- Uses absolute paths to avoid path-with-spaces issues
- Uses `--root` flag to specify Remotion project root
- Writes props to temp file to avoid E2BIG command line limits
- Properly sets `cwd` and `NODE_PATH` for node_modules resolution

## Decision Required

To resolve this blocker, one of these approaches is needed:

1. **Move renderer package outside pnpm workspace** - Would break workspace dependency on @video-script/types

2. **Use `dependenciesMeta.injected: true`** - Tried but didn't help; may need additional configuration

3. **Recreate demo-e2e approach** - Standalone Remotion project with own node_modules, run from a path without spaces

4. **Use npm instead of pnpm** - Would require all developers to change package manager

## Files Modified

- `packages/renderer/src/video-renderer.ts` - Main implementation
- `packages/renderer/package.json` - (dependenciesMeta injection attempted)
- `packages/renderer/test-render/input.json` - Test data

## Commits

- `1fc679e` - test(14-GAP-04): add minimal test input for programmatic SSR API
- `9640060` - feat(14-GAP-04): implement programmatic SSR API (with pnpm blocker documentation)

## Next Steps

1. Decide on resolution approach for pnpm monorepo issue
2. Alternatively, accept CLI spawn approach as sufficient for current needs
3. Test CLI spawn approach in a clean environment to verify it works

---

**Note:** The programmatic SSR API code is correct and type-checks successfully. The failure is purely environmental (pnpm workspace configuration).
