# Phase 8: verification-cleanup - Research

**Researched:** 2026-03-23
**Domain:** Gap closure -- orphaned export detection, verification documentation, UAT documentation
**Confidence:** HIGH

## Summary

Phase 8 is a gap-closure phase with three distinct tasks: (1) create missing VERIFICATION.md reports for Phases 1 and 4, (2) create UAT.md reports for both phases, and (3) audit and remove dead exports from `packages/renderer/src/index.ts`. The dead export audit reveals that the renderer's index.ts exports many symbols unused by the only internal consumer (cli.ts), including an entire alternate rendering pipeline (Puppeteer) and numerous schema/type exports. The orphaned verification utilities in `packages/renderer/src/verification/index.ts` are also unused.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full verification reports -- observable truths, artifact checks, wiring verification, requirements coverage, anti-patterns
- **D-02:** Exported but no longer used anywhere in the codebase -- find and remove dead exports
- **D-03:** Yes, create UAT.md for both Phase 01 (annotation-renderer) and Phase 04 (transitions) -- conversational testing ensures features work from user perspective

### Claude's Discretion
- How to organize the two VERIFICATION.md files (can share a single doc or be separate)
- Exact format of the UAT conversational tests
- Whether verification utility functions in `packages/renderer/src/verification/index.ts` should be removed entirely or documented as intentional future-use

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| (gap closure) | Document missing verification for Phases 1 and 4 | VERIFICATION.md format from 02-VERIFICATION.md; artifacts catalogued in this research |
| (gap closure) | Create UAT.md for Phases 1 and 4 | UAT.md format from 07-UAT.md |
| (gap closure) | Identify and remove orphaned exports | Dead export audit findings below |

---

## Standard Stack

This phase does not introduce new libraries. It involves auditing existing exports and writing documentation.

| Library | Version | Purpose | Why Standard |
|--------|---------|---------|--------------|
| (none) | -- | -- | No new dependencies |

---

## Dead Export Audit

### packages/renderer/src/index.ts

**Methodology:** Traced each export to its source file, then checked cli.ts (the sole internal consumer) for actual usage. cli.ts imports only `renderVideo`, `RenderVideoInputSchema`, and `generateSrt`. All other exports are unused by internal consumers.

**Unused Exports (candidates for removal):**

| Export | Source File | Used Internally? | Used by cli.ts? | Recommendation |
|--------|-------------|------------------|-----------------|----------------|
| `RenderVideoOutputSchema` | video-renderer.ts | No | No | REMOVE |
| `RenderVideoInput` (type) | video-renderer.ts | No | No | REMOVE |
| `RenderVideoOutput` (type) | video-renderer.ts | No | No | REMOVE |
| `renderVideoWithPuppeteer` | video-renderer.ts | Called by nothing | No | REMOVE |
| `PuppeteerRenderInputSchema` | video-renderer.ts | No | No | REMOVE |
| `PuppeteerRenderOutputSchema` | video-renderer.ts | No | No | REMOVE |
| `PuppeteerRenderInput` (type) | video-renderer.ts | No | No | REMOVE |
| `PuppeteerRenderOutput` (type) | video-renderer.ts | No | No | REMOVE |
| `GenerateSrtInputSchema` | srt-generator.ts | No | No | REMOVE |
| `GenerateSrtOutputSchema` | srt-generator.ts | No | No | REMOVE |
| `GenerateSrtInput` (type) | srt-generator.ts | No | No | REMOVE |
| `GenerateSrtOutput` (type) | srt-generator.ts | No | No | REMOVE |
| `SceneScriptSchema` | types.ts | Yes (remotion-project-generator.ts) | No | KEEP -- used by generated project |
| `ScriptOutputSchema` | types.ts | Yes (remotion-project-generator.ts) | No | KEEP |
| `SceneScript` (type) | types.ts | Yes (remotion-project-generator.ts) | No | KEEP |
| `ScriptOutput` (type) | types.ts | Yes (remotion-project-generator.ts) | No | KEEP |
| `GenerateProjectInput` (type) | remotion-project-generator.ts | Yes (renderVideo) | No | KEEP |
| `GenerateProjectOutput` (type) | remotion-project-generator.ts | Yes (renderVideo) | No | KEEP |
| `calculateTotalDuration` | video-renderer.ts | Yes (renderVideo, renderVideoWithPuppeteer) | No | KEEP |
| `cleanupRemotionTempDir` | cleanup.ts | Yes (renderVideoWithPuppeteer) | No | KEEP (used internally) |

**Key insight:** The `renderVideoWithPuppeteer` alternate rendering pipeline is fully implemented but never called. If retained for future use, it should be clearly documented. If not, remove to reduce surface area.

### Orphaned Verification Utilities

| File | Functions | Exported from index.ts? | Used Anywhere? | Recommendation |
|------|-----------|-------------------------|----------------|----------------|
| `packages/renderer/src/verification/index.ts` | `verifyShikiOutput`, `verifyContentIntegrity`, `verifyDurationMatch` | No | No | REMOVE or document as future-use |

**Key insight:** These verification functions are defined but never imported anywhere. The file itself is not exported from the main index.ts.

---

## Architecture Patterns

### VERIFICATION.md Format (from 02-VERIFICATION.md)

```
---
phase: 02-layout-system
verified: 2026-03-22T18:50:00Z
status: passed
score: 4/4 requirements verified
re_verification: false
gaps: []
---

# Phase 02: Layout System Verification Report

## Goal Achievement

### Observable Truths
| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ... | VERIFIED | ... |

### Required Artifacts
| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|

### Key Link Verification
| From | To | Via | Status | Details |
|------|---|---|-------|---------|

### Requirements Coverage
| Requirement | Source | Description | Status | Evidence |
|-------------|--------|-------------|--------|----------|

### Anti-Patterns Found
| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|

### Gaps Summary
[summary]
```

### UAT.md Format (from 07-UAT.md)

```
---
status: complete
phase: 07-wire-layouts
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md]
started: 2026-03-23T03:00:00Z
updated: 2026-03-23T03:05:00Z
completed: 2026-03-23T03:05:00Z
---

## Current Test
[none - all tests complete]

## Tests
### N. Test name
expected: [what should happen]
result: pass|fail

## Summary
total: N
passed: N
issues: N

## Gaps
[none]
```

---

## Phase 1 (annotation-renderer) Artifacts to Verify

### Required Artifacts

| Artifact | File | Purpose |
|----------|------|---------|
| Circle.tsx | packages/renderer/src/remotion/annotations/Circle.tsx | Reference wobbly annotation with stroke-dashoffset |
| Underline.tsx | packages/renderer/src/remotion/annotations/Underline.tsx | Wobbly horizontal line |
| Arrow.tsx | packages/renderer/src/remotion/annotations/Arrow.tsx | Wobbly line with arrowhead |
| Box.tsx | packages/renderer/src/remotion/annotations/Box.tsx | Wobbly rectangle outline |
| Highlight.tsx | packages/renderer/src/remotion/annotations/Highlight.tsx | Semi-transparent fill |
| Number.tsx | packages/renderer/src/remotion/annotations/Number.tsx | Circle with number inside |
| AnnotationRenderer.tsx | packages/renderer/src/remotion/annotations/AnnotationRenderer.tsx | Orchestrator for all 6 types |
| Scene.tsx (updated) | packages/renderer/src/remotion/Scene.tsx | Accepts annotations prop, renders AnnotationRenderer |
| annotations/index.ts | packages/renderer/src/remotion/annotations/index.ts | Exports all components |

### Observable Truths to Establish

| # | Truth | Evidence |
|---|-------|----------|
| 1 | All 6 annotation types (circle, underline, arrow, box, highlight, number) render with spring animation | Type: spring({ damping: 100, stiffness: 300 }) in each component |
| 2 | stroke-dashoffset draw-on animation used consistently | Circle.tsx, Underline.tsx, Arrow.tsx, Box.tsx, Number.tsx all use strokeDashoffset |
| 3 | All interpolate calls use extrapolateRight: "clamp" | Per D-06 in 01-CONTEXT.md |
| 4 | generateWobblyPath() reused across all annotation types | annotations/index.ts exports it; all components import from ./index.js |
| 5 | Scene.tsx accepts and passes annotations prop to AnnotationRenderer | Scene.tsx line 15: annotations?: Annotation[] |
| 6 | AnnotationRenderer sorts annotations by appearAt for z-ordering | AnnotationRenderer.tsx sorts before rendering |

### Requirements Coverage

| Requirement | Source | Description | Status |
|-------------|--------|-------------|--------|
| VIS-01 | Phase 6 | Annotation renderer renders highlight, underline, circle, number effects | SATISFIED |
| VIS-02 | Phase 6 | Annotations animate correctly using spring/interpolate | SATISFIED |
| VIS-03 | Phase 6 | Animation extrapolation properly clamped | SATISFIED |

---

## Phase 4 (transitions) Artifacts to Verify

### Required Artifacts

| Artifact | File | Purpose |
|----------|------|---------|
| Composition.tsx (updated) | packages/renderer/src/remotion/Composition.tsx | TransitionSeries with duration/direction helpers |
| getTransitionDuration() | Composition.tsx lines 18-33 | Returns 45 frames for intro/outro, 30 for feature/code |
| getTransitionPresentation() | Composition.tsx lines 35-58 | Alternating slide direction; fade for non-slide |
| CodeAnimation.tsx (refactored) | packages/renderer/src/remotion/components/CodeAnimation.tsx | Dynamic typewriter speed, zoom/pan interpolation |
| calculateTypewriterSpeed() | CodeAnimation.tsx | Dynamic speed from codeLength and sceneDurationFrames |
| ZoomPanKeyframe interface | CodeAnimation.tsx | Keyframe-based camera zoom/pan |

### Observable Truths to Establish

| # | Truth | Evidence |
|---|-------|----------|
| 1 | TransitionSeries integration in Composition.tsx | Uses @remotion/transitions: TransitionSeries, linearTiming |
| 2 | Transition duration by scene type (45 for intro/outro, 30 for feature/code) | getTransitionDuration() switch case |
| 3 | Slide direction alternates (odd from-left, even from-right) | getTransitionPresentation(sceneIndex) with sceneIndex % 2 |
| 4 | First scene has no enter transition | TransitionSeries behavior; first scene enters immediately |
| 5 | Last scene has no exit transition | isLast check skips TransitionSeries.Transition for final scene |
| 6 | Dynamic typewriter speed calculation | calculateTypewriterSpeed(codeLength, sceneDurationFrames) |
| 7 | Zoom/pan uses Remotion interpolate (not CSS transition) | Uses interpolate() with extrapolateRight: "clamp", transform: scale/translate |
| 8 | Line highlighting delayed until code fully revealed | isHighlighted check triggers spring after totalChars * speed |

### Requirements Coverage

| Requirement | Source | Description | Status |
|-------------|--------|-------------|--------|
| VIS-08 | Phase 4 | Scene transitions: fade, slideIn effects work correctly | SATISFIED |
| VIS-09 | Phase 4 | Text animations: typewriter effect for code scenes | SATISFIED |
| VIS-10 | Phase 4 | Spring animations with proper delay handling | SATISFIED |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|------------|-----|
| Dead export detection | Manual grep for each export | Grep index.ts exports, trace to internal consumers, check cli.ts imports | cli.ts is single consumer -- traceable manually |
| Verification report structure | Invent new format | Follow 02-VERIFICATION.md exactly | Established pattern already in use |
| UAT report structure | Invent new format | Follow 07-UAT.md exactly | Established pattern already in use |

---

## Common Pitfalls

### Pitfall 1: Removing exports still referenced by generated projects
**What goes wrong:** Generated Remotion projects (from remotion-project-generator.ts) may import types/schemas from the renderer package. Removing SceneScriptSchema, ScriptOutputSchema could break generated code.
**Why it happens:** The generated Root.tsx and Composition.tsx files embed inline schema definitions (D-07 in STATE.md), but other generated files might reference the package directly.
**How to avoid:** Verify generated project files before removing any types -- check remotion-project-generator.ts output templates.

### Pitfall 2: Dead export audit misses runtime-only usage
**What goes wrong:** An export may not be imported by cli.ts but could be used at runtime by external consumers of @video-script/renderer.
**Why it happens:** The package is published; external consumers might rely on PuppeteerRenderInputSchema etc.
**How to avoid:** Document that these types were designed for internal use only; removing them is non-breaking for external consumers since they were never part of the public API contract.

### Pitfall 3: Verification misses wiring between phases
**What goes wrong:** Phase 1 and Phase 4 verify their own components but not the integration wiring (e.g., annotations prop flowing from Scene.tsx to AnnotationRenderer, Composition.tsx calling Scene).
**Why it happens:** Each phase verified its own artifacts in isolation.
**How to avoid:** VERIFICATION.md should include Key Link Verification section showing the wiring between phases.

---

## Code Examples

### Dead Export Detection Command
```bash
# List all exports from index.ts
grep -E "^export" packages/renderer/src/index.ts

# Find which are imported by cli.ts (the only internal consumer)
grep -E "from ['\"]\.\/index" packages/renderer/src/cli.ts

# Find which are imported anywhere in packages/renderer/src
grep -r "RenderVideoOutputSchema\|PuppeteerRenderInputSchema\|GenerateSrtInputSchema\|GenerateProjectInput\|GenerateProjectOutput" packages/renderer/src/
```

### Verification Report Generation
```bash
# TypeScript compile check for Phase 1 artifacts
cd packages/renderer && npx tsc --noEmit

# TypeScript compile check for Phase 4 artifacts
cd packages/renderer && npx tsc --noEmit
```

---

## Open Questions

1. **Puppeteer rendering pipeline**
   - What we know: renderVideoWithPuppeteer is fully implemented but never called
   - What's unclear: Was this intended as the primary renderer and renderVideo as fallback, or the opposite?
   - Recommendation: Check git history or discussion logs; if intentional, keep but document. If accidental, remove.

2. **Verification utility functions**
   - What we know: verifyShikiOutput, verifyContentIntegrity, verifyDurationMatch exist in verification/index.ts, are not exported, and are not used
   - What's unclear: Were these intended for future CI/CD verification of rendered output?
   - Recommendation: Remove if no planned use; otherwise export and integrate into a CI step.

3. **Generated projects and type imports**
   - What we know: remotion-project-generator.ts generates inline schema definitions (D-07) but may still reference types
   - What's unclear: Whether any generated files import from the renderer package's types.js
   - Recommendation: Audit generated Root.tsx/Composition.tsx content templates before removing SceneScriptSchema/ScriptOutputSchema

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | TypeScript compile check (tsc --noEmit) |
| Config file | packages/renderer/tsconfig.json |
| Quick run command | `cd packages/renderer && npx tsc --noEmit` |
| Full suite command | `cd packages/renderer && npm run build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| (gap) | Phase 1 annotation components compile | unit | `tsc --noEmit` | AnnotationRenderer.tsx, Circle.tsx, etc. |
| (gap) | Phase 4 Composition.tsx compiles | unit | `tsc --noEmit` | Composition.tsx |
| (gap) | Phase 4 CodeAnimation.tsx compiles | unit | `tsc --noEmit` | CodeAnimation.tsx |
| (gap) | Dead exports removed from index.ts | manual | grep check | index.ts updated |

### Wave 0 Gaps
- None -- TypeScript infrastructure already exists in packages/renderer
- Dead export removal is a code edit task, not a test task

---

## Sources

### Primary (HIGH confidence)
- packages/renderer/src/index.ts -- actual export list verified by reading file
- packages/renderer/src/cli.ts -- sole internal consumer, verified by reading file
- .planning/phases/02-layout-system/02-VERIFICATION.md -- verification format template
- .planning/phases/07-wire-layouts/07-UAT.md -- UAT format template

### Secondary (MEDIUM confidence)
- Phase 1 summaries (01-01-SUMMARY.md through 01-04-SUMMARY.md) -- artifact list
- Phase 4 summaries (04-01-SUMMARY.md, 04-02-SUMMARY.md) -- artifact list
- packages/renderer/src/video-renderer.ts -- export source tracing
- packages/renderer/src/puppeteer-renderer.ts -- Puppeteer pipeline confirmed unused

### Tertiary (LOW confidence)
- (none -- all critical claims verified directly from source files)

---

## Metadata

**Confidence breakdown:**
- Dead export audit: HIGH -- all traced to source files directly
- Artifact catalog (Phase 1): HIGH -- verified by reading source files
- Artifact catalog (Phase 4): HIGH -- verified by reading source files and summaries
- VERIFICATION.md format: HIGH -- exact pattern from 02-VERIFICATION.md
- UAT.md format: HIGH -- exact pattern from 07-UAT.md

**Research date:** 2026-03-23
**Valid until:** 30 days (documentation/cleanup phase -- no fast-moving domain)
