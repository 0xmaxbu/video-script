---
status: verifying
trigger: "Resume flow produces video with only title scene and black screens for all other scenes. Screenshots and content are missing."
created: 2026-03-29T00:00:00Z
updated: 2026-03-29T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - Resume and runScreenshotAndCompose skip visual.json pipeline
test: Applied fix, typecheck passes
expecting: Resume now reads visual.json and calls adaptScriptForRenderer before auto-inject
next_action: Present checkpoint for human verification

## Symptoms

expected: Resume should re-render a complete video with all scenes, screenshots, text overlays, and annotations.
actual: Resume produces video with only the title/intro scene visible. All other scenes are black with no content.
errors: No errors thrown during rendering.
reproduction: Run `node dist/cli/index.js resume <directory>` where directory contains a valid script.json
started: This has been an issue since the resume command was modified to accept directory paths.

## Eliminated

## Evidence

- timestamp: 2026-03-29T00:01:00Z
  checked: src/cli/index.ts compose command vs resume command vs runScreenshotAndCompose helper
  found: |
    COMPOSE COMMAND (working): Reads visual.json, calls adaptScriptForRenderer, auto-injects, builds images, augments.
    RESUME COMMAND (broken): Skips visual.json read and adaptScriptForRenderer, goes straight to auto-inject.
    runScreenshotAndCompose (broken): Same - skips visual.json and adaptScriptForRenderer.
  implication: All three code paths needed the same visual.json pipeline.

- timestamp: 2026-03-29T00:03:00Z
  checked: Applied fix to both resume and runScreenshotAndCompose paths
  found: Added visual.json reading and adaptScriptForRenderer call to both paths. Changed script.title/totalDuration to use adaptedScript.title/totalDuration. TypeScript typecheck passes.
  implication: Fix is syntactically correct and follows the same pattern as the compose command.

## Resolution

root_cause: Resume command (and runScreenshotAndCompose helper) do not read visual.json or call adaptScriptForRenderer(). The standalone `compose` command does both. This means when resume builds the scene data, it skips the visual plan merging step that provides visualLayers, text overlays, annotations, and layout templates from visual.json.
fix: Added visual.json reading and adaptScriptForRenderer() call to both the resume command handler and the runScreenshotAndCompose helper. Changed spawnRenderer calls to use adaptedScript title/totalDuration instead of raw script values.
verification: TypeScript typecheck passes. Needs runtime verification with actual resume command.
files_changed: [src/cli/index.ts]
