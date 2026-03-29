---
status: awaiting_human_verify
trigger: "Annotations are positioned using a coarse 3x3 grid (region-based) which doesn't accurately frame the actual keywords/content they should highlight."
created: 2026-03-29T00:00:00Z
updated: 2026-03-29T00:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - textMatch annotations had no coordinate resolution. Fixed by adding Playwright-based text position extraction.
test: All 10 unit tests pass for text-position-extractor. TypeScript compiles cleanly.
expecting: User verifies annotation positioning in real pipeline run.
next_action: Await user verification.

## Symptoms

expected: Hand-drawn circles should visually encircle the specific keyword mentioned in the annotation's textMatch. Highlights should frame the exact paragraph. The annotation position should match where the actual content appears on the screenshot.
actual: Annotations are placed in the correct general region (top-left, center, etc.) but don't frame the specific keywords. A circle meant to highlight "USB-C" appears somewhere in the top region rather than directly around the text "USB-C".
errors: No errors thrown.
reproduction: Run a full pipeline with any topic that generates annotations, check the video to see annotations are in the right area but not framing the actual text.
started: Since annotation coordinate resolution was implemented, it has only used region-based fallback.

## Eliminated

## Evidence

- timestamp: 2026-03-29T00:01:00Z
  checked: AnnotationRenderer.tsx resolveTargetPosition()
  found: Three resolution paths only: (1) explicit x/y on target, (2) region string mapped to 3x3 grid center points, (3) distributed grid for text/code-line targets. Path 3 places annotations in a mathematically distributed pattern with NO relation to where text actually appears on the screenshot.
  implication: Text targets with textMatch are completely unhandled for positioning. The textMatch field is informational only -- it describes what to annotate but not where.

- timestamp: 2026-03-29T00:02:00Z
  checked: AnnotationTargetSchema in packages/types/src/visual.ts
  found: Schema has type, textMatch, lineNumber, region, x, y fields. The x/y fields exist but are optional and never populated by any upstream code.
  implication: The schema supports precise coordinates but nothing in the pipeline fills them in.

- timestamp: 2026-03-29T00:03:00Z
  checked: sceneAdapter.ts convertSceneHighlightToAnnotation()
  found: Creates annotations with target type "text" and textMatch set to highlight.text, but x/y are never set. For code highlights, lineNumber is set but again no x/y.
  implication: The adapter preserves the semantic target info but does not resolve to pixel coordinates.

- timestamp: 2026-03-29T00:04:00Z
  checked: playwright-screenshot.ts - full screenshot tool
  found: The tool captures screenshots but does NOT extract any element position data. It has no awareness of annotations or textMatch. The output is just {imagePath, url, success}.
  implication: There is no bridge between the Playwright browser context (which has DOM access and could find element positions) and the annotation positioning system.

- timestamp: 2026-03-29T00:05:00Z
  checked: Knowledge base for related patterns
  found: Knowledge base has "annotations-not-generated-in-script" which was about annotations not appearing at all. This is a different issue -- annotations appear but are positioned wrong.
  implication: This is a new issue, not a regression from the known fix.

- timestamp: 2026-03-29T00:20:00Z
  checked: Implemented text-position-extractor.ts
  found: Created src/utils/text-position-extractor.ts with extractTextPositions() and resolveAnnotationPositions(). Uses Playwright to open source URLs, walk the DOM to find elements containing textMatch strings, and extract bounding box center coordinates. Resolved to all 10 unit tests passing.
  implication: The fix is implemented and tested at the utility level.

- timestamp: 2026-03-29T00:25:00Z
  checked: Wired resolveAnnotationPositions into CLI compose paths
  found: Added calls in all three compose paths: (1) `compose` command, (2) `runScreenshotAndCompose` in `create` flow, (3) `resume` command. Each reads research.json for source URLs, builds a scene-to-URL map, and calls resolveAnnotationPositions with a 15s timeout. Failures are non-blocking (fall back to region-based positioning).
  implication: The fix is wired into the pipeline at the correct point -- after screenshots and augmentation, before render.

## Resolution

root_cause: The annotation positioning system had no mechanism to resolve textMatch targets to actual pixel coordinates on the screenshot. The resolveTargetPosition() function in AnnotationRenderer.tsx only supported: (1) explicit x/y coordinates (never populated by upstream), (2) 3x3 region grid mapping, or (3) evenly distributed grid placement. When the script agent generated annotations with textMatch targets, those fell through to option 3 -- a mathematical distribution pattern unrelated to actual text positions. The Playwright screenshot capture step never extracted DOM element positions despite having full browser access.
fix: Created src/utils/text-position-extractor.ts with two functions: (1) extractTextPositions() uses Playwright to open source URLs, walk the DOM to find the smallest visible element containing each textMatch string, and return bounding box center coordinates; (2) resolveAnnotationPositions() orchestrates extraction across scenes, trying multiple URLs per scene as fallback. Wired into all three compose paths in src/cli/index.ts. The extraction runs after screenshot augmentation but before render. Failures are non-blocking -- annotations fall back to the existing region-based positioning. The renderer's existing explicit x/y resolution path (already path 1 in resolveTargetPosition) handles the injected coordinates correctly, requiring zero renderer changes.
verification: 10/10 unit tests pass (including edge cases: single target, multiple targets, not-found targets, existing x/y preservation, region target skip, missing annotations, URL fallback). TypeScript compiles cleanly. Pre-existing test failures in scene-adapter-visual.test.ts and playwright-screenshot.test.ts are unrelated.
files_changed:
  - src/utils/text-position-extractor.ts (new file)
  - src/utils/__tests__/text-position-extractor.test.ts (new file)
  - src/cli/index.ts (added import + 3 compose path integrations)
