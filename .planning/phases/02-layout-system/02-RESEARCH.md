# Phase 2: Layout System - Research

**Researched:** 2026-03-22
**Domain:** Remotion/React CSS layout system (12-column grid + frosted glass)
**Confidence:** HIGH

## Summary

Phase 2 implements a professional PPT-style layout system for the Remotion-based video renderer. The system uses a 12-column grid with safe zones (120px/80px), frosted glass cards (25px blur, 20% opacity, 32px radius), and proper typographic hierarchy (80/60/36pt titles, 24/20/16pt body). All 8 existing layouts (HeroFullscreen, SplitHorizontal, SplitVertical, TextOverImage, CodeFocus, Comparison, BulletList, Quote) will be refactored to use a shared `Grid` wrapper component and `FrostedCard` component. The existing `LayoutProps` interface (`scene: VisualScene, screenshots: Map<string, string>`) is preserved; only the internal layout implementation changes.

**Primary recommendation:** Create `Grid` and `FrostedCard` as reusable components that wrap existing layout content, then refactor each of the 8 layouts to use grid positioning helpers.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 12-column grid system
- **D-02:** Safe zones: left/right 120px, top/bottom 80px
- **D-03:** Gutter width: 24px
- **D-04:** Video resolution: 1920x1080 (16:9)
- **D-05:** backdrop-filter blur: 25px
- **D-06:** Background opacity: 20%
- **D-07:** Border radius: 32px
- **D-08:** Background color: theme-based (dynamic based on content tone)
- **D-09:** Frosted glass wrapper component: `<FrostedCard>` with backdrop-filter
- **D-10:** Title sizes: 80pt (hero), 60pt (section), 36pt (card)
- **D-11:** Body sizes: 24pt (primary), 20pt (secondary), 16pt (caption)
- **D-12:** Font family: system sans-serif (or inherit from layout)
- **D-13:** Refactor ALL 8 existing layouts to use grid system
- **D-14:** Grid as Wrapper component: `<Grid>{children}</Grid>` auto-handles positioning
- **D-15:** Layouts: HeroFullscreen, SplitHorizontal, SplitVertical, TextOverImage, CodeFocus, Comparison, BulletList, Quote
- **D-16:** Create Grid component with 12-column layout logic
- **D-17:** Create FrostedCard component with backdrop-filter
- **D-18:** Helper functions for grid positioning: getGridColumn(), getGridSpan()
- **D-19:** Layouts use Grid + FrostedCard for consistent spacing and visuals

### Claude's Discretion

- Specific implementation approach for Grid component (absolute positioning within grid vs CSS grid display)
- Animation timing/approach within Grid (already standardized on spring damping: 100, stiffness: 200-300)
- How to handle layouts that don't fit standard grid patterns ( Quote layout may need special handling)

### Deferred Ideas (OUT OF SCOPE)

- Custom font family selection -- system fonts for now
- Layout animation variants -- basic refactor first
- Theme color extraction automation -- manual theme for now
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-04 | Grid-based layout system with safe zones (12-column) | Grid component with 12 columns, safe zone calculations, getGridColumn/getGridSpan helpers |
| VIS-05 | Layout templates: hero-fullscreen, comparison, split-vertical, bullet-list, text-over-image | All 8 layouts refactored to use Grid wrapper; template names unchanged |
| VIS-06 | PPT-style visual hierarchy (headlines 72pt+, body 18-24pt) | Typography scale: 80/60/36pt titles, 24/20/16pt body (slightly larger than spec minimum) |
| VIS-07 | Frosted glass cards with backdrop-filter effects | FrostedCard component with backdrop-filter: blur(25px), background opacity 20%, border-radius 32px |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| remotion | 4.0.436 | React-based video rendering | Project standard; used for all existing layouts |
| react | 19.2.4 | UI components | Bundled with remotion |
| TypeScript | 5.9.3 | Type safety | Project standard |

**No additional packages required.** The grid system and frosted glass are implemented with native CSS (Flexbox + backdrop-filter) within existing Remotion components.

---

## Architecture Patterns

### Recommended Project Structure

```
packages/renderer/src/remotion/
├── layouts/
│   ├── index.ts                    # LayoutProps, getLayoutComponent()
│   ├── Grid.tsx                    # NEW: 12-column grid wrapper
│   ├── FrostedCard.tsx             # NEW: Frosted glass card
│   ├── grid-utils.ts               # NEW: getGridColumn(), getGridSpan(), grid constants
│   ├── HeroFullscreen.tsx          # REFACTORED: uses Grid + FrostedCard
│   ├── SplitHorizontal.tsx          # REFACTORED
│   ├── SplitVertical.tsx           # REFACTORED
│   ├── TextOverImage.tsx           # REFACTORED
│   ├── CodeFocus.tsx               # REFACTORED
│   ├── Comparison.tsx              # REFACTORED
│   ├── BulletList.tsx              # REFACTORED
│   └── Quote.tsx                   # REFACTORED
└── ...
```

### Pattern 1: Grid Wrapper Component

**What:** A `Grid` wrapper that establishes the 12-column layout with safe zones and provides positioning context for children.

**When to use:** Every layout wraps its content in `<Grid>` to get consistent margins and column calculations.

**Implementation approach:**
- Uses `AbsoluteFill` as base container
- Safe zone padding: `padding: 80px 120px` (top/bottom, left/right)
- 12 columns with 24px gutter via CSS Flexbox or absolute positioning
- Helper functions calculate column positions as percentages

**Key constants (from grid-utils.ts):**
```typescript
export const GRID = {
  columns: 12,
  safeZone: { top: 80, right: 120, bottom: 80, left: 120 },
  gutter: 24,
  // Available width = 1920 - 120 - 120 = 1680px
  // Column width = (1680 - 24 * 11) / 12 = 132px
} as const;
```

### Pattern 2: FrostedCard Component

**What:** A glass-morphism card using `backdrop-filter: blur(25px)` with configurable opacity and radius.

**When to use:** When displaying content in a semi-transparent card over backgrounds (images, gradients).

**Implementation:**
```tsx
// Source: packages/renderer/src/remotion/layouts/FrostedCard.tsx
interface FrostedCardProps {
  children: ReactNode;
  style?: React.CSSProperties;
  opacity?: number; // default 0.2 (20%)
  blur?: number; // default 25
  radius?: number; // default 32
  color?: string; // theme-based background color
}

export const FrostedCard: React.FC<FrostedCardProps> = ({
  children,
  opacity = 0.2,
  blur = 25,
  radius = 32,
  color = "rgba(255,255,255,",
  ...props
}) => (
  <div
    style={{
      backgroundColor: `${color}${opacity})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`, // Safari
      borderRadius: radius,
      border: "1px solid rgba(255,255,255,0.1)",
      overflow: "hidden",
      ...props.style,
    }}
    {...props}
  >
    {children}
  </div>
);
```

### Pattern 3: Grid Positioning Helpers

**What:** Helper functions that convert column/span values to pixel or percentage positions.

**When to use:** In layout components to position elements on the grid.

```typescript
// grid-utils.ts

/** Convert column number (1-12) to left position percentage */
export const getGridColumn = (col: number): number => {
  // col 1 starts at left safe zone
  // Each column is (100% - safe zones - gutters) / 12
  const usableWidth = 100 - (120 / 1920 * 100) * 2; // percentage
  const colWidth = usableWidth / 12;
  const gutterWidth = (24 / 1920) * 100;
  return (col - 1) * (colWidth + gutterWidth) + (120 / 1920 * 100);
};

/** Get width span as percentage */
export const getGridSpan = (cols: number): number => {
  const usableWidth = 100 - (120 / 1920 * 100) * 2;
  const colWidth = usableWidth / 12;
  const gutterWidth = (24 / 1920) * 100;
  return cols * colWidth + (cols - 1) * gutterWidth;
};
```

### Pattern 4: Layout Refactor Template

Each layout refactors from raw `AbsoluteFill` with inline styles to use Grid + FrostedCard:

**Before (existing):**
```tsx
export const SplitVertical: React.FC<LayoutProps> = ({ scene, screenshots }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <div style={{ height: "60%", width: "100%", padding: "1.5rem" }}>
        {/* content */}
      </div>
      <div style={{ height: "40%", backgroundColor: "#1a1a1a", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {/* content */}
      </div>
    </AbsoluteFill>
  );
};
```

**After (refactored):**
```tsx
export const SplitVertical: React.FC<LayoutProps> = ({ scene, screenshots }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const topProgress = spring({ frame, fps, config: { damping: 100, stiffness: 200 } });

  return (
    <Grid>
      {/* Primary content - 60% height area using FrostedCard */}
      <FrostedCard
        style={{
          position: "absolute",
          top: 80,
          left: 120,
          width: getGridSpan(12),
          height: "calc(60% - 80px)",
          opacity: topProgress,
          transform: `translateY(${interpolate(topProgress, [0, 1], [-30, 0])}px)`,
        }}
      >
        {/* ... */}
      </FrostedCard>

      {/* Secondary content - 40% height */}
      <FrostedCard
        style={{
          position: "absolute",
          bottom: 80,
          left: 120,
          width: getGridSpan(12),
          height: "calc(40% - 80px)",
          backgroundColor: "rgba(26,26,26,0.2)", // darker theme
        }}
      >
        {/* ... */}
      </FrostedCard>
    </Grid>
  );
};
```

### Anti-Patterns to Avoid

- **Using inline percentages for positioning instead of grid helpers:** Leads to inconsistent margins. Always use `getGridColumn()` / `getGridSpan()`.
- **Hardcoding pixel values for widths:** Use percentage-based calculations to maintain 1920x1080 scaling.
- **Forgetting Safari `-webkit-backdrop-filter`:** Frosted glass will silently fail on Safari without the prefixed version.
- **Applying backdrop-filter to small elements:** Blur needs sufficient surrounding pixels to be visible. FrostedCard should have adequate padding.
- **Using fixed z-index instead of explicit ordering:** Keep z-layering predictable by always explicitly ordering children.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grid positioning math | Manual percentage calculations per component | `getGridColumn()` / `getGridSpan()` helpers | Consistency; safe zone changes only need to update constants |
| Frosted glass styling | Custom blur + opacity CSS per card | `<FrostedCard>` component | Centralized styling; easier to adjust blur/radius globally |
| Safe zone calculations | Hardcoded 120/80 throughout | Grid component + constants | Changing safe zones only requires updating one place |

---

## Common Pitfalls

### Pitfall 1: backdrop-filter Performance on Low-End Devices
**What goes wrong:** Frosted glass with blur(25px) causes frame drops on slower devices during animations.
**Why it happens:** `backdrop-filter` is GPU-intensive; animating elements with backdrop-filter compounds the cost.
**How to avoid:** Use `will-change: transform` on animated FrostedCard elements; avoid animating the blur value itself.
**Warning signs:** Remotion shows low fps warnings; video preview stutters.

### Pitfall 2: Safe Zone Overflow on Non-Standard Resolutions
**What goes wrong:** Grid content spills outside safe zones when tested at different resolutions.
**Why it happens:** Grid calculations use percentage-based positioning that assumes 1920x1080.
**How to avoid:** All layouts must test at exactly 1920x1080; percentage math in `getGridColumn` accounts for safe zones relative to container.
**Warning signs:** Elements at edge of frame; titles cut off.

### Pitfall 3: TypeScript Type Mismatch with VisualScene
**What goes wrong:** `scene` prop in layouts doesn't match `LayoutProps` interface after VisualScene schema changes.
**Why it happens:** Layout components import `LayoutProps` from `layouts/index.ts`, but `VisualScene` type comes from `@video-script/types`.
**How to avoid:** Keep `LayoutProps.scene` as `VisualScene`; do not use `SceneScript` or older types.
**Warning signs:** `Property 'layoutTemplate' does not exist` or `mediaResources` not found on scene.

### Pitfall 4: Missing FrostedCard on Dark Backgrounds
**What goes wrong:** Frosted glass with 20% white opacity looks invisible on already-white/light backgrounds.
**Why it happens:** FrostedCard default color is `rgba(255,255,255,` which becomes light gray on white.
**How to avoid:** Pass `color="rgba(0,0,0,"` for dark themes; layouts should specify appropriate color based on scene type or use the theme-based color from D-08.
**Warning signs:** Cards appear invisible; text unreadable.

---

## Code Examples

### Grid Component (Complete Implementation)

```tsx
// packages/renderer/src/remotion/layouts/Grid.tsx
import React, { ReactNode } from "react";
import { AbsoluteFill } from "remotion";

export const GRID_CONSTANTS = {
  columns: 12,
  safeZone: { top: 80, right: 120, bottom: 80, left: 120 },
  gutter: 24,
  width: 1920,
  height: 1080,
} as const;

interface GridProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

export const Grid: React.FC<GridProps> = ({ children, style }) => {
  return (
    <AbsoluteFill
      style={{
        paddingTop: GRID_CONSTANTS.safeZone.top,
        paddingBottom: GRID_CONSTANTS.safeZone.bottom,
        paddingLeft: GRID_CONSTANTS.safeZone.left,
        paddingRight: GRID_CONSTANTS.safeZone.right,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
```

### FrostedCard Component (Complete Implementation)

```tsx
// packages/renderer/src/remotion/layouts/FrostedCard.tsx
import React, { ReactNode } from "react";

interface FrostedCardProps {
  children: ReactNode;
  style?: React.CSSProperties;
  opacity?: number;
  blur?: number;
  radius?: number;
  color?: string; // e.g., "rgba(255,255,255," or "rgba(0,0,0,"
}

export const FrostedCard: React.FC<FrostedCardProps> = ({
  children,
  opacity = 0.2,
  blur = 25,
  radius = 32,
  color = "rgba(255,255,255,",
  style,
  ...props
}) => (
  <div
    style={{
      backgroundColor: `${color}${opacity})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      borderRadius: radius,
      border: "1px solid rgba(255,255,255,0.1)",
      overflow: "hidden",
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);
```

### Grid Helper Functions

```typescript
// packages/renderer/src/remotion/layouts/grid-utils.ts
import { GRID_CONSTANTS } from "./Grid";

const usableWidthPx = GRID_CONSTANTS.width - GRID_CONSTANTS.safeZone.left - GRID_CONSTANTS.safeZone.right;
const gutterTotalPx = GRID_CONSTANTS.gutter * (GRID_CONSTANTS.columns - 1);
const totalColWidthPx = usableWidthPx - gutterTotalPx;
const colWidthPx = totalColWidthPx / GRID_CONSTANTS.columns;

/** Convert 1-based column index to left pixel position */
export const getGridColumnPx = (col: number): number => {
  const col0Based = col - 1;
  return GRID_CONSTANTS.safeZone.left + col0Based * (colWidthPx + GRID_CONSTANTS.gutter);
};

/** Get width in pixels for a given column span */
export const getGridSpanPx = (cols: number): number => {
  return cols * colWidthPx + (cols - 1) * GRID_CONSTANTS.gutter;
};

/** Convert column to percentage of total width (for responsive positioning) */
export const getGridColumnPct = (col: number): number => {
  return (getGridColumnPx(col) / GRID_CONSTANTS.width) * 100;
};

/** Get span as percentage */
export const getGridSpanPct = (cols: number): number => {
  return (getGridSpanPx(cols) / GRID_CONSTANTS.width) * 100;
};
```

### Typography Scale

```typescript
// typography.ts (can live in grid-utils.ts or be inline)
export const TYPOGRAPHY = {
  title: {
    hero: 80,    // 80pt - HeroFullscreen main titles
    section: 60,  // 60pt - Split/Bullet section titles
    card: 36,     // 36pt - FrostedCard titles
  },
  body: {
    primary: 24,   // 24pt - Main body text
    secondary: 20,  // 20pt - Secondary/supporting text
    caption: 16,    // 16pt - Captions, labels
  },
} as const;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline styles with arbitrary pixel values | Grid component with consistent safe zones | Phase 2 | All layouts align to same grid; margins consistent |
| Hardcoded padding per layout (1.5rem, 2rem, etc.) | Grid wrapper + typography scale | Phase 2 | Spacing follows design system |
| Semi-transparent backgrounds via rgba | FrostedCard with backdrop-filter | Phase 2 | Premium glass-morphism effect |

**Deprecated/outdated:**
- Absolute pixel padding (e.g., `padding: "1.5rem"`) -- should use safe zone constants
- Fixed `height: "60%"` for split layouts -- should use grid positioning with percentage heights

---

## Open Questions

1. **How does Grid integrate with existing Scene.tsx composition?**
   - What we know: Layout components (`HeroFullscreen`, etc.) are selected via `getLayoutComponent()` but the current `Scene.tsx` does NOT use these layout components -- it uses `visualLayers` directly. The layouts in `packages/renderer/src/remotion/layouts/` appear to be an alternative/unused code path or are planned for future integration.
   - What's unclear: How do the layout components connect to the `VideoComposition -> Scene` render pipeline? Is there a `LayoutRenderer` component that should be added to `Scene.tsx`?
   - Recommendation: Planner should determine if layouts integrate via `Scene.tsx` visualLayers rendering OR if they replace the scene content rendering entirely.

2. **Theme color system for FrostedCard**
   - What we know: D-08 says "theme-based (dynamic based on content tone)" but no theme system exists yet.
   - What's unclear: How does a layout specify its theme color to FrostedCard?
   - Recommendation: Pass `color` prop explicitly in each layout, defaulting to light or dark based on layout background.

3. **Quote layout special handling**
   - What we know: Quote layout has decorative elements (large quotation mark) that may not fit standard grid.
   - What's unclear: Should Quote use standard grid positioning or have custom positioning?
   - Recommendation: Quote can use grid for content positioning but allow overflow for decorative elements.

---

## Sources

### Primary (HIGH confidence)
- `packages/renderer/src/remotion/layouts/index.ts` -- LayoutProps interface, getLayoutComponent()
- `packages/renderer/src/remotion/layouts/HeroFullscreen.tsx` -- Reference layout with spring animations
- `packages/renderer/src/remotion/layouts/Comparison.tsx` -- Reference layout with VS element
- `packages/renderer/src/remotion/layouts/SplitVertical.tsx` -- Reference layout with percentage heights
- `packages/renderer/src/remotion/Scene.tsx` -- Current scene rendering (uses visualLayers, not layouts)
- `packages/renderer/src/remotion/Composition.tsx` -- VideoComposition structure
- `src/types/visual.ts` -- VisualScene, LayoutTemplateEnum, Annotation types
- `.planning/PROJECT.md` -- PPT layout reference (Deer Flow), 40-60% negative space

### Secondary (MEDIUM confidence)
- CSS `backdrop-filter` browser support (widely supported; Safari prefix needed)
- Remotion `AbsoluteFill`, `spring`, `interpolate` APIs (documented in remotion docs)

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH -- all technology is project-standard (Remotion 4.0.436, React 19)
- Architecture: HIGH -- Grid + FrostedCard pattern is straightforward CSS-in-JS
- Pitfalls: MEDIUM -- some issues (backdrop-filter performance) require testing to confirm severity

**Research date:** 2026-03-22
**Valid until:** 90 days (layout system is stable CSS/React patterns, not library-dependent)
