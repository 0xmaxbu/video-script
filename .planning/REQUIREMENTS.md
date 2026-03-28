# Requirements: video-script

**Defined:** 2026-03-22
**Core Value:** Polished technical tutorial videos that feel professional and engaging

## v1 Requirements

### Research Quality

- [x] **RES-01**: Research agent performs deep content analysis — not placeholder links
- [x] **RES-02**: Research crawls actual paper/article content using Turndown + Readability
- [x] **RES-03**: Research extracts semantic chunks (problem/solution/code/caveats) preserving logical flow

### Visual Annotations

- [x] **VIS-01**: Annotation renderer component renders highlight, underline, circle, number effects
- [x] **VIS-02**: Annotations animate correctly using spring/interpolate
- [x] **VIS-03**: Animation extrapolation properly clamped (no values beyond intended range)

### Layout System

- [x] **VIS-04**: Grid-based layout system with safe zones (12-column)
- [x] **VIS-05**: Layout templates: hero-fullscreen, comparison, split-vertical, bullet-list, text-over-image
- [x] **VIS-06**: PPT-style visual hierarchy (headlines 72pt+, body 18-24pt)
- [x] **VIS-07**: Frosted glass cards with backdrop-filter effects

### Animation Transitions

- [x] **VIS-08**: Scene transitions: fade, slideIn effects work correctly
- [x] **VIS-09**: Text animations: typewriter effect for code scenes
- [x] **VIS-10**: Spring animations with proper delay handling

### Content Quality

- [x] **SCR-01**: Script generates content with depth — thorough explanations
- [x] **SCR-02**: Scene narration is engaging, not generic summaries

### Composition

- [x] **COMP-01**: Final video matches visual plan — all annotations render
- [x] **COMP-02**: Video quality feels polished and professional

## v1.2 Requirements (Video Quality Leap)

### Animation Engine

- [ ] **ANIM-01**: Multiple animation types beyond fade-in — slide, scale, typewriter, Ken Burns, parallax, stagger, blur, kinetic
- [ ] **ANIM-02**: Scene transition variety — blur, slide, wipe with configurable duration and easing
- [ ] **ANIM-03**: Ken Burns effect on screenshots — alternating zoom-in/zoom-out per scene
- [ ] **ANIM-04**: Parallax depth — text layers move independently from screenshot layers
- [ ] **ANIM-05**: Staggered element reveal — bullet points and steps appear sequentially with delay
- [ ] **ANIM-06**: Kinetic typography — per-word subtitle animation synced to narration timing

### Visual Polish

- [x] **VIS-11**: Dark mode theme system — dark backgrounds as default for maximum contrast
- [x] **VIS-12**: Callout/highlight system — colored rounded rectangles (yellow accent), annotation arrows for key concepts
- [x] **VIS-13**: Progress indicators — numbered circles, checkmarks for multi-step tutorial content
- [x] **VIS-14**: Responsive text sizing — fitText pattern for consistent rendering across aspect ratios

### Screenshot Intelligence

- [ ] **SCR-03**: Content-aware screenshot capture — focus on relevant content regions, not nav bars or sidebars
- [ ] **SCR-04**: Dark mode enforcement on captured screenshots
- [ ] **SCR-05**: Zoom-to-region capability — full page capture with ability to zoom to specific UI elements

### Content Depth

- [ ] **RES-04**: Research produces deep, specific content with concrete examples — not generic summaries
- [ ] **RES-05**: Script narration is tutorial-quality — explains WHY, uses analogies, anticipates questions
- [ ] **SCR-06**: Visual plan chooses varied, appropriate layouts per scene type with content awareness

### E2E Testing

- [ ] **TEST-01**: Fixed-fixture E2E test for visual composition pipeline (script → visual → render)
- [ ] **TEST-02**: Real-topic research quality verification test
- [ ] **TEST-03**: Screenshot capture quality verification test

### Real CLI User Validation

- [ ] **UAT-01**: One-shot CLI path — `video-script create --no-review` with curated Phase 14 links produces a complete review bundle containing `research.json`, `script.json`, `screenshots/`, `quality-report.md`, `output.srt`, and a final `output.mp4`
- [ ] **UAT-02**: Pause/resume CLI path — `video-script create` suspends cleanly and `video-script resume` completes the same complete review bundle in a separate output directory without manual internal helper calls
- [ ] **UAT-03**: Human review package compares both runs and captures an animation-first verdict using exactly `通过`, `可接受但需优化`, or `不通过`

## v2 Requirements

- Deep multi-round research with gap analysis and follow-up
- Master slide system for reusable layouts
- Custom theme/brand support
- Multiple video format outputs

## Out of Scope

| Feature                             | Reason                               |
| ----------------------------------- | ------------------------------------ |
| Audio narration/voice-over          | Future phase — needs voice synthesis |
| Interactive/branching video         | Linear video only for now            |
| Batch processing multiple topics    | Single video at a time               |
| 3D transforms or drawing animations | Over-engineering, avoid              |

## Traceability

| Requirement | Phase    | Status   |
| ----------- | -------- | -------- |
| VIS-01      | Phase 6  | Complete |
| VIS-02      | Phase 6  | Complete |
| VIS-03      | Phase 6  | Complete |
| VIS-04      | Phase 12 | Complete |
| VIS-05      | Phase 12 | Complete |
| VIS-06      | Phase 12 | Complete |
| VIS-07      | Phase 12 | Complete |
| RES-01      | Phase 9  | Complete |
| RES-02      | Phase 3  | Complete |
| RES-03      | Phase 9  | Complete |
| SCR-01      | Phase 9  | Complete |
| SCR-02      | Phase 9  | Complete |
| VIS-08      | Phase 4  | Complete |
| VIS-09      | Phase 4  | Complete |
| VIS-10      | Phase 4  | Complete |
| COMP-01     | Phase 6  | Complete |
| COMP-02     | Phase 5  | Complete |

### v1.2 Traceability

| Requirement | Phase | Status   |
| ----------- | ----- | -------- |
| ANIM-01     | 14    | Pending  |
| ANIM-02     | 14    | Pending  |
| ANIM-03     | 14    | Pending  |
| ANIM-04     | 14    | Pending  |
| ANIM-05     | 14    | Pending  |
| ANIM-06     | 14    | Pending  |
| VIS-11      | 16    | Complete |
| VIS-12      | 16    | Complete |
| VIS-13      | 16    | Complete |
| VIS-14      | 16    | Complete |
| SCR-03      | 15    | Pending  |
| SCR-04      | 15    | Pending  |
| SCR-05      | 15    | Pending  |
| RES-04      | 15    | Pending  |
| RES-05      | 15    | Pending  |
| SCR-06      | 15    | Pending  |
| TEST-01     | 17    | Pending  |
| TEST-02     | 17    | Pending  |
| TEST-03     | 17    | Pending  |
| UAT-01      | 18    | Pending  |
| UAT-02      | 18    | Pending  |
| UAT-03      | 18    | Pending  |

**Coverage:**

- v1 requirements: 16 total, 16 complete
- v1.2 requirements: 19 total, 0 complete
- v1 gap closure: 13 requirements in phases 6-12

---

_Requirements defined: 2026-03-22_
_Last updated: 2026-03-23 after v1.2 milestone creation_
