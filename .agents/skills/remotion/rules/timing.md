---
name: timing
description: Interpolation curves in Remotion - linear, easing, spring animations
metadata:
  tags: spring, bounce, easing, interpolation
---

# Timing and Interpolation

## Linear Interpolation

```ts
import { interpolate } from "remotion";

const opacity = interpolate(frame, [0, 100], [0, 1]);
```

### Clamping

```ts
const opacity = interpolate(frame, [0, 100], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

## Spring Animations

Spring animations have natural motion:

```ts
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const scale = spring({ frame, fps });
```

### Physical Properties

Default: `mass: 1, damping: 10, stiffness: 100`

### Common Configurations

```tsx
const smooth = { damping: 200 }; // Smooth, no bounce
const snappy = { damping: 20, stiffness: 200 }; // Snappy
const bouncy = { damping: 8 }; // Bouncy entrance
const heavy = { damping: 15, stiffness: 80, mass: 2 }; // Heavy
```

### Delay

```tsx
const entrance = spring({
  frame: frame - ENTRANCE_DELAY,
  fps,
  delay: 20,
});
```

## Easing

```ts
import { interpolate, Easing } from "remotion";

const value = interpolate(frame, [0, 100], [0, 1], {
  easing: Easing.inOut(Easing.quad),
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

### Easing Types

- `Easing.in` - start slow, accelerate
- `Easing.out` - start fast, slow down
- `Easing.inOut` - both

### Curve Types

- `Easing.quad` - quadratic
- `Easing.sin` - sinusoidal
- `Easing.exp` - exponential
- `Easing.circle` - circular

### Custom Bezier

```ts
easing: Easing.bezier(0.8, 0.22, 0.96, 0.65);
```
