---
status: verifying
trigger: "annotation-quality-handdrawn-and-relative"
created: 2026-03-28T09:45:00Z
updated: 2026-03-28T10:00:00Z
---

## Current Focus

hypothesis: All three root causes confirmed and fixed. Awaiting human verification.
test: typecheck passes, 513 tests pass (1 pre-existing failure)
expecting: Hand-drawn annotations that are stable (no jitter) and move with the screenshot image
next_action: Human verify by running video pipeline

## Symptoms

expected: Hand-drawn style annotations (wobbly circles, rough underlines, sketchy arrows) that appear once and stay stable, positioned relative to the screenshot content so they move WITH the image when Ken Burns panning/zooming is active.
actual: Geometrically perfect shapes that continuously shake/jitter, anchored to absolute screen coordinates rather than moving with the screenshot image.
errors: No errors thrown - visual quality issues only.
reproduction: Run video-script create with any topic, observe annotations in rendered video.
started: Annotation components were just fixed to render visually (commit b58bd1b), but the visual quality and positioning relative to screenshots has never been correct.

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-28T09:45:00Z
  checked: packages/renderer/src/remotion/annotations/index.ts generateWobblyPath()
  found: Uses Math.random() on original lines 45, 51, 52 for jitter. Remotion re-renders every frame, so Math.random() produces new values each frame = continuous shaking.
  implication: MUST use deterministic pseudo-random seeded from annotation position/type so path is stable across frames

- timestamp: 2026-03-28T09:45:01Z
  checked: All annotation components (Circle, Arrow, Underline, Box, Highlight, Number)
  found: Default wobble=2-3 pixels. On a 1920x1080 canvas this is sub-pixel visually. No multi-stroke rendering (real hand-drawn = 2-3 overlapping strokes). No line width variation.
  implication: Need larger wobble (8-15px range) + multi-pass rendering technique for genuine hand-drawn look

- timestamp: 2026-03-28T09:45:02Z
  checked: packages/renderer/src/remotion/components/ScreenshotLayer.tsx lines 59-89 (web-page pan mode)
  found: AnnotationRenderer was a sibling of the Img inside the overflow:hidden div, but NOT inside the image's CSS transform. The image got transform translate scale but annotations were at fixed pixel positions in the 1920x1080 container.
  implication: Annotations did not move with the image during Ken Burns pan/zoom. Must place annotations inside a wrapper that receives the same transform.

- timestamp: 2026-03-28T09:45:03Z
  checked: packages/renderer/src/remotion/components/ScreenshotLayer.tsx lines 159-171 (traditional Ken Burns mode)
  found: AnnotationRenderer IS inside the AbsoluteFill that receives the Ken Burns transform. This mode should work for relative positioning.
  implication: Traditional Ken Burns mode positioning was structurally correct; web-page pan mode positioning was broken.

- timestamp: 2026-03-28T09:50:00Z
  checked: script.json from test video
  found: Annotations exist only at scene level (scene.annotations), not at layer level (layer.annotations is undefined). Scene.tsx renders them at the scene AbsoluteFill level, not inside ScreenshotLayer.
  implication: Scene-level annotations also need to be passed into ScreenshotLayer so they render inside the transform group.

## Resolution

root_cause: |
  Three distinct bugs:
  BUG 1 (Jitter): generateWobblyPath() uses Math.random() which produces different values on every Remotion frame re-render.
  BUG 2 (Not hand-drawn): Default wobble of 2-3px is invisible at 1920x1080. Single-pass path lacks the messy, multi-stroke quality of real hand-drawing.
  BUG 3 (Fixed positioning): In ScreenshotLayer web-page pan mode, AnnotationRenderer sits outside the CSS transform applied to the image. Scene-level annotations are rendered at Scene level, not inside ScreenshotLayer's transform group.

fix: |
  BUG 1 (Jitter): Replaced Math.random() in generateWobblyPath() with deterministic seeded PRNG (Mulberry32). Seed is derived from FNV-1a hash of first control point coordinates + pass index. Same annotation at same position always produces same path regardless of frame number. Added pass parameter to support multi-stroke rendering.

  BUG 2 (Not hand-drawn):
  - Increased default wobble from 2-3px to 8-15px across all annotation components
  - Added multi-pass rendering: each shape renders twice with different seeds (pass 0 = primary, pass 1 = secondary sketchy overlay at 40% opacity and 60% line width)
  - Control point jitter is 1.5x the wobble amount for more natural curvature
  - Circle wobble=10, Box wobble=10, Underline wobble=8, Arrow wobble=8, Number wobble=8
  - Highlight component gets wobble=6 for subtler roughness (filled shape)

  BUG 3 (Fixed positioning - web-page pan mode):
  - Wrapped both Img and AnnotationRenderer inside a shared transform group div that receives the webPan CSS transform
  - Both image and annotations now pan/zoom together

  BUG 3b (Fixed positioning - scene-level annotations):
  - Scene.tsx InlineScene now passes sceneAnnotations prop to VisualLayerRenderer for screenshot/diagram/image layers in intro/outro and feature modes
  - VisualLayerRenderer passes sceneAnnotations through to ScreenshotLayer
  - ScreenshotLayer merges layer.annotations + sceneAnnotations and renders all inside the transform group
  - Code mode still renders scene-level annotations at scene level (appropriate for code annotations)

verification: |
  - TypeScript typecheck passes with zero errors
  - 513/514 tests pass (1 pre-existing playwright-screenshot waitUntil mismatch, unrelated)
  - All changes are structural and compile cleanly

files_changed:
- packages/renderer/src/remotion/annotations/index.ts
- packages/renderer/src/remotion/annotations/Circle.tsx
- packages/renderer/src/remotion/annotations/Arrow.tsx
- packages/renderer/src/remotion/annotations/Underline.tsx
- packages/renderer/src/remotion/annotations/Box.tsx
- packages/renderer/src/remotion/annotations/Highlight.tsx
- packages/renderer/src/remotion/annotations/Number.tsx
- packages/renderer/src/remotion/components/ScreenshotLayer.tsx
- packages/renderer/src/remotion/components/VisualLayerRenderer.tsx
- packages/renderer/src/remotion/Scene.tsx
