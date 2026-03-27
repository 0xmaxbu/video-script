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
