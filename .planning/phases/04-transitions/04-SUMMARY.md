# Phase 4: Transitions - Planning Summary

**Status:** Planning complete, ready for execution
**Created:** 2026-03-22
**Plans:** 2 execution plans
**Requirements addressed:** VIS-08, VIS-09, VIS-10

## Overview

Phase 4 implements smooth animated transitions between scenes and refactors code animation to use camera-style zoom/pan effects. This phase wires existing transition infrastructure (TransitionSeries from @remotion/transitions) into the composition layer and removes anti-patterns (CSS transitions in Remotion).

## Planning Artifacts

### Context & Research
- ✅ `04-CONTEXT.md` - Implementation decisions locked (D-01 through D-12)
- ✅ `04-RESEARCH.md` - Technical research on Remotion transitions and patterns
- ✅ `04-DISCUSSION-LOG.md` - Alternatives considered and rationale

### Execution Plans
1. **04-01-PLAN.md** - Scene transition wiring in Composition.tsx
   - Wave 1, autonomous
   - Requirements: VIS-08, VIS-10
   - Files: `packages/renderer/src/remotion/Composition.tsx`

2. **04-02-PLAN.md** - Code animation refactor with zoom/pan
   - Wave 1, autonomous
   - Requirements: VIS-09, VIS-10
   - Files: `packages/renderer/src/remotion/components/CodeAnimation.tsx`

## Key Decisions (from CONTEXT.md)

### Scene Transitions
- **D-01:** Transition at Composition layer (centralized in Composition.tsx)
- **D-02:** Auto-infer transition type from scene.type (intro/outro=fade, feature=slide, code=fade)
- **D-03:** Duration by scene type (intro/outro: 45 frames, feature/code: 30 frames)
- **D-04:** Slide direction alternates (odd scenes from-left, even from-right)
- **D-05:** First scene: no enter transition
- **D-06:** Last scene: no exit transition
- **D-07:** Adjacent scenes use cross-fade (simultaneous exit/enter)

### Code Animation
- **D-08:** Dynamic typewriter speed (based on code length and scene duration)
- **D-09:** Camera zoom/pan effect (not simple scroll)
- **D-10:** Delayed line highlighting (after code fully reveals)

### Spring Animation
- **D-11:** 30-frame settling buffer for spring animations
- **D-12:** Settling frames only in final render (preview skips)

## Implementation Approach

### Plan 04-01: Scene Transitions
**Goal:** Wire TransitionSeries into Composition.tsx

**Key changes:**
1. Add `getTransitionDuration()` helper (45 frames for intro/outro, 30 for feature/code)
2. Add `getTransitionPresentation()` helper with alternating slide direction
3. Update TransitionSeries to skip transition after last scene
4. Use linearTiming for all transitions (no spring physics)

**Anti-patterns removed:** None (new code)

**Testing:**
- Verify first scene has no enter transition
- Verify last scene has no exit transition
- Verify slide direction alternates
- Verify intro/outro get 45-frame transitions
- Verify feature/code get 30-frame transitions

### Plan 04-02: Code Animation Refactor
**Goal:** Replace CSS scroll with Remotion interpolate for zoom/pan

**Key changes:**
1. Add `calculateTypewriterSpeed()` helper for dynamic speed
2. Add zoom/pan interpolation using Remotion's `interpolate()`
3. **REMOVE all CSS `transition` properties** (anti-pattern)
4. Implement delayed line highlighting (trigger after full reveal)
5. Add optional `sceneDuration` and `zoomPanKeyframes` props

**Anti-patterns removed:**
- CSS `transition: "transform 0.1s ease-out"` (non-deterministic)
- Fixed typewriter speed (doesn't adapt to code length)

**Testing:**
- Verify dynamic speed works for short and long code
- Verify CSS transitions are completely removed
- Verify line highlighting delays until code fully reveals
- Verify zoom/pan works when keyframes are provided
- Verify default behavior (no keyframes) renders normally

## Requirements Traceability

| Requirement | Plan | Description | Status |
|-------------|------|-------------|--------|
| VIS-08 | 04-01 | Scene transitions: fade, slideIn effects work correctly | Planned |
| VIS-09 | 04-02 | Text animations: typewriter effect for code scenes | Planned |
| VIS-10 | 04-01, 04-02 | Spring animations with proper delay handling | Planned |

## Dependencies

### Internal Dependencies
- **Phase 1:** Spring config established (damping: 100, stiffness: 200-300)
- **Phase 2:** Layout components provide scene structure
- **Phase 3:** Scene types defined (intro, feature, code, outro)

### External Dependencies
- `@remotion/transitions@4.0.436` - Already installed
- `remotion@4.0.436` - Already installed
- `react@19.2.4` - Already installed

## Risk Mitigation

### Risk 1: CSS Transitions in Remotion
**Impact:** Non-deterministic rendering, visual artifacts
**Mitigation:** Plan 04-02 explicitly removes all CSS `transition` properties
**Verification:** Grep for `transition:` in CodeAnimation.tsx after refactor

### Risk 2: Typewriter Doesn't Finish
**Impact:** Code cut off mid-reveal
**Mitigation:** Dynamic speed calculation reserves 20% buffer (D-08)
**Verification:** Test with long code (500+ chars) and verify completion

### Risk 3: Spring Not Settled
**Impact:** Subtle bounce at animation end
**Mitigation:** 30-frame settling buffer documented (D-11)
**Verification:** Parent component should extend scene duration by 30 frames for final render

### Risk 4: First/Last Scene Transitions
**Impact:** Unwanted black frames at video start/end
**Mitigation:** Explicit checks for `isFirst` and `isLast` (D-05, D-06)
**Verification:** Visual inspection of first and last scenes

## Execution Order

Both plans are **Wave 1** and **autonomous**, meaning they can be executed in any order or in parallel. However, recommended order:

1. **04-01 (Composition.tsx)** - Foundation for scene transitions
2. **04-02 (CodeAnimation.tsx)** - Refactor code animation

Rationale: Scene transitions affect all scenes, while code animation is specific to code scenes. It's easier to test transitions first with simple scenes, then add complex code animation.

## Success Criteria

Phase 4 is complete when:
- [ ] Scene transitions work correctly for all scene types
- [ ] Slide direction alternates rhythmically
- [ ] First scene has no enter transition
- [ ] Last scene has no exit transition
- [ ] Code typewriter uses dynamic speed
- [ ] Code animation has no CSS transitions
- [ ] Line highlighting delays until after full reveal
- [ ] All TypeScript errors resolved
- [ ] Both plans have SUMMARY files documenting results

## Next Steps

1. Execute plan 04-01 (Composition.tsx)
2. Execute plan 04-02 (CodeAnimation.tsx)
3. Create SUMMARY files for each plan
4. Update REQUIREMENTS.md to mark VIS-08, VIS-09, VIS-10 as complete
5. Proceed to Phase 5 (Composition & Polish)

---

*Planning completed: 2026-03-22*
*Ready for execution*
