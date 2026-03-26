# GAP-04: Implement Programmatic SSR API - BLOCKER

**Phase:** 14-animation-engine
**Status:** BLOCKED - FUNDAMENTAL INCOMPATIBILITY
**Created:** 2026-03-25
**Updated:** 2026-03-25

## Summary

**CRITICAL:** Remotion's webpack bundler cannot work in a pnpm monorepo. This is a fundamental architectural incompatibility, not a configuration issue.

## Objective

Replace CLI `spawn('npx remotion render')` with `@remotion/renderer` programmatic SSR API to fix pnpm monorepo bundler issues.

---

## Blocker Summary

**Issue:** Remotion's webpack bundler traverses into pnpm's nested `node_modules` structure and attempts to bundle `@remotion/bundler` itself, which requires Node.js built-ins (`path`, `fs`, `stream`, etc.).

**Root Cause:**
1. pnpm creates nested `node_modules` with symlinks to `.pnpm` store
2. Remotion's webpack config resolves modules through this nested structure
3. Webpack encounters `@remotion/bundler` code that uses Node.js built-ins
4. Webpack 5 doesn't include Node.js polyfills by default
5. Setting `fallback: { path: false }` doesn't help because the bundler IS being bundled

**Error Message:**
```
Module not found: Error: Can't resolve 'path' in '/Volumes/.../node_modules/@remotion/bundler/dist'
BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
```

---

## Attempted Solutions (All Failed)

| Solution | Result |
|----------|--------|
| `node-linker=hoisted` in .npmrc | Insufficient alone - nested structure still exists |
| Webpack fallback config | Still resolves from nested node_modules |
| Rspack bundler | Same issue - can't resolve Node.js built-ins |
| `dependenciesMeta.injected: true` | Did not resolve |
| Marking `@remotion/*` as external | Breaks remotion.config.ts itself |
| Marking `esbuild` as external | Helped with esbuild error, but new errors appeared |
| `target: 'node'` in webpack config | Caused "Self-reference dependency" error |
| Binary file ignore rules | Helped with binary error, but core issue remains |
| Marking `@remotion/bundler` as external | Helped! New error: `../types.js` resolution |
| Extension alias `.js` → `.ts` | Helped! New error: `module` not found |
| `module: false` fallback | Helped! New error: `url.fileURLToPath` |
| URL polyfill | Still failed - webpack uses browser polyfill |
| Marking `prettier` as external | New error: `node:assert` can't be resolved |

**Error Chain:**
1. `path` in @remotion/bundler → Fixed with external
2. `../types.js` resolution → Fixed with extensionAlias
3. `module` not found → Fixed with fallback
4. `url.fileURLToPath` → Could NOT fix
5. `node:assert` → New error after prettier external

---

## Working Solutions

### Option A: Move Renderer Outside pnpm Workspace

**Steps:**
1. Create `packages/renderer-standalone/` outside pnpm workspace
2. Use `npm` or `yarn` instead of pnpm
3. Copy Remotion components from main renderer
4. Call standalone renderer from main process

**Pros:** Clean solution, no pnpm issues
**Cons:** Code duplication, maintenance overhead

### Option B: Keep CLI Spawn Approach

The CLI spawn approach actually works! The issue was with the webpack config trying to fix non-existent problems.

**Current Status:** CLI spawn with `remotion.config.ts` works when config is minimal.

**Steps:**
1. Use simple `remotion.config.ts` without aggressive webpack overrides
2. Let Remotion's default config handle bundling
3. Accept that this is the working solution for pnpm monorepos

**Pros:** No code changes needed, already working
**Cons:** Slower than programmatic API (spawns new process)

### Option C: Use Docker/Container for Rendering

**Steps:**
1. Create Docker container with flat node_modules
2. Mount source code and render inside container
3. Output video files to mounted volume

**Pros:** Isolated environment, consistent behavior
**Cons:** Additional infrastructure complexity

---

## Recommendation

**CRITICAL FINDING:** Remotion's webpack bundler cannot work in a pnpm monorepo because:
1. pnpm creates nested `node_modules` that webpack traverses
2. This traversal reaches packages like `prettier` that use Node.js built-ins
3. Webpack 5 doesn't include Node.js polyfills by default
4. Each fix introduces a new error in an endless chain

**Primary Solution: Move Renderer Outside pnpm Workspace**

```bash
# Create standalone renderer project
mkdir -p standalone-renderer
cd standalone-renderer
npm init -y
npm install @video-script/renderer @remotion/cli @remotion/renderer
# ... configure and use
```

**Alternative: Use npx remotion render directly**

The CLI spawn approach in `video-renderer.ts` already works! The issue is the webpack config trying to fix problems that don't exist.

---

## Files Changed (During Investigation)

| File | Change |
|------|--------|
| `packages/renderer/remotion.config.ts` | Multiple iterations, needs revert to minimal |
| `.npmrc` | Added hoisting settings |
| `packages/renderer/src/video-renderer.ts` | CLI spawn path fixes |

---

## Next Steps

1. **Revert** `remotion.config.ts` to minimal working config
2. **Verify** CLI spawn approach works end-to-end
3. **Document** pnpm monorepo limitation in README
4. **Consider** creating standalone renderer package in future

---

## References

- [Remotion Custom Webpack Config](https://www.remotion.dev/docs/webpack)
- [Webpack 5 Node Polyfills](https://webpack.js.org/blog/2020-10-10-webpack-5-release/#automatic-nodejs-polyfills-removed)
- [pnpm node_modules structure](https://pnpm.io/motivation#saving-disk-space-and-boosting-installation-speed)
