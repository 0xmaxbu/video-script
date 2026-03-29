---
status: resolved
trigger: "screenshot-pan-zoom-speed-annotations"
created: 2026-03-27T00:00:00Z
updated: 2026-03-27T12:00:00Z
---

## Current Focus

hypothesis: All four bugs confirmed and fixed
test: TypeScript typecheck passes with zero errors
expecting: n/a — resolved
next_action: n/a — resolved

## Symptoms

expected:

1. Same-image camera travel between waypoints completes in 0.4s (12 frames at 30fps)
2. Large image overview→detail zoom-in animation completes in 0.5s (15 frames at 30fps)
3. Annotations defined on visualLayers should be visible in the rendered video
4. Screenshots should be capped at 4800px wide × 2700px tall before rendering (crop excess)

actual:

1. Camera movements between same-image sections are too slow
2. Zoom-in animation for large images is too slow
3. Annotations are not visible/applied in the output video
4. Images can be larger than 4800×2700px — no cropping is happening

errors: none reported
reproduction: run `video-script compose <dir>` on any project with screenshot layers
started: just implemented pan/zoom feature (kenBurnsWaypoints + useWebPagePan)

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-27T00:01:00Z
  checked: packages/renderer/src/utils/animation-utils.ts — useWebPagePan() travel frame computation
  found: |
  totalTravelFrames = Math.max(numTravelSegments, durationInFrames - totalHoldFrames)
  travelFramesPerSegment = totalTravelFrames / numTravelSegments

  Example: scene duration = 10s = 300 frames, 3 waypoints (1 overview + 2 sections)
  totalHoldFrames = 15 + 231 + 231 = 477 (more than durationInFrames!)
  totalTravelFrames = Math.max(2, 300 - 477) = Math.max(2, -177) = 2
  travelFramesPerSegment = 2 / 2 = 1 frame per segment

  BUT when totalHoldFrames < durationInFrames:
  e.g., durationInFrames = 600, totalHoldFrames = 477
  totalTravelFrames = Math.max(2, 600 - 477) = 123
  travelFramesPerSegment = 123 / 2 = 61.5 frames ≈ 2 seconds — too slow!

  Required: 12 frames for same-image travel, 15 frames for overview→zoom-in
  implication: |
  The travel frames are computed as "whatever is left after holds" which can be too many
  or too few. Need fixed travel frames: 15 for overview→first-section, 12 for all others.

- timestamp: 2026-03-27T00:02:00Z
  checked: packages/types/src/script.ts — VisualLayerSchema
  found: |
  VisualLayerSchema has: id, type, position, content, animation, naturalSize, kenBurnsWaypoints
  MISSING: annotations field — Annotation[] type exists in visual.ts but not in VisualLayerSchema
  implication: Even if annotations were generated, they can't be stored in the layer data

- timestamp: 2026-03-27T00:03:00Z
  checked: packages/renderer/src/remotion/components/ScreenshotLayer.tsx
  found: |
  In naturalSize branch (web-page pan mode): renders ONLY <Img> inside overflow:hidden div
  No annotation rendering code anywhere in the file
  No annotation overlay or AnnotationLayer component imported
  implication: Annotations cannot appear even if defined — no render path exists

- timestamp: 2026-03-27T00:04:00Z
  checked: packages/renderer/src/remotion/components/ directory
  found: |
  Files: CalloutLayer, CodeAnimation, CodeLayer, FeatureSlide, KineticSubtitle,
  ProgressIndicator, ScreenshotLayer, TextLayer, Transitions, VisualLayerRenderer
  NO AnnotationLayer component exists
  implication: Need to create AnnotationLayer component AND integrate it

- timestamp: 2026-03-27T00:05:00Z
  checked: src/cli/index.ts — augmentScreenshotLayers()
  found: |
  Lines 136-150: reads metadata with sharp, gets imgW/imgH, generates waypoints,
  returns { ...layer, naturalSize: { width: imgW, height: imgH }, kenBurnsWaypoints }
  NO cropping or size capping — just reads dimensions as-is
  implication: Images larger than 4800×2700 are passed to renderer uncropped

## Resolution

root_cause: |
BUG 1 (Speed): useWebPagePan() distributes remaining frames (durationInFrames - totalHoldFrames)
evenly across travel segments. This produces variable travel durations that can be too long.
Fix: KenBurnsWaypointSchema needs a travelFrames field, OR generateWebPageWaypoints() should
embed explicit travelFrames. Simplest fix: add fixed constants — 15f for overview→section,
12f for section→section — into generateWebPageWaypoints() and read them in useWebPagePan().

Since waypoints don't have per-segment travel frames, the cleanest fix is:

- Add travelFrames to KenBurnsWaypointSchema (frames to travel FROM this waypoint TO next)
- generateWebPageWaypoints() sets travelFrames: 15 for first waypoint, 12 for rest
- useWebPagePan() uses wp.travelFrames for each segment instead of computed average

BUG 2 (Annotations missing from schema): VisualLayerSchema in packages/types/src/script.ts
is missing an `annotations` field. Add: annotations: z.array(AnnotationSchema).optional()

BUG 3 (No annotation renderer): ScreenshotLayer.tsx doesn't render annotations.
Need to create AnnotationLayer.tsx and use it in ScreenshotLayer's web-page pan branch.

BUG 4 (No image size capping): augmentScreenshotLayers() in src/cli/index.ts reads image
dimensions but doesn't crop. Need to add sharp().extract() or .resize() to crop to 4800×2700.

fix: |

1. packages/types/src/script.ts — added travelFrames to KenBurnsWaypointSchema, added annotations to SceneScriptSchema (packages version)
2. packages/renderer/src/types.ts — added travelFrames to KenBurnsWaypointSchema (renderer-local zod v3 copy)
3. packages/renderer/src/utils/animation-utils.ts — useWebPagePan() now uses waypoints[i].travelFrames ?? (i===0 ? 15 : 12) per segment
4. src/cli/index.ts — generateWebPageWaypoints() sets travelFrames=15 on first waypoint, =12 on rest
5. src/cli/index.ts — augmentScreenshotLayers() crops images to max 4800×2700 using sharp().extract() before waypoint generation
6. packages/renderer/src/remotion/components/ScreenshotLayer.tsx — imports AnnotationRenderer; renders it in the naturalSize (web-page pan) branch
7. src/cli/index.ts — all three spawnRenderer call sites now pass scene.annotations through
8. src/types/script.ts — local SceneScriptSchema updated with annotations field + AnnotationSchema import
9. packages/types/dist — rebuilt via tsc to pick up schema changes

verification: TypeScript typecheck passes with zero errors (npm run typecheck)
files_changed:

- packages/types/src/script.ts
- packages/renderer/src/types.ts
- packages/renderer/src/utils/animation-utils.ts
- src/cli/index.ts
- packages/renderer/src/remotion/components/ScreenshotLayer.tsx
- src/types/script.ts
