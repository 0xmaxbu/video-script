# Phase 14: Animation Engine - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand from 1 animation type (fade-in) to 10+ types. Build centralized animation utility library consumed by layouts and layer renderers. Add Ken Burns, parallax, stagger, blur transitions, and kinetic typography. Target: AI Jason / WorldofAI quality level.

</domain>

<decisions>
## Implementation Decisions

### Animation Architecture

- **D-01:** Create centralized `animation-utils.ts` in `packages/renderer/src/utils/` — all layouts and layer components call unified animation functions
- **D-02:** AnimationConfigSchema keeps existing 4 fields (enter, enterDelay, exit, exitAt) — no schema expansion. Duration and spring config are determined by enter type internally
- **D-03:** Layouts partially consume AnimationConfigSchema — read `enter` type and `enterDelay` for overall entrance timing, but spring parameters are defined internally per layout (preserves each layout's visual style)
- **D-04:** Integrate useful components from Transitions.tsx into animation system — TypewriterText for code scenes, HighlightBox scale logic for annotations. Delete unused `Transition` wrapper. Keep `AnimatedNumber` as optional component

### Ken Burns + Parallax

- **D-05:** Ken Burns applies ONLY to screenshot-type visualLayers — does not affect code, text, or diagram layers
- **D-06:** Ken Burns zoom direction is auto-selected by scene type: intro=zoom-in, feature=zoom-out, code=none
- **D-07:** Parallax is automatic based on position.zIndex — higher zIndex elements move faster, lower zIndex move slower. No new schema fields needed
- **D-08:** Ken Burns and parallax coexistence is auto-selected by scene type: intro=both, feature=Ken Burns only, code=neither

### Scene Transitions

- **D-09:** Complete all 6 transition types in Composition.tsx — add missing flip, clockWipe, iris imports from `@remotion/transitions`
- **D-10:** Add blur transition using CSS filter (blur 25px→0 enter, 0→25px exit) — template-prompt-to-video pattern
- **D-11:** Transition duration stays fixed — intro/outro 30-45 frames, feature/code 30 frames
- **D-12:** Do NOT add `@remotion/motion-blur` package — defer to v2.0

### Kinetic Typography

- **D-13:** Per-word highlight subtitle system — current active word in white, inactive words dimmed
- **D-14:** Kinetic subtitles enabled globally for all scene types — simplified logic
- **D-15:** TTS timestamps from ElevenLabs are the sync source when available — static SRT as fallback
- **D-16:** AI Jason style subtitles — dark background, white text, yellow rounded-rect highlight on key phrases
- **D-17:** Preserve TypewriterText component for code scenes — does not conflict with kinetic subtitles

### Agent's Discretion

- Exact spring config values per enter type (snappy/smooth/soft presets)
- Ken Burns zoom scale range (suggested: 1.05→1.15, not aggressive)
- Parallax speed multipliers (suggested: 0.3x low, 0.6x high)
- Blur transition intensity and timing
- Stagger delay per item (suggested: 8-12 frames)

</decisions>

<specifics>
## Specific Ideas

- Reference: claude-remotion-kickstart's Caption component — per-word active highlighting with CSS transition-colors
- Reference: template-prompt-to-video's Ken Burns — EXTRA_SCALE=0.2, alternating zoom-in/zoom-out, Easing.inOut(ease)
- Reference: template-prompt-to-video's blur transition — CSS filter blur 25px, 1000ms duration
- Reference: AI Jason style — yellow rounded-rect callouts (#FFD700), dark mode, 5-8s fast cuts
- SPRING_PRESETS to define: snappy (damping:12, stiffness:100), smooth (damping:100, stiffness:200), soft (damping:100, stiffness:150), punchy (damping:100, stiffness:300)
- ENTER_ANIMATION_CONFIG mapping: fadeIn→smooth/15f, slideUp→smooth/12f, zoomIn→snappy/18f, typewriter→special

</specifics>

<canonical_refs>

## Canonical References

### Remotion Animation APIs

- `packages/renderer/src/remotion/layouts/` — All 8 layout components (animation patterns to update)
- `packages/renderer/src/remotion/components/Transitions.tsx` — Existing unused Transition, TypewriterText, HighlightBox, AnimatedNumber
- `packages/renderer/src/remotion/Composition.tsx` — TransitionSeries usage, getTransitionPresentation, transition type dispatch
- `packages/renderer/src/remotion/Scene.tsx` — Scene rendering flow, layout routing, InlineScene
- `packages/renderer/src/remotion/components/VisualLayerRenderer.tsx` — Layer type dispatch (screenshot→ScreenshotLayer, text→TextLayer, code→CodeLayer)

### Animation Config

- `packages/types/src/shared.ts` — AnimationConfigSchema (enter/enterDelay/exit/exitAt), VisualLayerSchema, PositionSchema
- `packages/renderer/src/types.ts` — Renderer-local zod v3 schemas, EffectSchema (9 unused effect types)
- `packages/renderer/src/remotion/components/ScreenshotLayer.tsx` — ONLY component fully implementing enter/exit animations
- `packages/renderer/src/remotion/components/TextLayer.tsx` — Partial animation (enter only, no exit)
- `packages/renderer/src/remotion/components/CodeLayer.tsx` — Partial animation (enter only, no exit)

### Transitions

- `packages/renderer/src/remotion-project-generator.ts` L350-430 — Generated code imports all 6 transitions (flip, clockWise, iris included)
- `packages/renderer/package.json` — Remotion dependencies (4.0.436), @remotion/transitions NOT declared but used via require

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `Transitions.tsx` TypewriterText (L136-172): frame-based text reveal with cursor — integrate into animation system
- `Transitions.tsx` HighlightBox (L97-127): spring scale + colored border — extract scale logic
- `Transitions.tsx` AnimatedNumber (L182-199): count-up with Easing — keep as optional
- `ScreenshotLayer.tsx` (L25-108): full enter/exit implementation — reference pattern for TextLayer/CodeLayer
- `CodeAnimation.tsx` (L77-107): keyframe-based zoom/pan interpolation — reference for Ken Burns

### Established Patterns

- Spring configs scattered across 5 presets (snappy/bouncy/standard/soft/punchy) — centralize into SPRING_PRESETS
- Stagger pattern exists in BulletList (10-frame) and FeatureSlide (5-frame) — extract to staggerDelay()
- enter/exit model only works in ScreenshotLayer — TextLayer and CodeLayer need exit animation support
- Composition.tsx uses `require()` for transitions (not proper imports) — fix to use proper imports

### Integration Points

- `animation-utils.ts` (new): consumed by all layouts via `useEnterAnimation()` hook
- `Scene.tsx` L202-255: layout routing — layouts receive scene.animation after update
- `Composition.tsx` L41-58: `getTransitionPresentation()` — add blur case + missing transition types
- `VisualLayerRenderer.tsx` L16-29: layer type dispatch — add Ken Burns to screenshot branch
- `packages/renderer/package.json`: add `@remotion/transitions` as explicit dependency

### Gap: EffectSchema (types.ts L210-234)

- Defines 9 effect types (codeHighlight, codeZoom, codePan, codeType, textFadeIn, textSlideIn, textZoomIn, sceneFade, sceneSlide, sceneZoom) — planned but completely unused
- Consider aligning with or replacing via the new animation-utils system

</code_context>

<deferred>
## Deferred Ideas

- `@remotion/motion-blur` package — defer to v2.0 for advanced motion blur
- Custom easing curves beyond spring — linearTiming sufficient for Phase 14
- EffectSchema (9 unused types in types.ts) — evaluate alignment with new animation system, may replace or deprecate
- Audio-synced animations — requires TTS pipeline (Phase 15+)
- Particle/shape decorative elements — v2.0 consideration

</deferred>

---

_Phase: 14-animation-engine_
_Context gathered: 2026-03-24_
