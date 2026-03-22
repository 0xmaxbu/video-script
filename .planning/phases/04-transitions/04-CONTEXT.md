# Phase 4: Transitions - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Animated transitions between scenes (fade, slideIn) and text/code animations (typewriter). This phase wires existing transition components into the composition layer, implements scene-type-based transition mapping, and refactors code animation to use camera zoom/pan effects instead of simple scrolling. This is purely visual polish — no content generation or layout changes.

</domain>

<decisions>
## Implementation Decisions

### Scene Transition Architecture
- **D-01:** Transition at Composition layer — Composition.tsx wraps all scenes with transition logic (centralized, consistent)
- **D-02:** Transition type by scene.type inference:
  - intro → fade
  - outro → fade
  - feature → slide
  - code → fade

### Transition Timing & Direction
- **D-03:** Transition duration by scene type:
  - intro/outro: 45 frames (~1.5s at 30fps) — more dramatic for open/close
  - feature/code: 30 frames (~1s at 30fps) — snappier for content
- **D-04:** Slide direction alternates:
  - Odd scenes: slide left-to-right
  - Even scenes: slide right-to-left
  - Creates a "back-and-forth" flow effect

### First/Last Scene Handling
- **D-05:** First scene: no enter transition — appears immediately
- **D-06:** Last scene: no exit transition — video ends directly
- **D-07:** Adjacent scenes: cross-fade transition — Scene A exits while Scene B enters simultaneously

### Code Scene Typewriter
- **D-08:** Typewriter speed: dynamic calculation — based on scene duration and code length, ensures all code is revealed within scene bounds
- **D-09:** Camera zoom + pan effect (not simple scroll):
  - Start: full code view (zoomed out, code may be small)
  - Then: zoom into key code segments (clear, but partial view)
  - Pan: move between key segments
  - Matches Phase 3 D-07 intent
- **D-10:** Line highlight timing: delayed — code fully revealed first, then highlights trigger based on narration timing

### Spring Animation Settling
- **D-11:** Settling buffer: 30 frames — conservative buffer for spring animations to fully settle (based on damping=100)
- **D-12:** Settling frames only in final render — preview skips for responsiveness

### Claude's Discretion
- Exact spring config for transitions (use existing damping: 100, stiffness: 300 from Phase 1)
- Exact zoom/pan curves for code scenes
- Cross-fade overlap duration (half of exit duration recommended)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Transition Components
- `packages/renderer/src/remotion/components/Transitions.tsx` — Transition, TypewriterText, HighlightBox components
- `packages/renderer/src/remotion/components/CodeAnimation.tsx` — Current code typewriter with scroll (needs refactor for zoom/pan)

### Composition & Scene
- `packages/renderer/src/remotion/Composition.tsx` — Composition entry point (needs transition wiring)
- `packages/renderer/src/remotion/Scene.tsx` — Scene component
- `packages/renderer/src/remotion/Root.tsx` — Root component with sequence

### Layout Components
- `packages/renderer/src/remotion/layouts/` — All layout components (HeroFullscreen, CodeFocus, etc.)
- `packages/renderer/src/remotion/layouts/CodeFocus.tsx` — Code-specific layout

### Prior Phase Context
- `.planning/phases/01-annotation-renderer/01-CONTEXT.md` — Spring config (D-05: damping 100, stiffness 300)
- `.planning/phases/02-layout-system/02-CONTEXT.md` — Layout spring animations
- `.planning/phases/03-research-content/03-CONTEXT.md` — Code scene camera zoom/pan intent (D-07)

### Requirements
- `.planning/REQUIREMENTS.md` — VIS-08, VIS-09, VIS-10 requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Transition` component — Already handles fade, slide, wipe with enter/exit props
- `TypewriterText` component — Character-by-character text reveal with cursor
- `CodeAnimation` component — Line-by-line code reveal with scroll and highlight (needs zoom/pan refactor)
- `spring()` + `interpolate()` from Remotion — Standard animation primitives

### Established Patterns
- Spring config: damping: 100, stiffness: 200-300 (Phase 1 & 2)
- `extrapolateRight: "clamp"` for all interpolate calls (Phase 1 D-06)
- AbsoluteFill for full-screen positioning
- Scene types: intro, feature, code, outro

### Gaps to Address
1. `Transitions.tsx` Transition component:
   - Slide is fixed direction (left-to-right only) — needs `direction` param
   - No integration with Composition.tsx

2. `CodeAnimation.tsx`:
   - Uses CSS `transition` for scroll — should use Remotion `interpolate`
   - No zoom/pan capability — needs refactor to camera-style animation
   - Typewriter speed is fixed — needs dynamic calculation

3. `Composition.tsx`:
   - No transition wrapper between scenes
   - Scene sequence is direct cut — no enter/exit handling

### Integration Points
- Composition.tsx wraps each scene with Transition
- Transition reads scene.type to determine effect
- CodeAnimation receives zoom/pan keyframes from scene data

</code_context>

<specifics>
## Specific Ideas

- "Cross-fade between scenes feels like a smooth conversation"
- "Slide direction alternation creates visual rhythm"
- "Camera zooming into code feels like guiding the viewer's eye"
- "Intro/outro get longer transitions because they're emotional beats"

</specifics>

<deferred>
## Deferred Ideas

### Transitions (v2)
- Custom transition per scene (user-configurable via visual plan)
- 3D flip/rotate transitions
- Morphing transitions between similar layouts

### Code Animation (v2)
- Syntax highlighting color transitions
- Code diff animations (before/after)
- Multiple code files with tab switching

</deferred>

---

*Phase: 04-transitions*
*Context gathered: 2026-03-22*
