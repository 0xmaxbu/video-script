# Phase 4: Transitions - Research

**Researched:** 2026-03-22
**Domain:** Remotion video transitions and code animations
**Confidence:** HIGH

## Summary

This phase implements animated transitions between scenes and typewriter effects for code scenes. The project already has partial infrastructure in place: `TransitionSeries` from `@remotion/transitions` is integrated in `Composition.tsx`, and `Transitions.tsx` contains reusable `Transition`, `TypewriterText`, and `HighlightBox` components. However, several gaps exist: slide direction is fixed (not alternating per D-04), `CodeAnimation.tsx` uses CSS transitions instead of Remotion's `interpolate`, and zoom/pan camera effects for code scenes are not implemented.

**Primary recommendation:** Extend existing `Composition.tsx` to alternate slide direction based on scene index, refactor `CodeAnimation.tsx` to use Remotion's `interpolate` for zoom/pan instead of CSS scroll, and implement dynamic typewriter speed calculation based on code length and scene duration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Transition at Composition layer - Composition.tsx wraps all scenes with transition logic (centralized, consistent)
- **D-02:** Transition type by scene.type inference:
  - intro -> fade
  - outro -> fade
  - feature -> slide
  - code -> fade
- **D-03:** Transition duration by scene type:
  - intro/outro: 45 frames (~1.5s at 30fps) - more dramatic for open/close
  - feature/code: 30 frames (~1s at 30fps) - snappier for content
- **D-04:** Slide direction alternates:
  - Odd scenes: slide left-to-right
  - Even scenes: slide right-to-left
  - Creates a "back-and-forth" flow effect
- **D-05:** First scene: no enter transition - appears immediately
- **D-06:** Last scene: no exit transition - video ends directly
- **D-07:** Adjacent scenes: cross-fade transition - Scene A exits while Scene B enters simultaneously
- **D-08:** Typewriter speed: dynamic calculation - based on scene duration and code length, ensures all code is revealed within scene bounds
- **D-09:** Camera zoom + pan effect (not simple scroll):
  - Start: full code view (zoomed out, code may be small)
  - Then: zoom into key code segments (clear, but partial view)
  - Pan: move between key segments
  - Matches Phase 3 D-07 intent
- **D-10:** Line highlight timing: delayed - code fully revealed first, then highlights trigger based on narration timing
- **D-11:** Settling buffer: 30 frames - conservative buffer for spring animations to fully settle (based on damping=100)
- **D-12:** Settling frames only in final render - preview skips for responsiveness

### Claude's Discretion
- Exact spring config for transitions (use existing damping: 100, stiffness: 300 from Phase 1)
- Exact zoom/pan curves for code scenes
- Cross-fade overlap duration (half of exit duration recommended)

### Deferred Ideas (OUT OF SCOPE)
- Custom transition per scene (user-configurable via visual plan)
- 3D flip/rotate transitions
- Morphing transitions between similar layouts
- Syntax highlighting color transitions
- Code diff animations (before/after)
- Multiple code files with tab switching
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-08 | Scene transitions: fade, slideIn effects work correctly | Composition.tsx already uses TransitionSeries; slide() supports direction param; need to add alternating direction logic per D-04 |
| VIS-09 | Text animations: typewriter effect for code scenes | TypewriterText component exists; CodeAnimation uses typewriter with scroll; need zoom/pan refactor per D-09 and dynamic speed per D-08 |
| VIS-10 | Spring animations with proper delay handling | Spring config established (damping: 100, stiffness: 200-300); extrapolateRight: "clamp" pattern established; 30-frame settling buffer per D-11 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @remotion/transitions | 4.0.436 | TransitionSeries, fade, slide, wipe presentations | Official Remotion transition library, already integrated |
| remotion | 4.0.436 | spring, interpolate, useCurrentFrame, useVideoConfig | Core Remotion primitives for all animations |
| @remotion/bundler | 4.0.436 | Video bundling for rendering | Part of renderer package |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React | 19.2.4 | Component framework | All components |
| zod | 3.25.56 | Runtime type validation | Scene/transition schemas in types.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TransitionSeries | Custom Sequence with interpolate | TransitionSeries handles cross-fade timing automatically; custom would require manual frame calculation |
| CSS transition | Remotion interpolate | CSS transitions are not frame-accurate; interpolate provides deterministic rendering |

**Installation:**
Already installed in packages/renderer. No additional packages needed.

**Version verification:**
```
@remotion/transitions: 4.0.436 (verified in packages/renderer/node_modules)
remotion: 4.0.436 (peer dependency)
```

## Architecture Patterns

### Recommended Project Structure
```
packages/renderer/src/remotion/
├── Composition.tsx        # TransitionSeries orchestration (MODIFY)
├── Scene.tsx              # Individual scene rendering
├── components/
│   ├── Transitions.tsx    # Transition, TypewriterText, HighlightBox (EXISTS)
│   └── CodeAnimation.tsx  # Code typewriter with scroll (REFACTOR to zoom/pan)
└── layouts/
    └── CodeFocus.tsx      # Code scene layout (uses FrostedCard)
```

### Pattern 1: TransitionSeries with Alternating Slide Direction
**What:** Use scene index to alternate slide direction for visual rhythm
**When to use:** All feature-type scenes per D-04
**Example:**
```tsx
// Source: CONTEXT.md D-04 + existing Composition.tsx pattern
const getTransitionPresentation = (type: string, sceneIndex: number) => {
  switch (type) {
    case "fade":
      return fade();
    case "slide":
      // Alternate direction: odd scenes L->R, even scenes R->L
      return slide({
        direction: sceneIndex % 2 === 1 ? "from-left" : "from-right"
      });
    case "wipe":
      return wipe();
    default:
      return undefined;
  }
};
```

### Pattern 2: Spring Animation with Settling Buffer
**What:** Add 30-frame buffer for spring animations to fully settle
**When to use:** All spring-based animations, especially in final render
**Example:**
```tsx
// Source: CONTEXT.md D-11 + Phase 1 pattern
const SETTLING_BUFFER_FRAMES = 30;

const progress = spring({
  frame,
  fps,
  config: { damping: 100, stiffness: 300 },
});

// For final render, extend duration by settling buffer
const totalDuration = sceneDuration + SETTLING_BUFFER_FRAMES;
```

### Pattern 3: Camera Zoom/Pan with Interpolate
**What:** Replace CSS scroll with Remotion interpolate for zoom/pan effects
**When to use:** Code scenes requiring focus on specific segments
**Example:**
```tsx
// Source: CONTEXT.md D-09 + Remotion interpolate pattern
// Keyframes: [startFrame, zoomFrame, panFrame1, panFrame2, endFrame]
const scale = interpolate(
  frame,
  [0, 60, 120, 180, 240],
  [1.0, 1.5, 1.5, 1.5, 1.0],  // Zoom in, hold, zoom out
  { extrapolateRight: "clamp" }
);

const panX = interpolate(
  frame,
  [120, 180],
  [0, -200],  // Pan right-to-left
  { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
);

const transform = `scale(${scale}) translateX(${panX}px)`;
```

### Pattern 4: Dynamic Typewriter Speed Calculation
**What:** Calculate typewriter speed based on code length and scene duration
**When to use:** Code scenes to ensure all code reveals within bounds
**Example:**
```tsx
// Source: CONTEXT.md D-08
const calculateTypewriterSpeed = (
  codeLength: number,
  sceneDurationFrames: number,
  fps: number
): number => {
  // Speed = chars per frame
  // Reserve 20% of scene for settling/pause after reveal
  const effectiveFrames = sceneDurationFrames * 0.8;
  return Math.max(1, Math.ceil(codeLength / effectiveFrames));
};
```

### Anti-Patterns to Avoid
- **CSS transitions in Remotion:** `transition: "transform 0.1s ease-out"` is non-deterministic across renders. Use `interpolate()` instead.
- **Fixed typewriter speed:** Long code with fixed speed may not finish. Always calculate dynamically per D-08.
- **Ignoring spring settling:** Springs may not reach 1.0 exactly at end frame. Add 30-frame buffer per D-11.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scene cross-fade | Custom opacity interpolate with timing logic | TransitionSeries with fade() presentation | Handles timing overlap automatically, tested edge cases |
| Spring animation | Custom easing function | Remotion spring() with damping/stiffness | Physically accurate, frame-deterministic |
| Slide direction | Hardcoded "from-left" | slide({ direction: "from-left" | "from-right" }) | @remotion/transitions already supports direction param |

**Key insight:** The @remotion/transitions library already provides the primitives needed (fade, slide with direction). The work is integration, not building new transition effects.

## Common Pitfalls

### Pitfall 1: CSS Transitions in Remotion
**What goes wrong:** Using CSS `transition` property causes non-deterministic rendering - same frame may look different across renders
**Why it happens:** CSS transitions are browser-timed, not frame-accurate
**How to avoid:** Always use Remotion's `interpolate()` for all animated values
**Warning signs:** Seeing `transition:` in style objects within Remotion components

### Pitfall 2: Missing extrapolateRight: "clamp"
**What goes wrong:** Values exceed intended range, causing visual glitches (negative opacity, transforms beyond bounds)
**Why it happens:** interpolate defaults to extrapolating beyond input range
**How to avoid:** Always include `{ extrapolateRight: "clamp" }` (or extrapolateLeft for bidirectional)
**Warning signs:** Visual artifacts at animation boundaries, values < 0 or > 1

### Pitfall 3: First/Last Scene Transition
**What goes wrong:** First scene fades in from black, last scene fades to black unexpectedly
**Why it happens:** Applying enter/exit transitions to all scenes uniformly
**How to avoid:** Skip enter transition for first scene (D-05), skip exit transition for last scene (D-06)
**Warning signs:** Unwanted black frames at video start/end

### Pitfall 4: Typewriter Speed Too Fast/Slow
**What goes wrong:** Code finishes revealing too early (awkward pause) or doesn't finish (cut off)
**Why it happens:** Fixed speed doesn't adapt to code length
**How to avoid:** Calculate speed dynamically: `speed = codeLength / (sceneFrames * 0.8)` per D-08
**Warning signs:** Empty cursor blinking for extended time, or code cut off mid-reveal

### Pitfall 5: Spring Not Settled
**What goes wrong:** Animation appears complete but spring hasn't fully settled (value ~0.99 not 1.0)
**Why it happens:** Spring asymptotically approaches 1.0, never reaching it exactly
**How to avoid:** Add 30-frame settling buffer for final render per D-11
**Warning signs:** Subtle "bounce" at animation end, or slight position offset

## Code Examples

### Scene Transition with Alternating Direction
```tsx
// Source: CONTEXT.md D-04 + existing Composition.tsx
// In Composition.tsx, modify getTransitionPresentation:

const getTransitionPresentation = (type: string, sceneIndex: number) => {
  switch (type) {
    case "fade":
      return fade();
    case "slide":
      return slide({
        direction: sceneIndex % 2 === 1 ? "from-left" : "from-right"
      });
    case "wipe":
      return wipe();
    default:
      return undefined;
  }
};

// In TransitionSeries render:
<TransitionSeries.Transition
  timing={linearTiming({
    durationInFrames: getTransitionDuration(scene.type), // D-03
  })}
  presentation={getTransitionPresentation(transition.type, index)}
/>
```

### Transition Duration by Scene Type
```tsx
// Source: CONTEXT.md D-03
const getTransitionDuration = (
  sceneType: "intro" | "outro" | "feature" | "code",
  fps: number
): number => {
  switch (sceneType) {
    case "intro":
    case "outro":
      return 45; // ~1.5s at 30fps
    case "feature":
    case "code":
      return 30; // ~1s at 30fps
    default:
      return 30;
  }
};
```

### Code Zoom/Pan Refactor
```tsx
// Source: CONTEXT.md D-09 + Remotion interpolate pattern
// Replace CodeAnimation.tsx scroll with zoom/pan:

interface ZoomPanKeyframe {
  frame: number;
  scale: number;
  panX: number;
  panY: number;
}

export const CodeAnimation: React.FC<CodeAnimationProps> = ({
  code,
  zoomPanKeyframes = [], // Provided by scene data
  ...props
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom/pan interpolation
  const scale = interpolate(
    frame,
    zoomPanKeyframes.map(k => k.frame),
    zoomPanKeyframes.map(k => k.scale),
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const panX = interpolate(
    frame,
    zoomPanKeyframes.map(k => k.frame),
    zoomPanKeyframes.map(k => k.panX),
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const panY = interpolate(
    frame,
    zoomPanKeyframes.map(k => k.frame),
    zoomPanKeyframes.map(k => k.panY),
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill style={{
      transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
      // NO CSS transition property!
    }}>
      {/* Code content */}
    </AbsoluteFill>
  );
};
```

### First/Last Scene Handling
```tsx
// Source: CONTEXT.md D-05, D-06
// In Composition.tsx:

{script.scenes.map((scene, index) => {
  const isFirst = index === 0;
  const isLast = index === script.scenes.length - 1;

  return (
    <React.Fragment key={scene.id}>
      <TransitionSeries.Sequence durationInFrames={durationInFrames}>
        <Scene scene={scene} imagePaths={images} />
      </TransitionSeries.Sequence>

      {/* No transition after last scene */}
      {!isLast && transition && transition.type !== "none" && (
        <TransitionSeries.Transition
          timing={linearTiming({
            durationInFrames: getTransitionDuration(scene.type, fps),
          })}
          presentation={getTransitionPresentation(transition.type, index)}
        />
      )}
    </React.Fragment>
  );
})}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS transitions | Remotion interpolate | Phase 1 (established) | Frame-accurate, deterministic rendering |
| Fixed slide direction | Alternating direction | Phase 4 (this phase) | Visual rhythm, back-and-forth flow |
| CSS scroll for code | Zoom/pan camera effect | Phase 4 (this phase) | Guides viewer attention to key code segments |
| Fixed typewriter speed | Dynamic calculation | Phase 4 (this phase) | Reliable code reveal timing |

**Deprecated/outdated:**
- CSS `transition` property in Remotion components: Use `interpolate()` instead
- Fixed animation durations: Use spring-based with settling buffer

## Open Questions

1. **Zoom/Pan Keyframe Data Structure**
   - What we know: D-09 describes zoom/pan effect (start zoomed out, zoom in, pan between segments)
   - What's unclear: Where do keyframes come from? Scene data? Computed from code analysis?
   - Recommendation: Start with simple default keyframes (zoom to center, no pan), allow scene data override

2. **Cross-Fade Overlap Duration**
   - What we know: D-07 says adjacent scenes cross-fade
   - What's unclear: Exact overlap duration (Claude's discretion suggests "half of exit duration")
   - Recommendation: Start with 50% overlap (15 frames for feature/code, 22 for intro/outro)

## Sources

### Primary (HIGH confidence)
- CONTEXT.md D-01 through D-12 - Locked implementation decisions
- packages/renderer/src/remotion/Composition.tsx - Existing TransitionSeries integration
- packages/renderer/src/remotion/components/Transitions.tsx - Existing transition components
- packages/renderer/src/remotion/components/CodeAnimation.tsx - Current code animation implementation
- packages/renderer/src/types.ts - SceneTransition and SceneNarrativeType schemas

### Secondary (MEDIUM confidence)
- .planning/phases/01-annotation-renderer/01-CONTEXT.md - Spring config (damping: 100, stiffness: 300)
- .planning/REQUIREMENTS.md - VIS-08, VIS-09, VIS-10 requirements

### Tertiary (LOW confidence)
- None - all findings verified against project source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use
- Architecture: HIGH - Existing patterns well-established, gaps clearly identified
- Pitfalls: HIGH - Based on Remotion best practices and existing project patterns

**Research date:** 2026-03-22
**Valid until:** 30 days (stable Remotion API)
