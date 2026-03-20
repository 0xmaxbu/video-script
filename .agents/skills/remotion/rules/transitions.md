---
name: transitions
description: Scene transitions and overlays for Remotion using TransitionSeries.
metadata:
  tags: transitions, overlays, fade, slide, wipe, scenes
---

# Scene Transitions

## TransitionSeries

`<TransitionSeries>` arranges scenes and supports two ways to enhance cuts:

- **Transitions** - crossfade, slide, wipe between two scenes (shortens timeline)
- **Overlays** - render an effect on top of the cut point (no timeline impact)

## Prerequisites

```bash
npx remotion add @remotion/transitions
```

## Transition Example

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>;
```

## Available Transition Types

```tsx
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
```

## Slide Direction

```tsx
import { slide } from "@remotion/transitions/slide";

<TransitionSeries.Transition
  presentation={slide({ direction: "from-left" })}
  timing={linearTiming({ durationInFrames: 20 })}
/>;
```

Directions: `"from-left"`, `"from-right"`, `"from-top"`, `"from-bottom"`

## Timing Options

```tsx
import { linearTiming, springTiming } from "@remotion/transitions";

// Linear - constant speed
linearTiming({ durationInFrames: 20 });

// Spring - organic motion
springTiming({ config: { damping: 200 }, durationInFrames: 25 });
```

## Duration Calculation

Transitions overlap scenes, so total is **SHORTER**:

- Without: `60 + 60 = 120` frames
- With transition: `60 + 60 - 15 = 105` frames

Overlays do **NOT** affect total duration.
