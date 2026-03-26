# GAP-04: Implement Programmatic SSR API - BLOCKER

**Phase:** 14-animation-engine
**Status:** NEEDS REPLANNING
**Created:** 2026-03-25
**Updated:** 2026-03-25

## Summary

Phase 14 needs replanning. Previous approach (programmatic SSR API via @remotion/renderer) hit webpack bundler issues in pnpm monorepo environment.

## Objective

Replace CLI `spawn('npx remotion render')` with `@remotion/renderer` programmatic SSR API to fix pnpm monorepo bundler issues.

---

**Error Chain:**

1. `path` in @remotion/bundler → Fixed with external
2. `../types.js` resolution → Fixed with extensionAlias
3. `module` not found → Fixed with fallback
4. `url.fileURLToPath` → Could NOT fix
5. `node:assert` → New error after prettier external

---
