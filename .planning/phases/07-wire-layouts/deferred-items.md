# Deferred Items - Phase 07-02

## Pre-existing TypeScript Errors (Out of Scope)

The following TypeScript errors existed before this plan and are out of scope:

### Layout Files (Phase 2)

**packages/renderer/src/remotion/layouts/index.ts:**
- Line 22: Module '@video-script/types' has no exported member 'VisualScene'
  - Impact: getLayoutComponent function cannot import VisualScene type
  - Workaround: Layout components use local type definitions

**packages/renderer/src/remotion/layouts/*.tsx (multiple files):**
- Parameter 't', 'r', 'bullet', 'index' implicitly have 'any' type
  - Files affected: BulletList.tsx, CodeFocus.tsx, Comparison.tsx, HeroFullscreen.tsx, Quote.tsx, SplitHorizontal.tsx, SplitVertical.tsx, TextOverImage.tsx
  - Root cause: Missing type annotations in map/forEach callbacks

**Component resolution errors in index.ts:**
- Cannot find name 'HeroFullscreen', 'SplitHorizontal', etc.
  - Likely caused by the VisualScene import failure cascading

### Resolution

These errors should be addressed in a future phase focused on:
1. Adding VisualScene type to @video-script/types package
2. Adding proper type annotations to layout component callbacks
3. Fixing the circular dependency or import path issues

---

*Documented during 07-02 execution on 2026-03-23*
