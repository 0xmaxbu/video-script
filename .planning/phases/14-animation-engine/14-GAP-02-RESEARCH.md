# Phase [14]: [Animation Engine] - GAP-02 Research

**Researched:** 2026-03-24
**Domain:** Remotion webpack bundling with workspace dependencies and path-with-spaces issue
**Confidence:** MEDIUM-HIGH

## Summary

GAP-01 attempted to use `packages/renderer/src/remotion/` directly as the Remotion entry point by setting `--root` to `packages/renderer/src` and pointing to `packages/renderer/src/remotion/index.ts`. This approach fails because:

1. **Module resolution context mismatch**: When `cwd` is set to `demo-e2e/.remotion-project` but `--root` points to `packages/renderer/src`, Remotion's webpack cannot resolve components from `packages/renderer/src/remotion/` because the node_modules context is wrong
2. **Workspace dependency**: `packages/renderer/src/remotion/` imports from `@video-script/types` (workspace package), which is not in `demo-e2e/.remotion-project/node_modules`
3. **The "path-with-spaces" symptom**: The space in `/Volumes/SN350-1T 1/dev/video-script/` is NOT the root cause - the real issue is module resolution when cwd differs from the entry point location

**Primary recommendation:** Use `demo-e2e/.remotion-project/` as the canonical Remotion project, but sync the full animation components from `packages/renderer/src/remotion/` into it. Update `video-renderer.ts` to invoke `npx remotion render` with `cwd: demo-e2e/.remotion-project/` and entry point `src/index.tsx`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @remotion/bundler | 4.0.436 | Webpack bundling for Remotion | Core Remotion dependency |
| @remotion/cli | 4.0.436 | CLI for render/preview | Entry point for video generation |
| @remotion/renderer | 4.0.436 | Headless Chromium rendering | Produces MP4 output |
| @remotion/transitions | 4.0.436 | Scene transitions | TransitionSeries animation |
| @video-script/types | workspace:* | Shared Zod schemas | Type definitions for script/scenes |

### Key Files in This Research
| File | Purpose |
|------|---------|
| `packages/renderer/src/video-renderer.ts` | Current render invocation code |
| `packages/renderer/src/remotion/` | Full animation components (14+ files) |
| `demo-e2e/.remotion-project/` | Standalone working Remotion project |
| `demo-e2e/.remotion-project/src/index.tsx` | Working entry point (registerRoot call) |

## Why demo-e2e Works

### Structural Analysis

demo-e2e `.remotion-project/` is a **completely self-contained Remotion project**:

```
demo-e2e/.remotion-project/
  src/
    index.tsx       # registerRoot(RemotionRoot) - Entry point for npx remotion render
    Root.tsx        # Composition registration
    Composition.tsx # TransitionSeries + Scene rendering
    Scene.tsx       # Scene rendering (inline animations only)
    Subtitle.tsx    # Simple subtitle
    tsconfig.json   # Bundler module resolution
  node_modules/     # All dependencies including remotion packages
  package.json      # Lists @remotion/* dependencies
  remotion.config.ts # Webpack customization
```

**Why it works despite path with spaces:**
- `cwd` is `demo-e2e/.remotion-project/` (contains spaces but is the working directory)
- Entry point is `src/index.tsx` (relative to cwd)
- All imports resolve relative to cwd's node_modules
- No cross-directory module resolution needed

### What demo-e2e Lacks

demo-e2e's components are **simplified**:
- `Scene.tsx`: Basic opacity fade (`AnimatedLayer` with `opacity: progress`)
- `Subtitle.tsx`: Static subtitle with simple opacity
- No Ken Burns, no parallax, no KineticSubtitle, no layout templates
- Inline type definitions (not `@video-script/types`)

**Note:** demo-e2e `Root.tsx` imports `ScriptOutputSchema` from `../types.js` which does not exist as a file. This is a TypeScript type import (erased at runtime), so webpack ignores it. But this indicates demo-e2e was generated from an older version.

## Why GAP-01 Approach Fails

The GAP-01 approach (video-renderer.ts lines 143-168):

```typescript
const remotionRoot = join(__dirname, "..", "src");  // packages/renderer/src
const remotionEntryPoint = join(remotionRoot, "remotion", "index.ts");  // .../remotion/index.ts

// ... spawn npx with:
cwd: demo-e2e/.remotion-project  // Space-free cwd
--root packages/renderer/src     // Different from cwd!
src/index.tsx                    // Entry point at packages/renderer/src/remotion/index.ts
```

**Problems:**

1. **Webpack module resolution context**: When `--root` is `packages/renderer/src` but `cwd` is `demo-e2e/.remotion-project/`, webpack resolves imports in `packages/renderer/src/remotion/` using `cwd`'s node_modules. It cannot find `@video-script/types` or other workspace packages.

2. **`@video-script/types` is workspace-only**: This package is not in demo-e2e's `node_modules`. When Remotion's webpack tries to bundle `packages/renderer/src/remotion/Scene.tsx` which has `import type { Annotation } from "@video-script/types"`, webpack fails to resolve the module.

3. **Path calculation bug**: `remotionEntryPoint` is calculated as `join(packages/renderer/src, "remotion", "index.ts")` = `packages/renderer/src/remotion/index.ts`. But `cwd` is `demo-e2e/.remotion-project/`. The entry point file is not relative to cwd.

## Correct Approach

### Option A: Sync Components to demo-e2e (Recommended)

1. **Copy or symlink** components from `packages/renderer/src/remotion/` to `demo-e2e/.remotion-project/src/`:
   - `Root.tsx` (or update demo-e2e's to use full animation system)
   - `Composition.tsx` (full TransitionSeries with blur/flip/clockWipe/iris)
   - `Scene.tsx` (Ken Burns, parallax, layout routing)
   - `Subtitle.tsx` (or use full KineticSubtitle)
   - All `components/`, `layouts/`, `annotations/` directories

2. **Add `@video-script/types`** to demo-e2e `.remotion-project/package.json`:
   ```json
   "@video-script/types": "workspace:*"
   ```

3. **Update demo-e2e's entry point** to properly register the full RemotionRoot

4. **Invoke with correct cwd**:
   ```typescript
   // video-renderer.ts
   spawn("npx", ["remotion", "render", "src/index.tsx", compositionId, outputPath, ...], {
     cwd: demo-e2e/.remotion-project/,  // All module resolution works here
   });
   ```

### Option B: Fix --root Approach

If using `--root` to point to `packages/renderer/src`:
- Must ensure `cwd` is the workspace root (where node_modules can resolve `@video-script/types`)
- Entry point must be relative to `--root`
- Not recommended because workspace root path contains spaces

### Key Insight

The "path with spaces" issue is a **red herring**. The real issue is **module resolution context**. Remotion's webpack needs all modules to be resolvable from the `cwd`'s node_modules. When using `--root` to point to a different directory, all imports in that directory must be resolvable from the `cwd`'s node_modules - which fails for workspace packages.

## Architecture Patterns

### Correct Remotion Invocation Pattern
```typescript
// video-renderer.ts
const demoRemotionDir = join(projectRoot, "demo-e2e", ".remotion-project");
const cwdForSpawn = existsSync(demoRemotionDir) ? demoRemotionDir : fallback;

const args = [
  "remotion",
  "render",
  "src/index.tsx",           // Entry point relative to cwd
  compositionId,
  videoOutputPath,
  "--codec", "h264",
  "--props", propsFilePath,
];

spawn("npx", args, {
  cwd: cwdForSpawn,          // All module resolution relative to this
  stdio: ["pipe", "pipe", "pipe"],
});
```

### Wrong Pattern (GAP-01)
```typescript
// CURRENT - BROKEN
spawn("npx", [
  "remotion", "render",
  "--root", packages/renderer/src,  // Different from cwd!
  packages/renderer/src/remotion/index.ts,  // Absolute path from wrong context
  ...
], { cwd: demo-e2e/.remotion-project/ });  // Module resolution context mismatch
```

## Common Pitfalls

### Pitfall 1: Cross-Directory Module Resolution
**What goes wrong:** `npx remotion render` fails with "Module not found" for `@video-script/types`
**Why it happens:** `--root` points to directory A, `cwd` is directory B. Webpack resolves imports using B's node_modules.
**How to avoid:** Ensure cwd and --root are the same project directory

### Pitfall 2: Entry Point Path Calculation
**What goes wrong:** "File not found" error even though file exists
**Why it happens:** `join(__dirname, "..", "src")` when `__dirname` is `packages/renderer/src` gives `packages/renderer/src`, not `packages/renderer/src/../src` which is the same. But entry point is calculated relative to wrong context.
**How to avoid:** Always make entry point relative to cwd

### Pitfall 3: Type Imports vs Runtime Imports
**What goes wrong:** TypeScript compiles but webpack bundling fails
**Why it happens:** `import type` is compile-time only and should be erased. But some tools process them differently.
**How to avoid:** Use `import type` consistently for types only

## Code Examples

### Demo-e2e Entry Point (Working)
```typescript
// demo-e2e/.remotion-project/src/index.tsx
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

### Demo-e2e Root (Simplified)
```typescript
// demo-e2e/.remotion-project/src/Root.tsx
// Imports ScriptOutputSchema from ../types.js (does not exist - type import erased)
// Registers Video composition with basic defaultProps
```

### Packages/Renderer Root (Full Animation)
```typescript
// packages/renderer/src/remotion/Root.tsx
// Has browser-specific DOM code (createRoot)
// Imports from @video-script/types
// Should NOT be used directly as entry point
```

## Open Questions

1. **Should demo-e2e be the canonical project or should packages/renderer be?**
   - Demo-e2e is a working standalone project but with simplified components
   - packages/renderer has full animations but workspace dependency issues
   - Recommendation: Make demo-e2e canonical by syncing components

2. **How to sync components efficiently?**
   - Copy files? Loses connection to source
   - Symlink directories? May confuse webpack
   - npm link? Complex setup
   - Recommendation: Copy with a sync script that runs before render

3. **Should packages/renderer/src/remotion/index.ts be fixed to not need @video-script/types at runtime?**
   - All imports are `import type` (compile-time only)
   - But webpack may still try to resolve them
   - Recommendation: Test if removing @video-script/types imports breaks bundling

## Sources

### Primary (HIGH confidence)
- demo-e2e `.remotion-project/` structure inspection - verified working project
- `packages/renderer/src/video-renderer.ts` code analysis - GAP-01 implementation
- Glob of `packages/renderer/src/remotion/` - full component inventory

### Secondary (MEDIUM confidence)
- Remotion webpack behavior with --root flag - based on code analysis
- Webpack module resolution context - standard webpack 5 behavior

### Tertiary (LOW confidence)
- Specific webpack error messages - would need live test to confirm

## Metadata

**Confidence breakdown:**
- Module resolution issue: MEDIUM-HIGH - clear from code analysis
- demo-e2e working structure: HIGH - verified by inspection
- Recommended fix: MEDIUM - based on standard Remotion patterns

**Research date:** 2026-03-24
**Valid until:** 30 days (Remotion webpack behavior is stable)

---

## Research Complete

**Gap:** GAP-02 - path-with-spaces blocking Remotion rendering
**Confidence:** MEDIUM

### Key Findings
1. Path-with-spaces is NOT the root cause - module resolution context mismatch is
2. demo-e2e works because it's a self-contained project with all deps in its node_modules
3. GAP-01 fails because --root points to packages/renderer but cwd is demo-e2e, causing @video-script/types to be unfindable
4. Correct approach: Sync full animation components to demo-e2e, invoke with cwd = demo-e2e/.remotion-project

### File Created
`.planning/phases/14-animation-engine/14-GAP-02-RESEARCH.md`

### Recommended Fix
1. Sync `packages/renderer/src/remotion/` components to `demo-e2e/.remotion-project/src/`
2. Add `@video-script/types` to demo-e2e `.remotion-project/package.json`
3. Update video-renderer.ts to invoke `npx remotion render` with:
   - `cwd: demo-e2e/.remotion-project/`
   - Entry point: `src/index.tsx` (relative to cwd)
   - No `--root` flag (not needed when cwd is correct)

### Ready for Planning
Research complete. Planner can now create GAP-02-PLAN.md.
