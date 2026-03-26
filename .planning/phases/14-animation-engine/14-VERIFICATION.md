---
phase: 14-animation-engine
verified: 2026-03-26T00:00:00Z
status: gaps_found
score: 3/6 must-haves verified
gaps:
  - truth: "Ken Burns zoom/pan is visible on screenshot layers in rendered video"
    status: failed
    reason: "Code exists and is bundled, but test fixture has no screenshot layers to exercise it. Cannot verify visual output."
    artifacts:
      - path: "packages/renderer/src/remotion/components/ScreenshotLayer.tsx"
        issue: "Functionally correct code, but unexercised — test fixture screenshots/ dir is empty and script.json has no screenshot-type visualLayers"
    missing:
      - "A test fixture with at least one screenshot-type visualLayer and a real screenshot file in screenshots/"
      - "Frame extraction and visual confirmation that Ken Burns zoom/pan is visible on that layer"

  - truth: "Stagger animation is visible on bullet-list scenes in rendered video"
    status: failed
    reason: "staggerDelay is correctly used in BulletList.tsx, but the test fixture has no bullet-list layout scenes. Cannot verify visual output."
    artifacts:
      - path: "packages/renderer/src/remotion/layouts/BulletList.tsx"
        issue: "Functionally correct code, but unexercised — no bullet-list scenes in test fixture"
    missing:
      - "A test fixture with a bullet-list layout scene"
      - "Frame extraction confirming staggered item entrance is visible"

  - truth: "ENTER_ANIMATION_CONFIG is exported for external consumers"
    status: failed
    reason: "ENTER_ANIMATION_CONFIG is defined as a module-private const — missing export keyword. ANIM-01 requires it to be exported."
    artifacts:
      - path: "packages/renderer/src/utils/animation-utils.ts"
        issue: "Line 23: `const ENTER_ANIMATION_CONFIG` — no export keyword"
    missing:
      - "Add `export` keyword to ENTER_ANIMATION_CONFIG on line 23"

  - truth: "KineticSubtitle words are separated by spaces in rendered video"
    status: failed
    reason: "Rendered frames show words concatenated without spaces (e.g. 'WelcometothistutorialonTypeScriptgenerics'). The gap CSS is present but words render without visual separation in Playwright headless Chrome."
    artifacts:
      - path: "packages/renderer/src/remotion/components/KineticSubtitle.tsx"
        issue: "Line 81: gap: '4px 2px' on flex container — words render as concatenated in headless Playwright render"
    missing:
      - "Add a trailing space to each word span, or use margin-right instead of gap, so words are visually separated in rendered output"
human_verification:
  - test: "Render a video with at least one screenshot-type visualLayer and verify Ken Burns"
    expected: "The screenshot layer should visibly zoom in or pan during the scene duration"
    why_human: "Cannot verify motion/animation from a single static frame; requires video playback or multi-frame diff"
  - test: "Render a video with a bullet-list layout scene and verify stagger"
    expected: "Bullet points should appear one-by-one with staggered delays, not all at once"
    why_human: "Stagger is a timing effect requiring multi-frame observation"
---

# Phase 14: Animation Engine Verification Report

**Phase Goal:** Complete animation system with Ken Burns, parallax, stagger, kinetic typography, and 10+ animation types delivering polished motion in rendered video output.
**Verified:** 2026-03-26
**Status:** gaps_found — 3/6 truths verified, 3 confirmed failing
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                  | Status     | Evidence                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| 1   | SPRING_PRESETS, useEnterAnimation, useExitAnimation, useKenBurns, useParallax, staggerDelay all exist and are exported | ✓ VERIFIED | `animation-utils.ts` 216 lines; all 5 functions exported; confirmed in bundle grep              |
| 2   | All 7 scene transitions (fade/slide/wipe/flip/clockWipe/iris/blur) render without errors                               | ✓ VERIFIED | `Composition.tsx` has all 7 cases, no `require()` calls, build passes, video renders end-to-end |
| 3   | KineticSubtitle per-word karaoke highlight is visible in rendered video                                                | ✓ VERIFIED | Frame analysis confirms yellow highlight on active word in all 3 scenes                         |
| 4   | Ken Burns zoom/pan is visible on screenshot layers in rendered video                                                   | ✗ FAILED   | Test fixture has no screenshot layers — cannot exercise `useKenBurns` in ScreenshotLayer        |
| 5   | Stagger animation is visible on bullet-list scenes in rendered video                                                   | ✗ FAILED   | Test fixture has no bullet-list scenes — cannot exercise `staggerDelay` in BulletList           |
| 6   | ENTER_ANIMATION_CONFIG is exported; KineticSubtitle words render with spaces                                           | ✗ FAILED   | `ENTER_ANIMATION_CONFIG` missing `export`; words concatenated without spaces in rendered frames |

**Score:** 3/6 truths verified

---

## Required Artifacts

| Artifact                                                        | Status      | Details                                                                                                             |
| --------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `packages/renderer/src/utils/animation-utils.ts`                | ✓ VERIFIED  | 216 lines; SPRING_PRESETS, useEnterAnimation, useExitAnimation, useKenBurns, useParallax, staggerDelay all exported |
| `ENTER_ANIMATION_CONFIG` (in animation-utils.ts)                | ✗ STUB      | Defined line 23 as `const ENTER_ANIMATION_CONFIG` — **no `export` keyword**                                         |
| `packages/renderer/src/remotion/Composition.tsx`                | ✓ VERIFIED  | All 7 transitions; no require(); builds and renders cleanly                                                         |
| `packages/renderer/src/remotion/components/ScreenshotLayer.tsx` | ⚠️ ORPHANED | Code correct (useKenBurns + useParallax wired); but unexercised — empty test fixture                                |
| `packages/renderer/src/remotion/components/KineticSubtitle.tsx` | ⚠️ PARTIAL  | Highlight logic works ✓; word spacing broken ✗ — words concatenate in rendered output                               |
| `packages/renderer/src/remotion/components/TextLayer.tsx`       | ✓ VERIFIED  | useEnterAnimation + useExitAnimation both present                                                                   |
| `packages/renderer/src/remotion/components/CodeLayer.tsx`       | ✓ VERIFIED  | useEnterAnimation + useExitAnimation + scale transform all present                                                  |
| `packages/renderer/src/remotion/layouts/BulletList.tsx`         | ⚠️ ORPHANED | staggerDelay + SPRING_PRESETS correctly used (lines 91, 95); unexercised — no fixture                               |

---

## Key Link Verification

| From                      | To                                | Via                                         | Status   | Details                                                     |
| ------------------------- | --------------------------------- | ------------------------------------------- | -------- | ----------------------------------------------------------- |
| `ScreenshotLayer.tsx`     | `useKenBurns` in animation-utils  | `sceneType` prop → `useKenBurns(sceneType)` | ✓ WIRED  | Code wired; untested in render due to empty fixture         |
| `ScreenshotLayer.tsx`     | `useParallax`                     | `scrollProgress` → `useParallax()`          | ✓ WIRED  | Code wired; untested in render                              |
| `BulletList.tsx`          | `staggerDelay` in animation-utils | `staggerDelay(index)` call line 91          | ✓ WIRED  | Code wired; untested in render                              |
| `Scene.tsx`               | `KineticSubtitle`                 | All 3 scene types render KineticSubtitle    | ✓ WIRED  | Confirmed in rendered frames                                |
| `VisualLayerRenderer.tsx` | `ScreenshotLayer`                 | `sceneType` prop passed through             | ✓ WIRED  | Prop chain: Scene → VisualLayerRenderer → ScreenshotLayer   |
| `KineticSubtitle.tsx`     | word-spacing CSS                  | `gap: "4px 2px"` on flex container          | ✗ BROKEN | Words render without spaces in Playwright headless renderer |

---

## Requirements Coverage

| Requirement | Source Plan | Description                                                                     | Status       | Evidence                                                        |
| ----------- | ----------- | ------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------- |
| ANIM-01     | 14-01-PLAN  | Core animation library with SPRING_PRESETS, useEnterAnimation, useExitAnimation | ✗ PARTIAL    | Functions exist and work; `ENTER_ANIMATION_CONFIG` not exported |
| ANIM-02     | 14-01-PLAN  | 7 scene transitions in Composition.tsx                                          | ✓ SATISFIED  | All 7 cases present; builds and renders                         |
| ANIM-03     | 14-02-PLAN  | Ken Burns on screenshot layers                                                  | ✗ UNVERIFIED | Code present; fixture cannot exercise it                        |
| ANIM-04     | 14-02-PLAN  | Parallax on screenshot layers                                                   | ✗ UNVERIFIED | Code present; fixture cannot exercise it                        |
| ANIM-05     | 14-02-PLAN  | Stagger on bullet-list layouts                                                  | ✗ UNVERIFIED | Code present; fixture cannot exercise it                        |
| ANIM-06     | 14-03-PLAN  | KineticSubtitle per-word karaoke highlight                                      | ✗ PARTIAL    | Highlight visible ✓; word spacing broken ✗                      |

---

## Anti-Patterns Found

| File                  | Line | Pattern                                                 | Severity   | Impact                                                                                               |
| --------------------- | ---- | ------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `animation-utils.ts`  | 23   | `const ENTER_ANIMATION_CONFIG` — missing `export`       | ⚠️ Warning | External consumers cannot import it; ANIM-01 partial failure                                         |
| `KineticSubtitle.tsx` | 81   | `gap: "4px 2px"` — words concatenate in headless render | 🛑 Blocker | Words render as run-together text (confirmed in multiple frames); degrades readability of all videos |

---

## Human Verification Required

### 1. Ken Burns / Parallax on Screenshot Layers

**Test:** Create a test fixture with at least one `screenshot`-type `visualLayer` pointing to a real image file, render a video, and watch the scene.
**Expected:** The screenshot should visibly zoom in or pan across the frame over the scene duration (Ken Burns effect).
**Why human:** Motion/animation effects cannot be verified from a single static frame extraction — requires video playback or multi-frame diff analysis.

### 2. Stagger on Bullet-List Scenes

**Test:** Create a test fixture with a scene using the `bullet-list` layout template, render a video, and watch the bullet items appear.
**Expected:** Each bullet point should animate in one after the other with a visible delay between items (stagger effect), not all appearing simultaneously.
**Why human:** Stagger is a timing effect requiring multi-frame observation; a single frame cannot confirm the staggered entrance order.

---

## Gaps Summary

**4 gaps blocking full goal achievement:**

1. **Test fixture limitation (Ken Burns, Parallax, Stagger):** The three most visually significant animations — Ken Burns, parallax, and stagger — cannot be verified because the e2e test fixture `tests/e2e/video-playback-test/` has no screenshot-type visual layers and no bullet-list scenes. The code is correctly implemented and bundled, but the Phase 14 goal requires these animations to be _visible in rendered output_, not just present in source. A proper fixture is required to close this gap.

2. **`ENTER_ANIMATION_CONFIG` not exported (ANIM-01):** A single missing `export` keyword on line 23 of `animation-utils.ts` means this config object is inaccessible to consumers. This is a trivial one-line fix.

3. **KineticSubtitle word spacing bug (ANIM-06):** Words concatenate without spaces in rendered output (confirmed in 2 independent frame analyses). The `gap: "4px 2px"` CSS works in browsers but Playwright's headless Chromium renderer produces concatenated text. Fix: append a space character to each word in the word array, or use `marginRight: 4` on each word span instead of `gap` on the container.

**Root cause grouping:** Gaps 1 (fixture) and 3 (word spacing) are render/integration issues. Gap 2 (missing export) is a trivial code oversight. The three animation types in Gap 1 share the same root cause — the fixture lacks the scene types needed to exercise them.

---

_Verified: 2026-03-26_
_Verifier: claude-sonnet-4.6 (gsd-verifier)_
