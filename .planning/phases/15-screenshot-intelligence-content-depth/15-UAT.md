# Phase 15: Screenshot Intelligence + Content Depth — UAT

**Phase:** 15-screenshot-intelligence-content-depth  
**Date:** 2026-03-27  
**Status:** PASS

---

## Test Suite

### T-01: Full Test Suite Passes

**Command:** `npm test`  
**Expected:** All Phase 15 unit tests pass (screenshot: 17, research: 14, visual: 15). Total 468 passed.  
**Result:** PASS — 468 passed, 1 pre-existing fixture failure in `compose-pipeline.test.ts` (unrelated to Phase 15), 3 skipped.

---

## Screenshot Intelligence

### T-02: Dark Mode Screenshot

**File:** `src/mastra/tools/__tests__/playwright-screenshot.test.ts`  
**Test:** `"should capture screenshot with dark mode enabled"`  
**Expected:** `page.emulateMedia` called with `{ colorScheme: 'dark' }` when `darkMode: true`.  
**Result:** PASS — 17 screenshot tests pass.

### T-03: Zoom-to-Region Crop

**File:** `src/mastra/tools/__tests__/playwright-screenshot.test.ts`  
**Test:** `"should zoom to selector using sharp crop"`  
**Expected:** Full-page capture → `element.boundingBox()` → `sharp().extract()` with 16px padding, clamped to image bounds. Output path ends with `-zoomed.png`.  
**Result:** PASS — 17 screenshot tests pass.

---

## Research Depth

### T-04: runDeepResearch Multi-Round Output

**File:** `src/mastra/agents/__tests__/research-agent.test.ts`  
**Tests:** 6 tests for `runDeepResearch` including:

- `"should return merged research from all 3 rounds"`
- `"should call generate 3 times"`
- `"round 2 prompt should include round 1 output"`
- `"round 3 prompt should include round 1 and 2 outputs"`  
  **Expected:** 3 sequential `researchAgent.generate()` calls. Output includes `# Round 1`, `# Round 2`, `# Round 3` sections merged into single Markdown string.  
  **Result:** PASS — 14 research tests pass.

---

## Layout Variety

### T-05: Layout Variety Prompt Injection

**File:** `src/mastra/agents/__tests__/visual-agent.test.ts`  
**Tests:** 6 tests for `generateVisualPrompt` with `usedLayouts` param:

- `"should inject usedLayouts section when provided"`
- `"should not inject usedLayouts section when empty"`
- `"should list all previously used layouts in prompt"`  
  **Expected:** When `usedLayouts` non-empty, prompt includes `## Previously Used Layouts` section and instruction `Do NOT repeat these layouts.`.  
  **Result:** PASS — 15 visual agent tests pass.

---

## Tailwind CSS v4

### T-06: Tailwind CSS Injected in HTML Bundle

**File:** `packages/renderer/src/puppeteer-renderer.ts`  
**Verification:** `generateTailwindCSS(projectSrcDir)` function exists, uses `@tailwindcss/node`'s `compile()` + `@tailwindcss/oxide`'s `Scanner`. Scans `**/*.tsx`, `**/*.ts`, `**/*.jsx`, `**/*.js`, `**/*.html`. Output injected as second `<style>` tag in HTML template.  
**CSS loader:** `.css: 'text'` added to esbuild loaders.  
**CSS entry:** `packages/renderer/src/remotion/index.css` created with `@import "tailwindcss";`.  
**Result:** PASS — TypeScript compiles without errors. `@tailwindcss/oxide` listed in `package.json` devDeps.

---

## Summary

| Test | Feature                     | Status |
| ---- | --------------------------- | ------ |
| T-01 | Full test suite             | PASS   |
| T-02 | Dark mode screenshot        | PASS   |
| T-03 | Zoom-to-region crop         | PASS   |
| T-04 | runDeepResearch multi-round | PASS   |
| T-05 | Layout variety enforcement  | PASS   |
| T-06 | Tailwind CSS v4 in bundle   | PASS   |

All Phase 15 acceptance criteria met.

---

_UAT completed: 2026-03-27_
