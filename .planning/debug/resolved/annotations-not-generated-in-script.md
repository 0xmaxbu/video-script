---
status: resolved
trigger: "annotations-not-generated-in-script"
created: 2026-03-28T00:00:00Z
updated: 2026-03-28T09:40:00Z
---

## Current Focus

hypothesis: All 4 root causes fixed and committed (beba9ab)
test: typecheck clean, 513/514 tests pass (1 pre-existing unrelated failure)
expecting: Running pipeline should produce script.json with annotations arrays in feature/code scenes
next_action: Human verify — run a pipeline and confirm script.json contains annotations

## Symptoms

<!-- Written during gathering, then IMMUTABLE -->

expected: Script scenes with screenshot visualLayers should have `annotations` arrays pointing to specific content on the screenshot (highlights, arrows, labels, callouts etc.) — using components from `packages/renderer/src/remotion/annotations/`
actual: `script.json` has zero `annotations` fields. `Root.tsx` has zero `annotations` fields. The annotation components in `packages/renderer/src/remotion/annotations/` are never used.
errors: none — annotations are silently absent
reproduction: Run full pipeline → open script.json → no annotations anywhere
started: annotations components exist but have never been used in generated output

## Eliminated

<!-- APPEND only - prevents re-investigating -->

## Evidence

<!-- APPEND only - facts discovered -->

- timestamp: 2026-03-28T00:00:00Z
  checked: packages/renderer/src/remotion/annotations/AnnotationRenderer.tsx
  found: AnnotationRenderer accepts `Annotation[]` from `../../types.js`, renders circle/underline/arrow/box/highlight/number
  implication: Component is fully implemented, just never called

- timestamp: 2026-03-28T00:00:00Z
  checked: packages/renderer/src/remotion/components/ScreenshotLayer.tsx line 31
  found: `const { ..., annotations } = layer;` — destructures annotations from VisualLayer
  implication: BUG — VisualLayer type did NOT have annotations field. This causes LSP error "Property 'annotations' does not exist on type..."

- timestamp: 2026-03-28T00:00:00Z
  checked: packages/renderer/src/types.ts VisualLayerSchema (line 75)
  found: VisualLayerSchema had NO `annotations` field. AnnotationSchema IS defined at line 113.
  implication: ScreenshotLayer.tsx reads layer.annotations which was always undefined

- timestamp: 2026-03-28T00:00:00Z
  checked: packages/types/src/script.ts VisualLayerSchema (line 26)
  found: Same — VisualLayerSchema had NO `annotations` field. `annotations` only exists on SceneScriptSchema (line 63).
  implication: Annotations are designed to be scene-level (not layer-level) in the data model

- timestamp: 2026-03-28T00:00:00Z
  checked: ScreenshotLayer.tsx line 85-87 (naturalSize branch) vs lines 159-170 (traditional branch)
  found: naturalSize branch renders `<AnnotationRenderer annotations={annotations} />` but traditional branch did NOT render annotations at all
  implication: Even if annotations were populated, traditional Ken Burns mode would never show them

- timestamp: 2026-03-28T00:00:00Z
  checked: src/mastra/agents/script-agent.ts instructions
  found: Script Agent prompt had no `annotations` field in OUTPUT SCHEMA example. Only `highlights` and `codeHighlights`. The prompt says "Mark key points for visual emphasis" but ONLY outputs highlights, not scene-level annotations.
  implication: Script Agent LLM never generates annotations field

- timestamp: 2026-03-28T00:00:00Z
  checked: src/utils/scene-adapter.ts adaptSceneForRenderer()
  found: scene-adapter converts visual.json mediaResources→visualLayers and textElements→text layers, but IGNORED annotations from visualPlan entirely. No code path that takes visual.json annotations and puts them on scene.annotations
  implication: Even if Visual Agent generates annotations in visual.json, they were silently dropped

- timestamp: 2026-03-28T09:36:00Z
  checked: all 5 fixes applied and committed as beba9ab
  found: typecheck clean, 513 tests pass (1 pre-existing playwright-screenshot waitUntil mismatch unrelated to this bug)
  implication: Pipeline is now structurally correct — LLM will be instructed to output annotations, they will flow through scene-adapter, and be rendered in both Ken Burns modes

## Resolution

root_cause: Five-part gap in the annotation pipeline:

1. VisualLayerSchema in packages/renderer/src/types.ts was missing `annotations` field — ScreenshotLayer.tsx always got undefined
2. VisualLayerSchema in packages/types/src/script.ts was also missing `annotations` field
3. ScreenshotLayer.tsx traditional Ken Burns branch did not render AnnotationRenderer (naturalSize branch did)
4. scene-adapter.ts VisualPlan type had no annotations field; adaptSceneForRenderer() never wired visualScene.annotations → scene.annotations
5. Script Agent prompt never instructed the LLM to generate scene-level annotations — so script.json always had zero annotations

fix:

1. packages/renderer/src/types.ts — restructured schema declaration order (AnnotationSchema before VisualLayerSchema); added annotations field to VisualLayerSchema
2. packages/types/src/script.ts — added annotations field to VisualLayerSchema
3. ScreenshotLayer.tsx — added AnnotationRenderer render to traditional Ken Burns AbsoluteFill branch
4. scene-adapter.ts — added annotations to VisualPlan scene interface; wired visualScene.annotations → scene.annotations in adaptSceneForRenderer()
5. script-agent.ts — added full Annotations section to agent instructions (types, targets, styles, binding); added concrete example to OUTPUT SCHEMA; added requirement to generateScriptPrompt() output format string

verification: typecheck clean, 513/514 tests pass, 1 pre-existing failure unrelated to annotations
files_changed:

- packages/renderer/src/remotion/components/ScreenshotLayer.tsx
- packages/renderer/src/types.ts
- packages/types/src/script.ts
- src/mastra/agents/script-agent.ts
- src/utils/scene-adapter.ts
  commit: beba9ab
