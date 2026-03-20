---
name: text-animations
description: Typography and text animation patterns for Remotion
metadata:
  tags: typography, text, typewriter, highlighter
---

# Text Animations

## Typewriter Effect

Always use string slicing for typewriter effects - never per-character opacity.

```tsx
const text = "Hello World";
const visibleText = text.slice(0, Math.floor(frame / 2));

return <div>{visibleText}</div>;
```

## Word Highlighting

Use highlight effect like a highlighter pen for emphasis.

## Text Scaling

```tsx
const scale = interpolate(frame, [0, 30], [1.2, 1], {
  extrapolateRight: "clamp",
});

return (
  <div style={{ transform: `scale(${scale})` }}>
    <h1>Title</h1>
  </div>
);
```

## Staggered Text Reveal

```tsx
const words = text.split(" ");
const visibleWords = words.filter((_, i) => frame >= i * 5);
```

## Font Sizing Guidelines

- Title: 80-100px
- Subtitle: 48-64px
- Body: 32-40px
- Caption: 24px

## Text Positioning

```tsx
const y = interpolate(frame, [0, 30], [50, 0], {
  extrapolateRight: "clamp",
});

return (
  <div style={{ transform: `translateY(${y}px)` }}>
    <h1>Title</h1>
  </div>
);
```
