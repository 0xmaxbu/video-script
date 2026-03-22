# Roadmap: video-script

## Milestones

- [x] **v1.0 MVP** - Core video generation pipeline (shipped 2026-03-22)
- [ ] **v1.1 Professional Quality** - Phases 1-5 (in progress)
- [ ] **v2.0 Advanced** - Deep research, themes, batch processing (planned)

## Overview

v1.0 established the core video generation pipeline. v1.1 focuses on elevating video quality to professional standards through improved research depth, visual annotation rendering, grid-based layouts, animated transitions, and polished composition.

## Phases

- [x] **Phase 1: Annotation Renderer** - SVG-based animated annotations
- [ ] **Phase 2: Layout System** - Grid-based layouts with safe zones and frosted glass
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
- [ ] 02-01-PLAN.md — Create Grid, FrostedCard, and grid-utils foundation
- [ ] 02-02-PLAN.md — Refactor HeroFullscreen and SplitVertical layouts
- [ ] 02-03-PLAN.md — Refactor SplitHorizontal and TextOverImage layouts
- [ ] 02-04-PLAN.md — Refactor CodeFocus and Comparison layouts
- [ ] 02-05-PLAN.md — Refactor BulletList and Quote layouts

### Phase 3: Research & Content
**Goal**: Users receive in-depth research and engaging narration
**Depends on**: Phase 2
**Requirements**: RES-01, RES-02, RES-03, SCR-01, SCR-02
**Success Criteria** (what must be TRUE):
  1. Research agent extracts semantic chunks (problem/solution/code/caveats) preserving logical flow
  2. Research uses Turndown + Readability to crawl actual article content (not placeholder links)
  3. Scripts contain thorough explanations, not generic summaries
  4. Scene narration is engaging and tutorial-appropriate
**Plans**: TBD

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

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Annotation Renderer | 4/4 | ✅ Complete | 2026-03-22 |
| 2. Layout System | 0/5 | Not started | - |
| 3. Research & Content | 0/4 | Not started | - |
| 4. Transitions | 0/3 | Not started | - |
| 5. Composition | 0/3 | Not started | - |

**Coverage:** 16/16 v1 requirements mapped

---

*Roadmap created: 2026-03-22*
