---
name: remotion-best-practices
description: Best practices for Remotion - Video creation in React. Use this skill when generating video scripts with visualLayers to create professional animations, transitions, and compositions.
metadata:
  tags: remotion, video, react, animation, composition, transitions, sequencing
---

# Remotion Best Practices Skill

## When to use

Use this skill whenever you are generating video scripts with visualLayers to obtain domain-specific knowledge about creating professional Remotion videos.

## Core Principles

### 1. All animations MUST be driven by `useCurrentFrame()` hook

```tsx
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

const FadeIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return <div style={{ opacity }}>Hello World!</div>;
};
```

**CRITICAL**:

- CSS transitions or animations are FORBIDDEN - they will not render correctly
- Tailwind animation class names are FORBIDDEN - they will not render correctly
- Write animations in seconds and multiply by `fps` value from `useVideoConfig()`

### 2. Use spring animations for natural motion

```tsx
import { spring } from "remotion";

// Recommended: smooth, no bounce
const smooth = { damping: 200 };

// Snappy, minimal bounce
const snappy = { damping: 20, stiffness: 200 };

// Bouncy entrance
const bouncy = { damping: 8 };

const scale = spring({ frame, fps, config: smooth });
```

### 3. Sequence elements for timeline control

```tsx
import { Sequence, Series } from "remotion";

// Sequence: delay when element appears
<Sequence from={1 * fps} durationInFrames={2 * fps} premountFor={1 * fps}>
  <Title />
</Sequence>

// Series: elements play one after another
<Series>
  <Series.Sequence durationInFrames={45}>
    <Intro />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60}>
    <MainContent />
  </Series.Sequence>
</Series>
```

## visualLayers Animation Guidelines

When defining `visualLayers` animations, follow these patterns:

### Enter Animations

```typescript
visualLayers: [
  {
    id: "layer-1",
    type: "screenshot",
    position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
    content: "https://example.com",
    animation: {
      enter: "slideUp", // slideUp, slideDown, slideLeft, slideRight
      enterDelay: 0, // seconds
      exit: "fadeOut", // fadeOut, slideOut, zoomOut
    },
  },
];
```

### Animation Timing Patterns

For professional video quality, use these timing patterns:

| Effect        | Enter Duration | Enter Delay | Exit    |
| ------------- | -------------- | ----------- | ------- |
| Subtle reveal | 0.5s           | 0s          | fadeOut |
| Slide in      | 0.8s           | 0s          | fadeOut |
| Zoom in       | 0.6s           | 0.2s        | zoomOut |
| Typewriter    | 2-3s           | 0s          | fadeOut |

### Layer Staggering

Create depth by staggering layer animations:

```typescript
visualLayers: [
  {
    id: "background",
    animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
  },
  {
    id: "content",
    animation: { enter: "slideUp", enterDelay: 0.3, exit: "fadeOut" },
  },
  {
    id: "overlay",
    animation: { enter: "zoomIn", enterDelay: 0.6, exit: "fadeOut" },
  },
];
```

## Scene Transitions

For transitions between scenes, use professional patterns:

### Fade Transition

```tsx
import { fade } from "@remotion/transitions/fade";

<TransitionSeries.Transition
  presentation={fade()}
  timing={linearTiming({ durationInFrames: 15 })}
/>;
```

### Slide Transition

```tsx
import { slide } from "@remotion/transitions/slide";

<TransitionSeries.Transition
  presentation={slide({ direction: "from-left" })}
  timing={linearTiming({ durationInFrames: 20 })}
/>;
```

Available directions: `"from-left"`, `"from-right"`, `"from-top"`, `"from-bottom"`

### Duration Calculation

Transitions overlap adjacent scenes, so total duration is **SHORTER** than sum of sequences:

- Without transition: `60 + 60 = 120` frames
- With transition: `60 + 60 - 15 = 105` frames

## Text Animations

### Typewriter Effect

Use string slicing for typewriter effects - never per-character opacity.

### Word Highlighting

Use highlight effect like a highlighter pen for emphasis.

## Reference Files

- [rules/animations.md](rules/animations.md) - Fundamental animation skills
- [rules/transitions.md](rules/transitions.md) - Scene transition patterns
- [rules/sequencing.md](rules/sequencing.md) - Timeline sequencing patterns
- [rules/timing.md](rules/timing.md) - Interpolation curves and spring animations
- [rules/text-animations.md](rules/text-animations.md) - Typography and text animations
