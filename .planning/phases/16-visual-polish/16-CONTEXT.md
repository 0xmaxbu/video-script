# Phase 16: Visual Polish — Context

**Status:** Planning
**Depends on:** Phase 15 (Complete)
**Requirements:** VIS-11, VIS-12, VIS-13, VIS-14
**Goal:** Dark mode theme, callout system, progress indicators, responsive text sizing — AI Jason aesthetic. Plus a critical architecture change: per-video isolated Remotion projects.

---

## Why This Phase Exists

Phase 15 delivered screenshot intelligence and content depth. The video pipeline now produces well-researched, content-aware scripts — but the visual output still looks generic. Phase 16 attacks the visual layer directly: consistent dark aesthetics, callout highlights, step-by-step progress tracking, and text that fits its container.

In parallel, the rendering architecture needs a fundamental fix. The current shared Remotion project bundled via esbuild and rendered via Puppeteer frame-by-frame was chosen for simplicity (MVP), but it bypasses Remotion's full feature set and makes debugging impossible (no Remotion Studio). Per-video isolated projects fix this.

---

## Architecture Change: Per-Video Remotion Projects

### Current Architecture (broken)

```
packages/renderer/src/remotion/   ← single shared project, all videos use this
  Root.tsx                         ← static, cannot vary per video
  Scene.tsx                        ← generic
puppeteer-renderer.ts              ← esbuild bundle + Puppeteer frame-by-frame (bypasses Remotion APIs)
```

### New Architecture

```
packages/
  renderer/          ← @video-script/renderer (shared component library, unchanged location)
    src/
      layouts/       ← BulletList, HeroFullscreen, etc.
      components/    ← KineticSubtitle, TextLayer, etc.
      utils/         ← animation-utils, grid-utils, theme.ts (NEW)

<outputDir>/                       ← ~/simple-videos/2026/12-xxx/my-title/
  package.json                     ← GENERATED: "file:" protocol for shared packages
  remotion.config.ts               ← GENERATED
  src/
    Root.tsx                       ← GENERATED: registers this video's Composition
    video.tsx                      ← GENERATED: scene data for this video
  node_modules/
    @video-script/renderer/        ← symlinked via file: protocol
    @video-script/types/           ← symlinked via file: protocol
  out/
    video.mp4
    subtitles.srt
```

### Key Decisions

| Decision                    | Choice                                                 | Rationale                                           |
| --------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| Per-video vs shared project | Per-video                                              | Enables Remotion Studio debugging, proper bundler   |
| Package sharing             | `file:` protocol in generated `package.json`           | Simplest for local dev tool, no publish step needed |
| Generated project lifetime  | **Permanent**                                          | User can `npx remotion studio` to preview/tweak     |
| Rendering engine            | `@remotion/bundler` + `@remotion/renderer` Node.js API | Official Remotion path, replaces esbuild hack       |

### Generated `package.json` shape

```json
{
  "name": "video-my-title",
  "version": "1.0.0",
  "dependencies": {
    "@video-script/renderer": "file:/abs/path/to/packages/renderer",
    "@video-script/types": "file:/abs/path/to/packages/types",
    "remotion": "^4.0.0",
    "@remotion/bundler": "^4.0.0",
    "@remotion/renderer": "^4.0.0"
  }
}
```

### Files to create/replace

- **NEW** `packages/renderer/src/utils/project-generator.ts` — scaffolds per-video project
- **NEW** `packages/renderer/src/utils/remotion-renderer.ts` — wraps `@remotion/bundler` + `@remotion/renderer`
- **REPLACED** `packages/renderer/src/puppeteer-renderer.ts` → deprecated, new renderer takes over
- **NEW** `packages/renderer/src/remotion/templates/Root.tsx.template` — handlebars/string template for generated Root.tsx

---

## VIS-11: Dark Mode Theme System

### Current state

- `BulletList.tsx`: has `#0a0a0a` background (dark ✓)
- `Quote.tsx`: has `#0a0a0a` background (dark ✓)
- `HeroFullscreen.tsx`: uses screenshot as bg with `brightness(0.7)` filter — no explicit dark bg
- `SplitVertical.tsx`, `SplitHorizontal.tsx`, `Comparison.tsx`, `TextOverImage.tsx`, `CodeFocus.tsx`: need audit
- `TYPOGRAPHY` constants in `grid-utils.ts` are fine but not theme-aware
- `FrostedCard.tsx`: uses `rgba(255,255,255, ...)` — light-theme default

### Decision

Create `packages/renderer/src/remotion/theme.ts` with centralized palette:

```ts
export const THEME = {
  bg: { primary: "#0a0a0a", secondary: "#111111", card: "#1a1a1a" },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255,255,255,0.7)",
    muted: "rgba(255,255,255,0.4)",
  },
  accent: {
    yellow: "#FFD700",
    yellowMuted: "rgba(255,215,0,0.3)",
    blue: "#3b82f6",
  },
  glass: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
} as const;
```

All layouts migrate to Tailwind CSS v4 (already integrated in Phase 15), replacing inline `style={{}}` objects where possible. Animations remain via `useCurrentFrame()` — never `transition-*` or `animate-*` Tailwind classes.

---

## VIS-12: Callout/Highlight Visual Layer

### Decision: new `VisualLayer` type `"callout"`

Schema addition to `@video-script/types`:

```ts
// Extends VisualLayerSchema type enum:
type: z.enum(["screenshot", "code", "text", "diagram", "image", "callout"])

// Callout-specific content shape (content field is JSON string):
CalloutContent = {
  text: string;
  style: "highlight" | "box" | "arrow-label";  // yellow highlight | rounded box | arrow pointing at something
  arrowDirection?: "left" | "right" | "up" | "down";
}
```

New component `CalloutLayer.tsx`:

- Yellow rounded rect (`THEME.accent.yellow`) with semi-transparent fill
- Optional directional arrow
- Entrance animation via `useCurrentFrame()`

Wire into `VisualLayerRenderer.tsx` for `type === "callout"`.

Update visual agent prompt to generate callout layers for key concepts.

---

## VIS-13: Progress Indicators

### Decision: auto-injected, with enable/disable parameter

- Added to `SceneSchema` as optional field: `progressIndicator?: { enabled: boolean; total: number; current: number }`
- When `enabled: true`, `Scene.tsx` renders a `ProgressIndicator` component overlay
- Visual agent sets this field for multi-step tutorial scenes
- Parameter defaults to `enabled: false` — no indicator unless agent explicitly enables it

Component `ProgressIndicator.tsx`:

- Numbered circles (1, 2, 3...) or checkmarks for completed steps
- Positioned top-right, non-intrusive
- Current step highlighted in `THEME.accent.yellow`
- Completed steps show checkmark in muted color

---

## VIS-14: Responsive Text Sizing (fitText)

### Decision: use `@remotion/layout-utils` fitText

`@remotion/layout-utils` provides:

- `measureText({ text, fontSize, fontFamily, ... })` — measures rendered text width
- `fitText({ text, withinWidth, fontFamily, fontWeight })` — returns the largest font size that fits

Integration points:

- `TextLayer.tsx` — wrap content in fitText when `position.width` is numeric
- `BulletList.tsx` — apply fitText to title and bullet text
- `HeroFullscreen.tsx` — apply fitText to hero title

Layouts are also migrated to Tailwind (VIS-11 scope), so text containers use Tailwind width utilities where possible.

---

## Out of Scope (Phase 16)

- TTS/audio narration
- Publishing `@video-script/renderer` to npm (local `file:` is sufficient)
- Remotion Studio integration as a live preview server
- 9:16 aspect ratio support
- Batch rendering

---

## Plans

| Plan  | Title                                                                        | Requirements |
| ----- | ---------------------------------------------------------------------------- | ------------ |
| 16-01 | Per-video Remotion project generator + @remotion/renderer rendering pipeline | Architecture |
| 16-02 | Dark mode theme constants + Tailwind migration of all layouts                | VIS-11       |
| 16-03 | Callout VisualLayer — schema, component, visual agent update                 | VIS-12       |
| 16-04 | Progress indicator component + auto-injection with enable param              | VIS-13       |
| 16-05 | fitText integration via @remotion/layout-utils                               | VIS-14       |

---

## Success Criteria

1. `video-script create` generates a per-video Remotion project in `outputDir/` with `file:` linked `@video-script/renderer`
2. Rendering uses `@remotion/bundler` + `@remotion/renderer` Node.js API
3. Generated project is permanent — user can `cd <outputDir> && npx remotion studio`
4. All layouts use `THEME` constants from `theme.ts` and Tailwind utility classes for static styles
5. Callout layers render as yellow highlighted boxes with optional arrows
6. Multi-step scenes show numbered progress indicators when `progressIndicator.enabled = true`
7. Text in all layouts fits its container without overflow (fitText applied)

---

_Created: 2026-03-27_
