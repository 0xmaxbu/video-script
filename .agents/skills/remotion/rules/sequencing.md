---
name: sequencing
description: Sequencing patterns for Remotion - delay, trim, limit duration of items
metadata:
  tags: sequence, series, timing, delay, trim
---

# Sequencing Patterns

## Sequence Component

Use `<Sequence>` to delay when an element appears:

```tsx
import { Sequence, useVideoConfig } from "remotion";

const { fps } = useVideoConfig();

<Sequence from={1 * fps} durationInFrames={2 * fps} premountFor={1 * fps}>
  <Title />
</Sequence>;
```

### Layout Prop

```tsx
// No wrapper element
<Sequence layout="none">
  <Title />
</Sequence>
```

### Premounting

Always premount Sequences!

```tsx
<Sequence premountFor={1 * fps}>
  <Title />
</Sequence>
```

## Series Component

Use `<Series>` for sequential playback without overlap:

```tsx
import { Series } from "remotion";

<Series>
  <Series.Sequence durationInFrames={45}>
    <Intro />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60}>
    <MainContent />
  </Series.Sequence>
  <Series.Sequence durationInFrames={30}>
    <Outro />
  </Series.Sequence>
</Series>;
```

### Overlapping with Negative Offset

```tsx
<Series>
  <Series.Sequence durationInFrames={60}>
    <SceneA />
  </Series.Sequence>
  <Series.Sequence offset={-15} durationInFrames={60}>
    {/* Starts 15 frames before SceneA ends */}
    <SceneB />
  </Series.Sequence>
</Series>
```

## Frame References Inside Sequences

Inside a Sequence, `useCurrentFrame()` returns local frame (starting from 0):

```tsx
<Sequence from={60} durationInFrames={30}>
  <MyComponent />
  {/* useCurrentFrame() returns 0-29, not 60-89 */}
</Sequence>
```

## Nested Sequences

```tsx
<Sequence from={0} durationInFrames={120}>
  <Background />
  <Sequence from={15} durationInFrames={90} layout="none">
    <Title />
  </Sequence>
  <Sequence from={45} durationInFrames={60} layout="none">
    <Subtitle />
  </Sequence>
</Sequence>
```
