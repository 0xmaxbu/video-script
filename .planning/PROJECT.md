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

| Decision                     | Rationale                                            | Outcome  |
| ---------------------------- | ---------------------------------------------------- | -------- |
| Two-process architecture     | Zod v3/v4 version conflict between main and renderer | ✓ Locked |
| Remotion for video rendering | Flexible React-based composition                     | ✓ Locked |
| 5 pipeline stages            | Each stage independently testable/rerunnable         | ✓ Locked |
| Mastra agents                | AI orchestration framework                           | ✓ Locked |

## Locked Architectural Decisions

**These decisions are LOCKED. Agents must NOT change these without explicit user permission.**

---

### ⚠️ CRITICAL: USE packages/renderer Remotion PROJECT DIRECTLY — NEVER GENERATE SIMPLIFIED PROJECTS ⚠️

**THIS IS NOT OPEN FOR DISCUSSION. THIS IS NOT NEGOTIABLE. THIS IS FINAL.**

**DECISION: Use `packages/renderer/src/remotion/` directly — NO generated simplified projects.**

**RATIONALE:**
Phase 14 animation engine was implemented in `packages/renderer/src/remotion/` with full Ken Burns, parallax, exit animations, kinetic subtitles, and centralized `animation-utils.ts`. However, `remotion-project-generator.ts` was generating COMPLETE SEPARATE SIMPLIFIED CODE that IGNORED all Phase 14 work. The generated `Scene.tsx` used only basic `opacity` fade — not `ScreenshotLayer`, not `TextLayer`, not `CodeLayer`, not `KineticSubtitle`, not `animation-utils.ts`. This caused ALL animation work to be SILENTLY DISCARDED while UAT tests PASSED (testing source files, not rendered output).

**ABSOLUTELY FORBIDDEN — NEVER DO THESE THINGS:**
1. ❌ NEVER generate simplified `Scene.tsx`, `Subtitle.tsx`, or `Composition.tsx` in a temp project
2. ❌ NEVER copy "simplified" versions of Remotion components to generated projects
3. ❌ NEVER create new Remotion projects with inline component definitions that duplicate existing work in `packages/renderer/src/remotion/`
4. ❌ NEVER use generated temp projects as the rendering target when `packages/renderer` already has complete implementations

**REQUIRED APPROACH:**
- ✅ ALWAYS use `packages/renderer/src/remotion/` as the Remotion project
- ✅ **Pass props (script, images) to the existing components in `packages/renderer/src/remotion/`** — this is how data flows from the CLI to the Remotion rendering pipeline
- ✅ The Remotion entry point should be `packages/renderer/src/remotion/index.ts` or `packages/renderer/src/remotion/Root.tsx`
- ✅ All animation work (Ken Burns, parallax, kinetic subtitles, transitions) must go through `packages/renderer/src/utils/animation-utils.ts`
- ✅ If a new animation feature is needed, add it to `packages/renderer/src/remotion/` AND update the renderer to use it directly
- ✅ **Props-based data flow: CLI → renderVideo(input) → Remotion Root via calculateMetadata/defaultProps → Scene → visualLayers/components**

**VIOLATION OF THIS RULE IS A CATASTROPHIC MISTAKE:**
- Phase 14 animation work was SILENTLY DESTROYED because someone generated simplified projects
- UAT tests passed but actual video output had NO animations — completely misleading
- This wastes days of development time and produces broken results
- Anyone who violates this should expect harsh consequences

**Write this down three times so it sinks in:**
1. Use `packages/renderer/src/remotion/` directly — not generated simplified copies
2. Use `packages/renderer/src/remotion/` directly — not generated simplified copies
3. Use `packages/renderer/src/remotion/` directly — not generated simplified copies

---

| **Props-based data flow to Remotion** | Data (script, images) MUST be passed via Remotion props system — use calculateMetadata/defaultProps | Animations and layouts receive no content if data doesn't flow through props |
| **ESM requires .js extension** on relative imports in packages/types | TypeScript ESM compatibility requirement | Module resolution failures in packages |
| **@video-script/types as workspace:\*** dependency | Allows local development without npm publish; renderer uses local types | Version conflicts if published to npm |
| **Scene adapter converts visual.json → visualLayers** | visualAgent outputs visual.json, must be converted to visualLayers format for layout components | Layouts receive empty data, nothing renders |
| **layoutTemplate optional field** with 9 values (8 layouts + inline fallback) | Agent-driven layout selection; Scene.tsx routes to layout components when set | Layout system cannot be used by agents |
| **CRF 20 for H.264 encoding** | High quality H.264 at reasonable file size | Quality degradation or larger file sizes |
| **deviceScaleFactor 2** for screenshot capture | Retina-quality screenshots at 2x resolution | Blurry/low-res screenshots |
| **30-frame settling buffer** for spring animations | Ensures spring animations fully settle before scene ends | Animation extrapolation artifacts |
| **Slide direction alternates**: odd scenes from-left, even scenes from-right | Visual variety, professional pacing | Repetitive transitions feel mechanical |
| **First/last scene handling**: no enter transition for first, no exit for last | Clean scene boundaries | Awkward transitions at video start/end |
| **Turndown + Readability for article extraction** | Proper article content extraction vs regex-based htmlToMarkdown | Shallow/incorrect content extraction |
| **linkedom for DOM parsing** | Required by Readability in Node.js environment | Readability fails on complex pages |
| **KineticSubtitle per-word highlighting component** | Animated subtitles synchronized with narration | Static SRT subtitles only |
| **Non-blocking quality evaluation** pattern | Quality agent runs async with callbacks; warns but never blocks pipeline | Research/script quality not measured |

## Uncertain Technical Decisions

**These decisions have KNOWN UNCERTAINTY. They may need revision based on testing or user feedback. Agents should FLAG before changing.**

| Decision | Uncertainty | Investigation Needed |
| -------- | ----------- | ------------------- |
| **linkedom DOM parser** | May have compatibility issues with complex JavaScript-rendered pages | Test with more websites; may need JSDOM or Playwright's.evaluate |
| **30-frame spring settling buffer** | Derived empirically; may need tuning for different animation types | Benchmark with actual renders; adjust per animation type |
| **Non-blocking quality evaluation** | Pattern established but not fully integrated into main pipeline | Verify it doesn't block but still provides useful feedback |
| **Single render path (npx remotion render)** | CONCERNS.md notes duplicate rendering paths exist (process-manager.ts vs video-renderer.ts) | Consolidate to single path after Phase 14 |

**RESOLVED:**
- ~~AnnotationRenderer excluded from generated projects~~ — RESOLVED: The entire "generated project" approach was fundamentally wrong. Use `packages/renderer/src/remotion/` directly instead.

---

_Architecture decisions locked: 2026-03-24_

---

## CRITICAL INCIDENT: Phase 14 Animation Work Was Silently Destroyed

**Date:** 2026-03-24
**Issue:** Phase 14 animation engine (Ken Burns, parallax, exit animations, kinetic subtitles) was fully implemented and UAT passed (11/11), but actual video rendering produced videos with NO animations.

**Root Cause:** `remotion-project-generator.ts` generated completely separate simplified code that IGNORED all Phase 14 work in `packages/renderer/src/remotion/`. The generated `Scene.tsx` used only basic `opacity` fade — not the real components with animation logic.

**Fix Required:** Use `packages/renderer/src/remotion/` directly as the Remotion project instead of generating simplified copies. This is now LOCKED in the architecture decisions above.

**Lesson Learned:** UAT tests that only check source code files will PASS even if the rendered video is completely broken. Always verify actual rendered output matches expected behavior.

---

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

### v1.1 → v1.2 Transition (2026-03-23)

**v1.1 shipped:** 16/16 requirements complete, 13 phases, 35 plans. Core pipeline functional.

**v1.2 problem statement:** Current output is functional but not impressive. Specific gaps:

- Only fade-in animation (vs AI Jason's 10+ animation types)
- Screenshot capture misses content, includes nav bars
- Research/script content is hollow and generic
- Visual style is flat with no depth or hierarchy
- Static SRT subtitles (vs kinetic word-by-word typography)

**v1.2 target quality:** AI Jason / WorldofAI level — dark mode aesthetic, kinetic typography, Ken Burns parallax, content-aware screenshots, tutorial-depth narration with concrete examples.

**Research sources:** claude-remotion-kickstart (component patterns), remotion-dev/template-prompt-to-video (Ken Burns + blur + per-word animation), AI Jason channel analysis (dark mode, callouts, pacing).

**v1.2 scope:** 4 phases (Animation Engine → Screenshot+Content → Visual Polish → E2E Testing), 19 requirements.

---

_Last updated: 2026-03-23 after v1.2 milestone creation_
