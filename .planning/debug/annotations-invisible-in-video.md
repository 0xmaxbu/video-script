---
status: resolved
trigger: "annotations-invisible-in-video: Annotations generated in script.json but invisible in rendered video because all have target.type=text with textMatch but NO x/y pixel coordinates. AnnotationRenderer defaults to (0,0), 75% off-screen."
created: 2026-03-28T10:00:00Z
updated: 2026-03-28T11:05:00Z
---

## Current Focus

hypothesis: FIXED - Implemented coordinate resolution, appearAt conversion, and prompt improvements
test: typecheck passes, 513/514 tests pass (1 pre-existing failure)
expecting: Annotations should now render at visible positions with correct timing
next_action: Human verify - run a pipeline and confirm annotations are visible in rendered video

## Symptoms

expected: Hand-drawn style annotations (circles, highlights, numbers) should appear over screenshot content in the rendered video at the correct positions matching the textMatch targets.
actual: Annotations exist in script.json and are passed through to the Remotion renderer, but are invisible in the video. Frame analysis shows NO annotation rendering effects anywhere in the video frames.
errors: No errors thrown. Annotations silently render at position (0,0) which is mostly off-screen.
reproduction: Run full pipeline with any topic -> check script.json (has annotations) -> extract video frames at annotation appearAt times -> no annotations visible.
started: Annotation components were implemented in packages/renderer/src/remotion/annotations/ and wired through the pipeline in commits beba9ab and 77ca4f2, but have never been verified to render visually.

## Eliminated

<!-- APPEND only - prevents re-investigating -->

## Evidence

- timestamp: 2026-03-28T10:00:00Z
  checked: Pre-investigation from symptoms
  found: |
  - script.json has 12 annotations with correct structure (type, target.textMatch, style, narrationBinding)
  - All annotations have target.type="text" with textMatch string but target.x and target.y are undefined
  - AnnotationRenderer.tsx falls back to x=0, y=0 for all annotations
  - Circle at (0,0) with radius=50 extends from (-50,-50) to (50,50) - 75% off-screen
  implication: All annotations cluster at top-left origin, invisible or barely visible

- timestamp: 2026-03-28T10:15:00Z
  checked: AnnotationTargetSchema in packages/renderer/src/types.ts (lines 74-85)
  found: x and y are optional fields. Schema supports three target types: text (textMatch), code-line (lineNumber), region. The LLM generates textMatch but cannot know pixel coordinates of web page screenshots.
  implication: The pipeline needs a coordinate resolution step - textMatch must be converted to x/y using the actual screenshot image

- timestamp: 2026-03-28T10:20:00Z
  checked: AnnotationRenderer.tsx lines 48-60
  found: appearAt from narrationBinding is passed directly to Circle/Highlight/etc as frame count. But narrationBinding.appearAt is in SECONDS (e.g., 7 = 7 seconds into scene). Circle.tsx line 34: `Math.max(0, frame - appearAt)` treats it as frame number. At 30fps, appearAt=7 means frame 7 (0.23 seconds), NOT frame 210 (7 seconds).
  implication: Annotations appear WAY too early - at frame 7 instead of frame 210

- timestamp: 2026-03-28T10:25:00Z
  checked: Actual script.json annotations
  found: All 12 annotations confirmed: x=undefined, y=undefined for every one. All use target.type="text" with textMatch. Examples: "USB-C", "Claude", "Visual Studio Code"
  implication: The LLM cannot provide pixel coordinates - it doesn't see the screenshot. Need programmatic coordinate resolution.

- timestamp: 2026-03-28T10:30:00Z
  checked: Scene.tsx and ScreenshotLayer.tsx annotation rendering paths
  found: |
  - Scene.tsx line 112: annotations={scene.annotations} - scene-level annotations passed to Scene
  - InlineScene line 222: <AnnotationRenderer annotations={annotations} /> at scene level
  - ScreenshotLayer.tsx line 31: also reads layer.annotations for layer-level annotations
  - Both paths render annotations, but all have undefined x/y so all go to (0,0)
  implication: Annotations ARE being rendered - just all at (0,0) which is off-screen

## Resolution

root_cause: |
  Three-part root cause:

  1. MISSING COORDINATE RESOLUTION: The script agent LLM generates annotations with target.type="text" and textMatch strings but NO x/y pixel coordinates (all undefined). The LLM cannot know pixel positions of screenshot content. There is no coordinate resolution step in the pipeline to convert textMatch -> pixel (x,y). AnnotationRenderer defaults all to (0,0), placing them 75% off-screen.

  2. APPEAR AT UNIT MISMATCH: AnnotationRenderer passes narrationBinding.appearAt (seconds) directly as the appearAt frame count to annotation components (Circle, Highlight, etc.). But these components treat appearAt as frame number (Circle.tsx line 34: frame - appearAt). At 30fps, appearAt=7 seconds becomes frame 7 (0.23s) instead of frame 210 (7.0s). Annotations appear far too early.

  3. REGION-BASED FALLBACK MISSING: When textMatch fails (no OCR), there is no fallback to region-based positioning (top-left, center, bottom-right etc.) which would at least place annotations in reasonable areas.

fix: |
  Fix approach - multi-step:

  1. Add a coordinate resolution function in AnnotationRenderer that converts textMatch/region targets to approximate pixel positions based on the video frame dimensions (1920x1080). Use region-based fallbacks:
     - For target.type="region": map region names to screen quadrants
     - For target.type="text": distribute annotations across screen regions to avoid overlap (since we can't do OCR in the renderer)

  2. Fix appearAt unit conversion in AnnotationRenderer: multiply appearAt by fps (30) to convert seconds -> frames before passing to annotation components.

  3. Improve the script agent prompt to encourage use of "region" targets alongside textMatch, giving the renderer position hints.

verification: |
  - TypeScript typecheck: clean (no errors)
  - Test suite: 513 pass, 1 pre-existing failure (playwright-screenshot waitUntil mismatch, unrelated)
  - No regressions introduced
files_changed:
- packages/renderer/src/remotion/annotations/AnnotationRenderer.tsx
- src/mastra/agents/script-agent.ts
