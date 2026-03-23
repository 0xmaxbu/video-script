# Roadmap: video-script

## Milestones

- [x] **v1.0 MVP** - Core video generation pipeline (shipped 2026-03-22)
- [x] **v1.1 Professional Quality** - Phases 1-13, gap closure 6-12 (shipped 2026-03-23)
- [ ] **v1.2 Video Quality Leap** - Animation engine, screenshot intelligence, content depth, visual polish (planned)
- [ ] **v2.0 Advanced** - Deep research, themes, batch processing (planned)

## Overview

v1.0 established the core video generation pipeline. v1.1 elevated video quality to professional standards through improved research depth, visual annotation rendering, grid-based layouts, animated transitions, and polished composition. v1.2 targets AI Jason / WorldofAI quality level — rich animations, intelligent screenshots, deep content, and dark-mode aesthetics.

## Phases

- [x] **Phase 1: Annotation Renderer** - SVG-based animated annotations
- [x] **Phase 2: Layout System** - Grid-based layouts with safe zones and frosted glass (completed 2026-03-22)
- [ ] **Phase 3: Research & Content** - Deep content extraction and engaging scripts
- [ ] **Phase 4: Transitions** - Scene transitions and text animations
- [ ] **Phase 5: Composition** - Final polish and quality integration

## Phase Details

### Phase 1: Annotation Renderer

**Goal**: Users see animated annotation overlays on video elements
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: VIS-01, VIS-02, VIS-03
**Success Criteria** (what must be TRUE):

1. AnnotationRenderer renders all annotation types: circle, underline, arrow, box, highlight, number
2. Spring animations play smoothly with correct damping and stiffness
3. All interpolate values are clamped to prevent extrapolation artifacts
4. Annotations layer correctly over screenshots and code blocks
   **Plans**: 4 plans

Plans:

- [x] 01-01-PLAN.md — Create Underline, Arrow, Box, Highlight annotation components
- [x] 01-02-PLAN.md — Create Number annotation component (circle with number inside)
- [x] 01-03-PLAN.md — Create AnnotationRenderer orchestrator and update index.ts exports
- [x] 01-04-PLAN.md — Update Scene.tsx with annotations prop and AnnotationRenderer rendering

### Phase 2: Layout System

**Goal**: Users see professional PPT-style layouts with proper visual hierarchy
**Depends on**: Phase 1
**Requirements**: VIS-04, VIS-05, VIS-06, VIS-07
**Success Criteria** (what must be TRUE):

1. 12-column grid system with defined safe zones renders correctly
2. All layout templates function: hero-fullscreen, comparison, split-vertical, bullet-list, text-over-image
3. Headlines render at 72pt+ and body text at 18-24pt
4. Frosted glass cards display with proper backdrop-filter blur effects
   **Plans**: 5 plans

Plans:

- [x] 02-01-PLAN.md — Create Grid, FrostedCard, and grid-utils foundation
- [x] 02-02-PLAN.md — Refactor HeroFullscreen and SplitVertical layouts
- [x] 02-03-PLAN.md — Refactor SplitHorizontal and TextOverImage layouts
- [x] 02-04-PLAN.md — Refactor CodeFocus and Comparison layouts
- [x] 02-05-PLAN.md — Refactor BulletList and Quote layouts

### Phase 3: Research & Content

**Goal**: Users receive in-depth research and engaging narration
**Depends on**: Phase 2
**Requirements**: RES-01, RES-02, RES-03, SCR-01, SCR-02
**Success Criteria** (what must be TRUE):

1. Research agent extracts semantic chunks (problem/solution/code/caveats) preserving logical flow
2. Research uses Turndown + Readability to crawl actual article content (not placeholder links)
3. Scripts contain thorough explanations, not generic summaries
4. Scene narration is engaging and tutorial-appropriate
   **Plans**: 3 plans

Plans:

- [x] 03-01-PLAN.md — Upgrade web-fetch with Turndown + Readability, add input validation, update research schema
- [x] 03-02-PLAN.md — Create quality evaluation agent (non-blocking)
- [x] 03-03-PLAN.md — Update research agent with relationship tags, update script agent for depth

### Phase 4: Transitions

**Goal**: Users see smooth animated transitions between scenes
**Depends on**: Phase 3
**Requirements**: VIS-08, VIS-09, VIS-10
**Success Criteria** (what must be TRUE):

1. Scene transitions (fade, slideIn) play correctly between scenes
2. Typewriter effect animates text in code scenes
3. Spring animations handle delays correctly (extra frames for settling)
   **Plans**: TBD

### Phase 5: Composition

**Goal**: Final videos match visual plans and feel polished
**Depends on**: Phase 4
**Requirements**: COMP-01, COMP-02
**Success Criteria** (what must be TRUE):

1. All annotations render in final video output
2. All layouts display correctly in final video
3. Video quality feels polished and professional
   **Plans**: TBD

## Progress

| Phase                    | Plans Complete | Status   | Completed  |
| ------------------------ | -------------- | -------- | ---------- |
| 1. Annotation Renderer   | 4/4            | Complete | 2026-03-22 |
| 2. Layout System         | 5/5            | Complete | 2026-03-22 |
| 3. Research & Content    | 3/3            | Complete | 2026-03-22 |
| 4. Transitions           | 2/2            | Complete | 2026-03-22 |
| 5. Composition           | 3/3            | Complete | 2026-03-22 |
| 6. Type Package + Schema | 3/3            | Complete | 2026-03-23 |
| 7. Wire Layouts          | 2/2            | Complete | 2026-03-23 |
| 8. Verification Docs     | 3/3            | Complete | 2026-03-23 |
| 9. Fix Types + Adapter   | 2/2            | Complete | 2026-03-23 |
| 10. Wire Layouts to Comp | 1/1            | Complete | 2026-03-23 |
| 11. Screenshot Quality   | 3/3            | Complete | 2026-03-23 |
| 12. Fix Layout Rendering | 2/2            | Complete | 2026-03-23 |
| 13. Fix Issues + Tests   | 3/3            | Complete | 2026-03-23 |

**v1.1 Complete:** 16/16 requirements delivered, 13 phases, 35 plans

### v1.2: Video Quality Leap

**Goal:** Elevate video output to AI Jason / WorldofAI quality level
**Research sources:** claude-remotion-kickstart, remotion-dev/template-prompt-to-video, AI Jason channel analysis
**Target quality:** Dark mode aesthetic, kinetic typography, Ken Burns parallax, content-aware screenshots, tutorial-depth narration

| Phase                    | Plans | Status  | Completed |
| ------------------------ | ----- | ------- | --------- |
| 14. Animation Engine     | TBD   | Planned | -         |
| 15. Screenshot + Content | TBD   | Planned | -         |
| 16. Visual Polish        | TBD   | Planned | -         |
| 17. E2E Testing          | TBD   | Planned | -         |

### Phase 14: Animation Engine

**Goal:** Expand from 1 animation type (fade-in) to 10+ types with Ken Burns, parallax, stagger, and kinetic typography
**Depends on**: Phase 13
**Requirements**: ANIM-01 through ANIM-06
**Success Criteria**:

1. Animation utility library with 10+ reusable animation functions
2. Ken Burns alternating zoom-in/zoom-out on screenshot visual layers
3. Parallax depth — text and image layers move at different speeds
4. Staggered bullet/step reveal with configurable delay per item
5. Scene transition variety: blur, slide, wipe with configurable easing
6. Per-word kinetic typography subtitle component
   **Plans:** TBD

### Phase 15: Screenshot Intelligence + Content Depth

**Goal:** Fix screenshot quality and hollow content — content-aware capture, dark mode, tutorial-depth narration
**Depends on**: Phase 14
**Requirements**: SCR-03, SCR-04, SCR-05, RES-04, RES-05, SCR-06
**Success Criteria**:

1. Screenshot capture focuses on content regions (not nav/sidebars)
2. All captured screenshots use dark mode
3. Zoom-to-region: full page capture with element-level zoom
4. Research produces specific, example-rich content (not generic summaries)
5. Script narration explains WHY with analogies and concrete examples
6. Visual plan selects varied, content-appropriate layouts
   **Plans:** TBD

### Phase 16: Visual Polish

**Goal:** Dark mode theme, callout system, progress indicators, responsive text sizing — AI Jason aesthetic
**Depends on**: Phase 15
**Requirements**: VIS-11, VIS-12, VIS-13, VIS-14
**Success Criteria**:

1. Dark mode theme system with high-contrast color palette (black + white + yellow accent)
2. Callout/highlight components (yellow rounded rects, annotation arrows)
3. Progress indicators for multi-step tutorials (numbered circles, checkmarks)
4. Responsive text sizing via fitText pattern across aspect ratios
   **Plans:** TBD

### Phase 17: E2E Testing

**Goal:** Verify entire pipeline produces AI Jason quality output with real topics
**Depends on**: Phase 16
**Requirements**: TEST-01, TEST-02, TEST-03
**Success Criteria**:

1. Fixed-fixture E2E test: script → visual → render produces valid MP4
2. Real-topic test: research agent produces deep, specific content
3. Screenshot quality test: captures focus on relevant content regions
   **Plans:** TBD

## Gap Closure Phases

### Phase 6: Type Package + Schema Adapter

**Goal:** Fix blocking integration issues — @video-script/types package and script→renderer schema mismatch
**Depends on**: Phase 5
**Requirements**: VIS-01, VIS-02, VIS-03, RES-01, RES-03, SCR-01, SCR-02, COMP-01
**Gap Closure:** Closes blocking gaps from v1.0 audit
**Plans:** 3 plans

Plans:

- [x] 06-01-PLAN.md — Create @video-script/types package with unified schemas
- [x] 06-02-PLAN.md — Update consumers (renderer, main) to use @video-script/types
- [x] 06-03-PLAN.md — Verify type unification and compilation

### Phase 7: Wire Layouts to Composition

**Goal:** Connect orphaned Phase 2 layouts (Grid, FrostedCard, 8 templates) to generated Scene.tsx
**Depends on**: Phase 6
**Requirements**: VIS-04, VIS-05, VIS-06, VIS-07
**Gap Closure:** Closes major integration gap — layouts created but never used
**Plans:** 2 plans

Plans:

- [x] 07-01-PLAN.md — Add layoutTemplate field to SceneScriptSchema
- [x] 07-02-PLAN.md — Create sceneAdapter and modify Scene.tsx for layout routing

### Phase 8: Verification Docs + Cleanup

**Goal:** Document Phase 01 and 04 verification, remove orphaned exports
**Depends on**: Phase 7
**Requirements**: (documentation + cleanup)
**Gap Closure:** Closes nice-to-have gaps from v1.0 audit
**Plans:** 3/3 plans complete

Plans:

- [x] 08-01-PLAN.md — Create Phase 1 verification and UAT documentation
- [x] 08-02-PLAN.md — Create Phase 4 verification and UAT documentation
- [x] 08-03-PLAN.md — Remove dead exports from renderer index.ts

### Phase 9: Fix @video-script/types + Schema Adapter

**Goal:** Fix blocking integration issues — package installation and visualLayers population
**Depends on**: Phase 8
**Requirements**: VIS-01, VIS-02, VIS-03, SCR-01, SCR-02, RES-01, RES-03
**Gap Closure:** Closes blocking gaps from v1.0 audit

- Issue: @video-script/types not in renderer node_modules
- Issue: visualLayers empty — highlights/codeHighlights never converted to visualLayers
  **Plans:** 2/2 plans executed

Plans:

- [x] 09-01-PLAN.md — Create scene-adapter.ts + add @video-script/types to renderer deps
- [x] 09-02-PLAN.md — Wire adapter into compose CLI step + E2E verification

### Phase 10: Wire Phase 2 Layouts into Composition

**Goal:** Connect orphaned Grid, FrostedCard, and 8 layout templates to generated Scene.tsx
**Depends on**: Phase 9
**Requirements**: VIS-04, VIS-05, VIS-06, VIS-07
**Gap Closure:** Closes major integration gap from v1.0 audit

- Issue: Phase 2 layouts (Grid, FrostedCard) not imported by remotion-project-generator.ts
- Issue: Generated Scene.tsx uses hardcoded inline layouts instead of Phase 2 components
  **Plans:** 1 plan

Plans:

- [x] 10-01-PLAN.md — Wire Phase 2 layouts into render pipeline

### Phase 11: Screenshot Quality

**Goal:** Fix ORB blocking, improve CSS selectors, and capture more content-relevant screenshots
**Depends on**: Phase 10
**Requirements**: (deferred from Phase 10)
**Gap Closure:** Closes screenshot quality gap from v1.0 audit

- Issue: ORB blocks remote URLs in browser, preventing screenshot capture
- Issue: CSS selectors are generic, not content-specific
- Issue: Screenshots often miss the actual relevant content

**Plans:** 3 plans

Plans:

- [x] 11-01-PLAN.md — AI-guided selector generation
- [x] 11-02-PLAN.md — Intelligent retry with AI refinement + ORB mitigation
- [x] 11-03-PLAN.md — Content-type-specific screenshot strategies

### Phase 12: Fix Layout Rendering

**Goal:** Fix layout template rendering issues — layouts must show proper split, positioning, Z-index, and visual hierarchy
**Depends on**: Phase 10
**Requirements**: VIS-04, VIS-05, VIS-06, VIS-07
**Gap Closure:** Closes visual quality gap — layouts exist but render incorrectly

- Issue: split-vertical shows text stacking at top, bottom content missing
- Issue: Frosted glass Z-index above text causes text blur
- Issue: All layouts aligned to top instead of proper content positioning
- Issue: Layout components ignore visualLayers data

**Plans:** 2/2 plans executed

- [x] 12-01-PLAN.md — Fix FrostedCard z-index and SplitVertical flexbox centering (VIS-04, VIS-05)
- [x] 12-02-PLAN.md — Fix visualLayer content mapping in layouts (VIS-06, VIS-07)

_Roadmap created: 2026-03-22_
_Last updated: 2026-03-23_
