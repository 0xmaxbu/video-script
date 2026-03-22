# Phase 2: Layout System - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Professional PPT-style layout system with 12-column grid, frosted glass cards, and proper visual hierarchy. All 8 existing layouts (hero-fullscreen, comparison, split-vertical, bullet-list, text-over-image, split-horizontal, code-focus, quote) will be refactored to use the grid system.

</domain>

<decisions>
## Implementation Decisions

### Grid System
- **D-01:** 12-column grid system
- **D-02:** Safe zones: left/right 120px, top/bottom 80px
- **D-03:** Gutter width (column spacing): 24px
- **D-04:** Video resolution: 1920x1080 (16:9)

### Frosted Glass Cards
- **D-05:** backdrop-filter blur: 25px
- **D-06:** Background opacity: 20%
- **D-07:** Border radius: 32px
- **D-08:** Background color: theme-based (dynamic based on content tone)
- **D-09:** Frosted glass wrapper component: `<FrostedCard>` with backdrop-filter

### Typography Hierarchy
- **D-10:** Title sizes: 80pt (hero), 60pt (section), 36pt (card)
- **D-11:** Body sizes: 24pt (primary), 20pt (secondary), 16pt (caption)
- **D-12:** Font family: system sans-serif (or inherit from layout)

### Layout Refactor Approach
- **D-13:** Refactor ALL 8 existing layouts to use grid system
- **D-14:** Grid as Wrapper component: `<Grid>{children}</Grid>` auto-handles positioning
- **D-15:** Layouts: HeroFullscreen, SplitHorizontal, SplitVertical, TextOverImage, CodeFocus, Comparison, BulletList, Quote

### Layout Implementation
- **D-16:** Create Grid component with 12-column layout logic
- **D-17:** Create FrostedCard component with backdrop-filter
- **D-18:** Helper functions for grid positioning: getGridColumn(), getGridSpan()
- **D-19:** Layouts use Grid + FrostedCard for consistent spacing and visuals

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Layouts
- `packages/renderer/src/remotion/layouts/index.ts` — LayoutProps interface, getLayoutComponent()
- `packages/renderer/src/remotion/layouts/HeroFullscreen.tsx` — Reference layout with spring animations
- `packages/renderer/src/remotion/layouts/Comparison.tsx` — Reference layout with VS element
- `packages/renderer/src/remotion/layouts/SplitVertical.tsx` — Reference layout with percentage heights

### Design References
- `.planning/PROJECT.md` — PPT layout reference (Deer Flow), 40-60% negative space
- `.planning/REQUIREMENTS.md` — VIS-04, VIS-05, VIS-06, VIS-07 requirements

### Phase 1 Context
- `.planning/phases/01-annotation-renderer/01-CONTEXT.md` — Annotation system decisions (D-01 through D-21)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Layout components: HeroFullscreen, SplitVertical, Comparison, etc. — all exist in `layouts/`
- LayoutProps interface: `{ scene: VisualScene, screenshots: Map<string, string>, children?: ReactNode }`
- Spring + interpolate animations — already used in layouts
- getLayoutComponent() switch — entry point for layout selection

### Established Patterns
- AbsoluteFill for full-screen layouts
- Spring animations for appear effects (damping: 100, stiffness: 200-300)
- Img component for screenshots with objectFit: "contain" or "cover"
- Text elements accessed via scene.textElements.find()

### Integration Points
- Grid component wraps layout content
- FrostedCard component wraps card content
- Layouts continue to receive scene + screenshots props
- Annotations render over layouts (Phase 1 integration)

</code_context>

<specifics>
## Specific Ideas

- "40-60% negative space for premium feel"
- "Center frosted glass cards with 32px rounded corners"
- "Headlines: 72pt+ bold, Body: 18-24pt"
- "Frosted glass blur (backdrop-filter: 20-40px)"
- All 8 layouts should look consistent after refactor

</specifics>

<deferred>
## Deferred Ideas

- Custom font family selection — system fonts for now
- Layout animation variants — basic refactor first
- Theme color extraction automation — manual theme for now

</deferred>

---

*Phase: 02-layout-system*
*Context gathered: 2026-03-22*
