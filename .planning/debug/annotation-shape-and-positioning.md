---
status: awaiting_human_verify
trigger: "annotation-handdrawn-shape-and-positioning"
created: 2026-03-28T12:30:00Z
updated: 2026-03-28T15:30:00Z
---

## Current Focus

hypothesis: Fix implemented - shapes now use few-parameter smooth curves instead of per-point noise. Awaiting human verification.
test: Build passed, video rendered successfully (340s, 8 scenes, 27.6MB)
expecting: Smooth tilted ellipses (not jagged circles), smooth curved lines, fully closed circles with no gap
next_action: Human verify by watching rendered video

## Symptoms

expected: Smooth but imperfect shapes - ellipses instead of circles, gentle curves instead of straight lines. NO jagged edges, NO per-point noise. Like someone drew with a pen in one quick stroke. Circle should be fully closed.
actual: Shapes have visible per-point jitter/noise making them look jagged/shaky rather than smoothly imperfect. Circle has a gap at the end.
errors: No errors - visual quality issue.
reproduction: Run video-script compose, observe circle annotation in rendered video.
started: This is the 4th round of fixes. Previous rounds: deterministic PRNG (still jittery), irregular base shapes (still jittery because wobble overlay adds per-point noise), estimatePathLength (gap still exists).

## Eliminated

- hypothesis: Adding deterministic PRNG would fix jitter
  evidence: Jitter still present because even deterministic random offsets at every point create a jagged path
  timestamp: 2026-03-28T12:30:00Z

- hypothesis: Making base shapes irregular + subtle micro-wobble overlay would produce smooth hand-drawn look
  evidence: User confirms jitter/shaking still present. The wobble overlay still adds per-point noise even at wobble=3. Each Q segment gets its own random control point, creating many small direction changes.
  timestamp: 2026-03-28T15:00:00Z

## Evidence

- timestamp: 2026-03-28T12:30:00Z
  checked: generateWobblyPath() in index.ts
  found: Function takes perfect geometric points and adds random offsets. The UNDERLYING SHAPE is still perfect - jitter is overlaid.
  implication: Need to fundamentally change how shapes are generated - vary the base geometry, not overlay noise.

- timestamp: 2026-03-28T12:30:00Z
  checked: Circle.tsx strokeDasharray/strokeDashoffset
  found: strokeDasharray = 2 * Math.PI * radius (theoretical circumference). But wobbly path is LONGER.
  implication: Must use estimated actual path length, not theoretical circumference.

- timestamp: 2026-03-28T12:30:00Z
  checked: AnnotationRenderer resolveTargetPosition()
  found: Region-based positioning is coarse. Annotation sizes were too small.
  implication: Need size-aware dimensions.

- timestamp: 2026-03-28T12:45:00Z
  checked: Build result
  found: Build passes, typecheck passes, video renders.
  implication: Code is structurally correct, just visual quality wrong.

- timestamp: 2026-03-28T15:00:00Z
  checked: generateWobblyPath() architecture - WHY does it still jitter
  found: The function generates Q (quadratic bezier) segments for every pair of consecutive points. For a circle with 36 segments, that's 36 quadratic beziers, each with an independently randomized control point. Even at wobble=3, each Q segment curves in a RANDOM direction relative to its neighbors. This creates many small zigzags = jagged/jittery appearance. The fundamental issue: using MANY short bezier segments with independent random offsets ALWAYS creates jagged paths. Real hand-drawn uses FEW parameters.
  implication: Must completely abandon the per-point micro-wobble approach. Instead: (1) Circles -> tilted ellipse with random semi-axes and rotation, drawn as ONE smooth SVG path. (2) Lines -> single cubic bezier with 1-2 random control points. (3) No per-point noise at all.

- timestamp: 2026-03-28T15:30:00Z
  checked: New implementation build + render
  found: Complete rewrite of all annotation shape generation. Circles now use generateHandDrawnEllipsePath() which creates a tilted ellipse from 3 random parameters (semiA, semiB, tilt). Lines use single cubic bezier C commands. Waves use paired cubic beziers per wave cycle. Rects use 4 cubic beziers (one per side). All components updated. Build passes with zero errors. Video renders successfully (340s, 8 scenes, 27.6MB).
  implication: The fundamental approach change is structurally sound. Need human verification for visual quality.

## Resolution

root_cause: |
  The generateWobblyPath() function adds per-point micro-wobble using independent random
  offsets on every quadratic bezier control point. With 36 segments for a circle, this
  creates 36 small direction changes that produce a jagged, jittery path. Real hand-drawn
  annotations are drawn FAST in one smooth stroke - they are described by very few
  parameters (ellipse ratio, tilt angle, slight curve direction), not by noise at every
  point along the path.

  Additionally, the circle gap issue persists because even with estimatePathLength(),
  the spring() animation never quite reaches progress=1.0 (it asymptotically approaches
  it). The strokeDashoffset never reaches exactly 0, leaving a tiny gap.

fix: |
  Complete rewrite of hand-drawn generation approach:

  1. CIRCLES: Generate as tilted ellipses. Random semi-major and semi-minor axes
     (varying around the base radius) plus a random rotation angle. Draw as a single
     smooth SVG path using the parametric ellipse equation. No per-point noise at all.

  2. LINES/ARROWS: Use a single cubic bezier (C command) with 1-2 control points
     offset perpendicular to the line. The curve is defined by just a few parameters,
     producing a smooth, gentle bend.

  3. UNDERLINES/WAVES: Use a smooth SVG path with a few bezier curves that have
     slightly varying amplitudes, not per-sample random offsets.

  4. RECTS/BOXES: Four separate smooth curves (one per side), each a single cubic
     bezier with slight bowing.

  5. CIRCLE GAP: Clamp progress to ensure it reaches 1.0 by the last frame, and
     use Math.ceil on the path length to ensure dasharray covers the full path.

verification: |
  - packages/renderer TypeScript build: ZERO errors
  - Video composition: SUCCESS (340s, 8 scenes, 27.6MB video.mp4)
  - Awaiting human visual verification

files_changed:
- packages/renderer/src/remotion/annotations/index.ts
- packages/renderer/src/remotion/annotations/Circle.tsx
- packages/renderer/src/remotion/annotations/Underline.tsx
- packages/renderer/src/remotion/annotations/Arrow.tsx
- packages/renderer/src/remotion/annotations/Box.tsx
- packages/renderer/src/remotion/annotations/Highlight.tsx
- packages/renderer/src/remotion/annotations/Number.tsx
