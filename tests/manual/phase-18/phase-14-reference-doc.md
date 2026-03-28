# Phase 14 Animation Engine - Reference Material

---

## File 1: 14-CONTEXT.md

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


---

## File 2: Composition.tsx

```tsx
import React from "react";
import { useVideoConfig, AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { iris } from "@remotion/transitions/iris";
import { ScriptOutput, SceneNarrativeType } from "../types";
import { Scene } from "./Scene";

const BlurTransition: React.FC<{
  presentationProgress: number;
  children: React.ReactNode;
}> = ({ presentationProgress, children }) => {
  const blurAmount = Math.round((1 - presentationProgress) * 25);
  return (
    <AbsoluteFill style={{ filter: `blur(${blurAmount}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

const blurPresentation: TransitionPresentation<{}> = {
  component: BlurTransition,
  props: {},
};

const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;

export interface VideoCompositionProps {
  script: ScriptOutput;
  images?: Record<string, string>;
  showSubtitles?: boolean;
}

const getTransitionDuration = (sceneType: SceneNarrativeType): number => {
  switch (sceneType) {
    case "intro":
    case "outro":
      return 45;
    case "feature":
    case "code":
    default:
      return 30;
  }
};

const getTransitionPresentation = (type: string, sceneIndex: number) => {
  switch (type) {
    case "fade":
      return fade();
    case "slide":
      return slide({
        direction: sceneIndex % 2 === 1 ? "from-left" : "from-right",
      });
    case "wipe":
      return wipe();
    case "flip":
      return flip();
    case "clockWipe":
      return clockWipe({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
    case "iris":
      return iris({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
    case "blur":
      return blurPresentation;
    default:
      return fade();
  }
};

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  script,
  images,
  showSubtitles = false,
}) => {
  const { fps } = useVideoConfig();

  if (!script || !script.scenes) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "red",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: 50,
        }}
      >
        No Script Data
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <TransitionSeries>
        {script.scenes.map((scene, index) => {
          const durationInFrames = Math.ceil(scene.duration * fps);
          const transition = scene.transition;
          const isLast = index === script.scenes.length - 1;

          return (
            <React.Fragment key={scene.id}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                <Scene
                  scene={scene}
                  imagePaths={images}
                  annotations={scene.annotations}
                  showSubtitles={showSubtitles}
                />
              </TransitionSeries.Sequence>
              {!isLast && transition && transition.type !== "none" && (
                <TransitionSeries.Transition
                  timing={linearTiming({
                    durationInFrames: getTransitionDuration(scene.type),
                  })}
                  presentation={
                    getTransitionPresentation(
                      transition.type,
                      index,
                    ) as TransitionPresentation<{}>
                  }
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
```

---

## File 3: ScreenshotLayer.tsx

```tsx
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { VisualLayer, SceneNarrativeType, Annotation } from "../../types.js";
import {
  useKenBurns,
  useAdvancedKenBurns,
  useWebPagePan,
  useParallax,
  useEnterAnimation,
  useExitAnimation,
} from "../../utils/animation-utils.js";
import { AnnotationRenderer } from "../annotations/AnnotationRenderer.js";

interface ScreenshotLayerProps {
  layer: VisualLayer;
  imagePath: string | undefined;
  sceneType?: SceneNarrativeType;
  /** Scene-level annotations to render relative to this screenshot (inside transform) */
  sceneAnnotations: Annotation[] | undefined;
}

export const ScreenshotLayer: React.FC<ScreenshotLayerProps> = ({
  layer,
  imagePath,
  sceneType,
  sceneAnnotations,
}) => {
  const {
    content,
    position,
    animation,
    kenBurnsWaypoints,
    naturalSize,
    annotations,
  } = layer;

  const enter = useEnterAnimation(animation);
  const exit = useExitAnimation(animation);

  // Web-page pan: always call hooks unconditionally (React rules)
  const webPan = useWebPagePan(
    kenBurnsWaypoints ?? [],
    naturalSize ?? { width: 1920, height: 1080 },
  );

  // Traditional Ken Burns (used when naturalSize is NOT set)
  const advancedKB = useAdvancedKenBurns(kenBurnsWaypoints ?? []);
  const simpleKB = useKenBurns(sceneType ?? "feature");
  const parallax = useParallax(position.zIndex);

  const opacity =
    exit.opacity !== undefined
      ? Math.min(enter.opacity, exit.opacity)
      : enter.opacity;

  // imagePath is a filename (e.g. "scene-001-foo.png") served from public/
  const imageSrc = imagePath ? staticFile(imagePath) : content;

  // Merge layer-level and scene-level annotations for rendering inside the transform group
  const allAnnotations = [
    ...(annotations ?? []),
    ...(sceneAnnotations ?? []),
  ];
  const hasAnnotations = allAnnotations.length > 0;

  // ── Web-page pan mode (naturalSize present) ────────────────────────────────
  // Display the screenshot at 1:1 pixel scale inside an overflow:hidden
  // container.  The `webPan` hook pans/zooms using CSS transform.
  if (naturalSize) {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          overflow: "hidden",
          opacity,
          zIndex: position.zIndex,
        }}
      >
        {/* Transform group: both image and annotations pan/zoom together */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: naturalSize.width,
            height: naturalSize.height,
            transform: `translate(${webPan.translateX}px, ${webPan.translateY}px) scale(${webPan.scale})`,
            transformOrigin: "0 0",
          }}
        >
          <Img
            src={imageSrc}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: naturalSize.width,
              height: naturalSize.height,
            }}
          />
          {hasAnnotations && (
            <AnnotationRenderer annotations={allAnnotations} />
          )}
        </div>
      </div>
    );
  }

  // ── Traditional Ken Burns mode ─────────────────────────────────────────────
  const useAdvanced =
    kenBurnsWaypoints !== undefined && kenBurnsWaypoints.length > 0;

  const kbScale = useAdvanced
    ? advancedKB.scale
    : sceneType === "intro" || sceneType === "feature"
      ? simpleKB.scale
      : 1;

  const kbTranslateX = useAdvanced ? advancedKB.translateX : 0;
  const kbTranslateY = useAdvanced ? advancedKB.translateY : 0;

  const pTranslateX =
    !useAdvanced && sceneType === "intro" ? parallax.translateX : 0;
  const pTranslateY =
    !useAdvanced && sceneType === "intro" ? parallax.translateY : 0;

  const translateX =
    enter.translateX + exit.translateX + pTranslateX + kbTranslateX;
  const translateY =
    enter.translateY + exit.translateY + pTranslateY + kbTranslateY;
  const scale =
    exit.scale !== undefined ? Math.min(enter.scale, exit.scale) : enter.scale;
  const finalScale = scale * kbScale;

  const centerXOffset = position.x === "center" ? "-50%" : "0";
  const centerYOffset = position.y === "center" ? "-50%" : "0";

  const style: React.CSSProperties = {
    position: "absolute",
    left:
      typeof position.x === "number"
        ? position.x
        : position.x === "left"
          ? 0
          : position.x === "center"
            ? "50%"
            : "auto",
    right: position.x === "right" ? 0 : undefined,
    top:
      typeof position.y === "number"
        ? position.y
        : position.y === "top"
          ? 0
          : position.y === "center"
            ? "50%"
            : "auto",
    bottom: position.y === "bottom" ? 0 : undefined,
    width:
      position.width === "full"
        ? "100%"
        : position.width === "auto"
          ? "auto"
          : position.width,
    height:
      position.height === "full"
        ? "100%"
        : position.height === "auto"
          ? "auto"
          : position.height,
    zIndex: position.zIndex,
    transform: `translate(calc(${centerXOffset} + ${translateX}px), calc(${centerYOffset} + ${translateY}px)) scale(${finalScale})`,
    transformOrigin: "center center",
    opacity,
  };

  return (
    <AbsoluteFill style={style}>
      <Img
        src={imageSrc}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      {hasAnnotations && (
        <AnnotationRenderer annotations={allAnnotations} />
      )}
    </AbsoluteFill>
  );
};
```

---

## File 4: KineticSubtitle.tsx

```tsx
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

interface KineticSubtitleProps {
  text: string;
  wordTimestamps?: Array<{ word: string; start: number; end: number }>;
}

export const KineticSubtitle: React.FC<KineticSubtitleProps> = ({
  text,
  wordTimestamps,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (!text) return null;

  const words = text.split(/\s+/);
  if (words.length === 0) return null;

  if (words.length === 1) {
    return (
      <div style={containerStyle}>
        <span style={activeWordStyle}>{words[0]}</span>
      </div>
    );
  }

  let activeIndex: number;

  if (wordTimestamps && wordTimestamps.length > 0) {
    const currentTime = frame / fps;
    activeIndex = wordTimestamps.findIndex(
      (ts) => currentTime >= ts.start && currentTime < ts.end,
    );
    if (activeIndex === -1) {
      const lastTs = wordTimestamps[wordTimestamps.length - 1];
      activeIndex = currentTime >= lastTs.end ? words.length - 1 : 0;
    }
  } else {
    activeIndex = Math.min(
      Math.floor((frame / durationInFrames) * words.length),
      words.length - 1,
    );
  }

  return (
    <div style={containerStyle}>
      {words.map((word, i) => {
        let style: React.CSSProperties;
        if (i === activeIndex) {
          style = activeWordStyle;
        } else if (i < activeIndex) {
          style = pastWordStyle;
        } else {
          style = futureWordStyle;
        }

        return (
          <span key={i} style={style}>
            {word}{" "}
          </span>
        );
      })}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 80,
  left: "50%",
  transform: "translateX(-50%)",
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  padding: "16px 32px",
  borderRadius: 12,
  maxWidth: "80%",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  zIndex: 100,
};

const baseWordStyle: React.CSSProperties = {
  fontSize: 36,
  fontFamily: "sans-serif",
};

const activeWordStyle: React.CSSProperties = {
  ...baseWordStyle,
  color: "white",
  backgroundColor: "rgba(255, 215, 0, 0.3)",
  borderRadius: 4,
  padding: "2px 6px",
};

const pastWordStyle: React.CSSProperties = {
  ...baseWordStyle,
  color: "rgba(255, 255, 255, 0.5)",
};

const futureWordStyle: React.CSSProperties = {
  ...baseWordStyle,
  color: "rgba(255, 255, 255, 0.25)",
};
```

---

## File 5: 14-GAP-06-SUMMARY.md

---
phase: 14-animation-engine
plan: GAP-06
status: complete
gaps_closed: [ANIM-01, ANIM-03, ANIM-04, ANIM-05, ANIM-06]
---

# GAP-06 Summary: Phase 14 Gap Closure

## What Was Done

Closed all 4 remaining verification gaps from VERIFICATION.md.

### Task 1: Code Fixes

**Fix 1 — ENTER_ANIMATION_CONFIG export (ANIM-01)**

- File: `packages/renderer/src/utils/animation-utils.ts` line 23
- Change: `const ENTER_ANIMATION_CONFIG` → `export const ENTER_ANIMATION_CONFIG`
- One token added. Now importable by consumers.

**Fix 2 — KineticSubtitle word spacing (ANIM-06)**

- File: `packages/renderer/src/remotion/components/KineticSubtitle.tsx`
- Removed `gap: "4px 2px"` from containerStyle (CSS gap doesn't work in Playwright headless)
- Added `{" "}` trailing space after each word in the `words.map()` return
- Words now render with visible whitespace between them in rendered video

### Task 2: Test Fixture Enhancements

**Screenshot layer (ANIM-03, ANIM-04 — Ken Burns + Parallax)**

- File: `tests/e2e/video-playback-test/script.json` scene-2
- Added `"type": "screenshot"`, `"id": "hero-screenshot"` visualLayer
- Created: `tests/e2e/video-playback-test/screenshots/scene-002-hero-screenshot.png` (800×450 PNG, 2137 bytes via ffmpeg)
- Screenshot finder resolves by `scene-002-hero-screenshot.png` naming convention

**Bullet-list layers (ANIM-05 — Stagger)**

- File: `tests/e2e/video-playback-test/script.json` scene-3 (outro)
- Added 3 `"type": "text"` visualLayers: enterDelay 0/0.3/0.6s for stagger
- sceneAdapter converts text layers → bullet textElements → BulletList stagger renders

## Verification Results

All Task 1 checks passed:

- `export const ENTER_ANIMATION_CONFIG` grep match ✓
- `gap:` removed from KineticSubtitle ✓
- `{" "}` trailing space present ✓

All Task 2 checks passed:

- scene-2 screenshot layer: true ✓
- scene-3 text layers: 3 ✓
- PNG exists with valid signature ✓

E2E compose: `node dist/cli/index.js compose tests/e2e/video-playback-test/` → success ✓

- Output: 1920×1080 @ 30fps, 30s, 3 scenes
- Frame 390 avg luma: 26.86 (non-black) ✓
- Frame 750 avg luma: 27.46 (non-black) ✓
- TypeScript: 0 new errors ✓
