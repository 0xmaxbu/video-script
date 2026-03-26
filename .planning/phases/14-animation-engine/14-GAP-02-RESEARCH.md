# Phase [14]: [Animation Engine] - GAP-02 Research (Final)

**Researched:** 2026-03-25
**Domain:** Remotion webpack bundling with path-with-spaces issue
**Confidence:** HIGH

## Summary

The root cause has been identified: **The project path `/Volumes/SN350-1T 1/dev/video-script/` contains a space ("SN350-1T 1") which causes webpack's enhanced-resolve to fail module resolution. Additionally, Remotion 4.0.436 has several internal webpack configuration issues that affect bundling.

## Root Cause Analysis

### Primary Issue: Path-with-spaces
When webpack (via @remotion/bundler) tries to resolve modules, the space in `SN350-1T 1` causes paths to be incorrectly parsed during alias resolution:
```
root path /Volumes/SN350-1T 1/dev/video-script/packages/renderer
  using description file: .../package.json (relative path: ./Volumes/SN350-1T 1/dev/video-script/node_modules/...)
```

The space causes webpack to interpret `SN350-1T` as one token and `1/dev/video-script/node_modules/...` as a relative path suffix.

### Secondary Issue: @remotion/studio alias configuration
The `@remotion/studio` alias points to `dist/index.js` (a file) instead of `dist/` (a directory). When webpack tries to resolve subpath imports like `@remotion/studio/renderEntry`, it appends to the path creating `dist/index.js/renderEntry` which doesn't exist.

### Tertiary Issue: Native compositor modules
Remotion's bundler tries to include platform-specific native modules (`@remotion/compositor-*`) in the browser bundle. These are server-side only and shouldn't be bundled.

### Quaternary Issue: Binary file inclusion
Webpack is trying to parse a binary file (`.node` or `.wasm`) as JavaScript, causing a "Module parse failed" error.

## Solutions Attempted

### 1. Symlink Workaround (Recommended)
Create a symlink at a path without spaces:
```bash
ln -s "/Volumes/SN350-1T 1/dev/video-script" ~/video-script
```

Run renders from the symlinked path:
```bash
cd ~/video-script/demo-e2e/.remotion-project
npx remotion render src/index.tsx Video out.mp4
```

**Status**: Fixes the path-with-spaces issue but but other issues remain.

### 2. Rspack Bundler (Experimental)
Remotion v4.0.426+ has experimental Rspack support:
```typescript
Config.setExperimentalRspackEnabled(true);
```

**Status**: Rspack resolves path-with-spaces but but has issues with:
- Native compositor module resolution
- Binary file parsing errors
- The experimental feature is not fully compatible with all webpack plugins

### 3. Webpack Configuration Overrides
Applied various webpack config overrides:
- Fixed `@remotion/studio` alias to point to directory
- Added Node.js core module fallbacks (path, fs, crypto, etc.)
- Added externals for compositor native modules

**Status**: Fixes alias and fallback issues, but binary file inclusion error persists.

## Current Blockers

1. **Binary file parsing**: Webpack is trying to include a binary file (likely from a native Node.js addon) in the bundle
2. **Remotion bundler architecture**: The `@remotion/bundler` package includes code that shouldn't be bundled for browser (renderer code, native compositor modules)

## Recommended Solution

The most reliable solution is to **move the project to a path without spaces permanently**. This avoids all webpack enhanced-resolve path parsing issues.

Options:
1. **Rename the volume** (if possible): Rename "SN350-1T 1" to "SN350-1T"
2. **Move project**: Move the project to `~/Projects/video-script`
3. **Clone to new location**: Clone the repository to a space-free path

## Workaround for Current Location

If moving the project is not feasible, the following workaround can be applied:

1. Create a symlink (already done): `~/video-script -> "/Volumes/SN350-1T 1/dev/video-script"`
2. The `remotion.config.ts` file should include the fixes for:
   - `@remotion/studio` alias correction
   - Node.js core module fallbacks
   - Native compositor module externals

3. TheCurrent configuration file: `demo-e2e/.remotion-project/remotion.config.ts`

## Next Steps

1. **Report to Remotion**: Consider reporting the path-with-spaces issue and binary file inclusion issue to the Remotion team
2. **Alternative**: Wait for Remotion to fix these issues in future versions
3. **Permanent fix**: Move project to a path without spaces
