---
name: animations
description: Fundamental animation skills for Remotion
metadata:
  tags: animations, transitions, frames, useCurrentFrame
---

# Animation Fundamentals

All animations in Remotion MUST be driven by the `useCurrentFrame()` hook.

## Basic Pattern

```tsx
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return <div style={{ opacity }}>Hello World!</div>;
};
```

## Animation Units

- Write animations in **seconds** and multiply by `fps`
- Example: `2 * fps` means 2 seconds

## CRITICAL RESTRICTIONS

- **CSS transitions are FORBIDDEN** - they will not render correctly
- **CSS animations are FORBIDDEN** - they will not render correctly
- **Tailwind animation class names are FORBIDDEN** - they will not render correctly

## Common Animation Patterns

### Fade In/Out

```tsx
const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
  extrapolateRight: "clamp",
});
```

### Slide Animations

```tsx
// Slide from left
const translateX = interpolate(frame, [0, 1 * fps], [-100, 0], {
  extrapolateRight: "clamp",
});

// Slide from bottom
const translateY = interpolate(frame, [0, 0.8 * fps], [100, 0], {
  extrapolateRight: "clamp",
});
```

### Scale Animations

```tsx
const scale = interpolate(frame, [0, 0.5 * fps], [0.8, 1], {
  extrapolateRight: "clamp",
});
```
