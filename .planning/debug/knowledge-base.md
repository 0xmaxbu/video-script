# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## video-empty-content — 视频只有背景无内容：file:// 前缀导致截图未复制到 public/

- **Date:** 2026-03-27
- **Error patterns:** empty content, colorful background, screenshot missing, visualLayers, images empty, ENOENT, copyFileSync, file://, public directory, renderer
- **Root cause:** `runScreenshotAndCompose` in `src/cli/index.ts` set `images[key] = \`file://${resolve(filepath)}\``. Node's `fs.copyFileSync`does not accept`file://`URIs — it throws ENOENT. Screenshots were never copied to the Remotion`public/` directory, so the renderer had no images and showed only colored backgrounds.
- **Fix:** Remove the `file://` prefix — use the bare absolute path `filepath` directly, matching the pattern used by the `compose` and `resume` code paths.
- **Files changed:** src/cli/index.ts

---

## annotations-not-generated-in-script — annotation 组件从未在渲染视频中出现：五处管道断裂

- **Date:** 2026-03-28
- **Error patterns:** annotations absent, script.json no annotations, annotation components unused, AnnotationRenderer never called, VisualLayerSchema missing annotations, scene-adapter drops annotations
- **Root cause:** Five-part gap in the annotation pipeline: (1) VisualLayerSchema in packages/renderer/src/types.ts missing `annotations` field — ScreenshotLayer.tsx always got undefined; (2) Same missing field in packages/types/src/script.ts; (3) ScreenshotLayer.tsx traditional Ken Burns branch never rendered AnnotationRenderer; (4) scene-adapter.ts VisualPlan type had no annotations field and never wired visualScene.annotations → scene.annotations; (5) Script Agent prompt never instructed LLM to generate scene-level annotations, so script.json always had zero annotations.
- **Fix:** (1) Restructured types.ts to declare AnnotationSchema before VisualLayerSchema, added annotations field; (2) Added annotations field to packages/types/src/script.ts VisualLayerSchema; (3) Added AnnotationRenderer to traditional Ken Burns branch in ScreenshotLayer.tsx; (4) Added annotations to VisualPlan scene interface and wired it through in adaptSceneForRenderer(); (5) Added full Annotations section to script-agent.ts instructions with types/targets/styles/binding rules, concrete JSON example in OUTPUT SCHEMA, and requirement in generateScriptPrompt().
- **Files changed:** packages/renderer/src/remotion/components/ScreenshotLayer.tsx, packages/renderer/src/types.ts, packages/types/src/script.ts, src/mastra/agents/script-agent.ts, src/utils/scene-adapter.ts

---
