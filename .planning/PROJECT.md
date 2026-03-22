# video-script

## What This Is

AI-powered CLI tool that generates technical tutorial videos from topics, links, and documentation. Users provide a title + reference links, and the system produces a complete video: deep research, structured scripts, visual layout编排, animated annotations, and rendered MP4 with subtitles.

## Core Value

**Polished technical tutorial videos that feel professional and engaging** — not generic AI output with hollow content, messy layout, and no visual direction.

## Requirements

### Validated

- ✓ CLI with subcommands: research → script → visual → screenshot → compose — existing
- ✓ Two-process architecture (Main CLI + Remotion renderer) — existing
- ✓ Mastra agents for research, script, visual, screenshot — existing
- ✓ Commander.js CLI interface — existing
- ✓ Playwright screenshot capture — existing
- ✓ Remotion video rendering — existing
- ✓ SRT subtitle generation — existing

### Active

- [ ] **RES-01**: Research agent performs deep content analysis — not placeholder links
- [ ] **RES-02**: Research crawls actual paper/article content and synthesizes findings
- [ ] **SCR-01**: Script generates content with depth — thorough explanations, not generic summaries
- [ ] **VIS-01**: Visual layout follows PPT design principles — clean, professional layout
- [ ] **VIS-02**: Visual annotations render correctly: highlight, underline, circle, number
- [ ] **VIS-03**: Animation transitions work: fade, slideIn, typewriter effects
- [ ] **VIS-04**: Layout templates: hero-fullscreen, comparison, split-vertical, bullet-list, text-over-image
- [x] **COMP-01**: Final video matches visual plan — all annotations render (Phase 05: annotation wiring complete)
- [x] **COMP-02**: Video quality feels polished and professional (Phase 05: CRF 20, Retina, dual resolution)

### Out of Scope

- Audio narration / voice-over — future phase
- Multiple video output formats — MP4 only for now
- Batch processing multiple topics — single video at a time
- Interactive video / branching — linear video only

## Context

**Existing architecture (brownfield):**
- Two-process model: Main CLI (zod v4) + Renderer subprocess (zod v3)
- Mastra agent framework for AI orchestration
- Remotion for React-based video rendering
- Playwright for screenshot capture
- 4 agents: research, script, visual, screenshot, compose
- 5 scene types: intro, feature, code, outro
- Visual layer types: screenshot, code, text, diagram, image
- Openspec docs in `openspec/` define current specifications

**Current pipeline test findings (2026-03-22):**
- Research: Links resolved to `example.com/placeholder` — no real content crawled
- Script: Structure correct, but content is shallow due to failed research
- Visual: Layout and annotation descriptions are detailed and correct
- Screenshot: Completed with some timeout errors
- Compose: Video generated (160s) but quality needs verification

**Visual effects reference (from openspec):**
- Animation types: fadeIn, slideIn, typewriter, zoom, pan
- Annotation types: highlight (背景高亮), underline (下划线), circle (圈注), number (序号标注)
- Layout templates: hero-fullscreen, comparison, split-vertical, bullet-list, text-over-image

**PPT layout reference (Deer Flow):**
- Center frosted glass cards with 32px rounded corners
- 40-60% negative space for premium feel
- Headlines: 72pt+ bold, Body: 18-24pt
- Color palette: one primary + 1-2 accents, exact hex codes
- Frosted glass blur (backdrop-filter: 20-40px)

## Constraints

- **Tech Stack**: TypeScript, Mastra, Remotion, Playwright — locked
- **Two-Process Model**: Must maintain zod v3/v4 isolation — locked
- **Output Format**: MP4 + SRT — locked
- **CLI Interface**: Subcommands for each pipeline stage — locked
- **LLM Provider**: MiniMax CN Coding Plan (configurable) — locked

## Key Decisions

| Decision | Rationale | Outcome |
|---------|-----------|---------|
| Two-process architecture | Zod v3/v4 version conflict between main and renderer | ✓ Locked |
| Remotion for video rendering | Flexible React-based composition | ✓ Locked |
| 5 pipeline stages | Each stage independently testable/rerunnable | ✓ Locked |
| Mastra agents | AI orchestration framework | ✓ Locked |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state (users, feedback, metrics)

---
*Last updated: 2026-03-22 after initialization*
