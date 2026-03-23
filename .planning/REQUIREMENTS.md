# Requirements: video-script

**Defined:** 2026-03-22
**Core Value:** Polished technical tutorial videos that feel professional and engaging

## v1 Requirements

### Research Quality

- [x] **RES-01**: Research agent performs deep content analysis — not placeholder links
- [ ] **RES-02**: Research crawls actual paper/article content using Turndown + Readability
- [x] **RES-03**: Research extracts semantic chunks (problem/solution/code/caveats) preserving logical flow

### Visual Annotations

- [x] **VIS-01**: Annotation renderer component renders highlight, underline, circle, number effects
- [x] **VIS-02**: Annotations animate correctly using spring/interpolate
- [x] **VIS-03**: Animation extrapolation properly clamped (no values beyond intended range)

### Layout System

- [ ] **VIS-04**: Grid-based layout system with safe zones (12-column)
- [ ] **VIS-05**: Layout templates: hero-fullscreen, comparison, split-vertical, bullet-list, text-over-image
- [ ] **VIS-06**: PPT-style visual hierarchy (headlines 72pt+, body 18-24pt)
- [ ] **VIS-07**: Frosted glass cards with backdrop-filter effects

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

## v2 Requirements

- Deep multi-round research with gap analysis and follow-up
- Master slide system for reusable layouts
- Custom theme/brand support
- Multiple video format outputs

## Out of Scope

| Feature | Reason |
|---------|--------|
| Audio narration/voice-over | Future phase — needs voice synthesis |
| Interactive/branching video | Linear video only for now |
| Batch processing multiple topics | Single video at a time |
| 3D transforms or drawing animations | Over-engineering, avoid |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VIS-01 | Phase 6 | Complete |
| VIS-02 | Phase 6 | Complete |
| VIS-03 | Phase 6 | Complete |
| VIS-04 | Phase 10 | Pending |
| VIS-05 | Phase 10 | Pending |
| VIS-06 | Phase 10 | Pending |
| VIS-07 | Phase 10 | Pending |
| RES-01 | Phase 9 | Complete |
| RES-02 | Phase 3 | Complete |
| RES-03 | Phase 9 | Complete |
| SCR-01 | Phase 9 | Complete |
| SCR-02 | Phase 9 | Complete |
| VIS-08 | Phase 4 | Complete |
| VIS-09 | Phase 4 | Complete |
| VIS-10 | Phase 4 | Complete |
| COMP-01 | Phase 6 | Complete |
| COMP-02 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0
- Gap closure: 9 requirements in phases 6-7

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after v1.1 roadmap creation*
