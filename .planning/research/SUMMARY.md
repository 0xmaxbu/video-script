# Project Research Summary

**Project:** video-script improvements
**Domain:** AI video generation tool (technical tutorial videos)
**Researched:** 2026-03-22
**Confidence:** MEDIUM

## Executive Summary

video-script is an AI-powered CLI tool that generates technical tutorial videos through a four-agent pipeline (Research -> Script -> Visual -> Screenshot -> Compose) with a two-process architecture isolating Remotion rendering in a separate subprocess. The current system has solid foundations but lacks deep content extraction, animated annotation rendering, and a comprehensive layout system.

Research identifies three enhancement areas: (1) Deep Research Agent - replacing regex-based HTML extraction with Turndown + Readability for semantic chunking; (2) Visual Effects - implementing SVG-based annotation rendering in Remotion with spring animations; (3) PPT-Style Layouts - building a grid-based layout system with proper zone definitions. The recommended stack for these improvements relies on proven technologies (Turndown, SVG, CSS Grid) with HIGH confidence, while animation patterns (@remotion/motion) have MEDIUM confidence from training data.

Key risks center on content extraction capturing DevTools/debug content instead of actual page content, animation extrapolation causing elements to disappear, and cloud rendering performance without GPU budget. These are all preventable with proper detection patterns and benchmarking.

## Key Findings

### Recommended Stack

The research recommends targeted additions to the existing stack with minimal new dependencies. For web content extraction, **Turndown** (verified, 11k stars) replaces regex-based HTML-to-Markdown conversion, with optional **Mozilla Readability** for main content extraction and **Cheerio** for targeted DOM traversal. For visual effects, **SVG overlays** (native React, no library needed) handle all annotation types (circle, underline, arrow, box, number), composed with **@remotion/motion** for spring animations. For layouts, **Custom React + CSS** (CSS Grid/Flexbox) provides full control without dependency bloat.

**Core technologies:**
- **Turndown**: HTML-to-Markdown — verified active project, GFM support, extensible rules
- **Mozilla Readability**: Article extraction — removes nav/ads/sidebars, extracts title/byline/excerpt
- **Cheerio**: DOM traversal — jQuery-like API, fast parsing, targeted extraction
- **SVG overlays**: All annotation types — circles, lines, arrows, text via native SVG
- **@remotion/motion**: Spring animations — purpose-built for Remotion
- **CSS Grid/Flexbox**: Layout implementation — full control, no library overhead

### Expected Features

**Must have (table stakes):**
- URL fetching — already implemented via web-fetch tool
- HTML parsing — standard cheerio/jsdom approach
- Code syntax highlighting — already implemented via Shiki
- Screenshot display — already implemented via Playwright
- Text highlighting — partial implementation, needs animation

**Should have (competitive):**
- Semantic chunking — breaks content into meaningful sections (problem, solution, code, caveats) rather than DOM nodes; key differentiator from surface-level extractors like Glarity
- Animated annotation layers — pulse, glow, trace effects to guide eye; numbered callout sequences for multi-step tutorials
- Zoom-and-pan — smooth camera movement over screenshots for cinematic feel
- Dynamic layouts — content-driven arrangement avoiding template monotony

**Defer (v2+):**
- Drawing/pen stroke animations — high complexity, niche appeal
- Full academic paper parsing — specialized use case
- 3D transforms or complex transitions
- Generic summarization (loses technical nuance)

### Architecture Approach

The existing four-agent pipeline remains intact. Enhancement integration points are:

1. **Deep Research Agent**: Add multi-round research loop via new `deepResearchTool` with iterative fetch -> gap analysis -> follow-up -> synthesis. Low complexity changes: add response caching, tool selection logic, source quality scoring.

2. **Annotation Renderer**: New `AnnotationRenderer.tsx` component in composition layer (overlay on Scene). Uses `spring()` and `interpolate()` verified patterns from Remotion docs. Annotation types already defined in `visual.ts`, only rendering is missing.

3. **Grid Layout System**: New layout components in `src/remotion/layouts/` (HeroFullscreen, SplitHorizontal, etc.) plus `MasterSlide.tsx` base component. Extend `LayoutTemplateEnum` with grid zones.

**Major components:**
1. Research Agent — fetches, extracts, synthesizes markdown with priority tags
2. Script Agent — converts to narration with time-segmented highlights
3. Visual Agent — creates layout + annotation plans with narrationBinding
4. Screenshot Agent — captures based on ScreenshotType
5. Compose Agent — generates Remotion TSX project
6. Renderer Subprocess — isolated zod v3 for Remotion rendering

### Critical Pitfalls

1. **Research Agent Extracts DevTools/Debug Content** — Simple regex HTML-to-Markdown converts `<script>` content including React Server Components payload (`self.__next_f.push(...)`). Prevention: Always extract from rendered DOM via Playwright, filter script/style tags, detect high script-to-text ratio.

2. **Spring Animation Duration Misunderstanding** — Spring `delay` delays final result, not stretching phase. Order: `durationInFrames` first, then `reverse`, then `delay`. Prevention: Add extra frames for settling (`durationInFrames + Math.ceil(1000 / fps)`).

3. **interpolate() Extrapolation Without Clamping** — Default `extrapolateRight: 'extend'` allows values outside output range (scale=2 at frame 40 when mapped [0,20]->[0,1]). Prevention: Always use `extrapolateRight: 'clamp'` and `extrapolateLeft: 'clamp'` unless explicitly wanted.

4. **Heavy Effects Without Performance Budget** — GPU effects work locally but timeout/corrupt on cloud. Prevention: Profile with `--log=verbose`, run `npx remotion benchmark`, replace dynamic effects with precomputed images, use `--scale` for previews.

5. **Non-Atomic Source References** — Citations `[1]` reference different parts of source document across sections. Prevention: Require `[N-start:N-end]` range notation, validate citation-topic relationships.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Annotation Renderer
**Rationale:** Clear value proposition, self-contained component, no upstream changes required. Builds on existing `visual.ts` annotation types that are currently defined but not rendered.

**Delivers:** `AnnotationRenderer.tsx` component with SVG-based circle, underline, arrow, box, number annotations. Spring animations with preset damping/stiffness profiles.

**Addresses:** Visual annotation effects (FEATURES.md) — animated highlights, numbered callouts

**Avoids:** interpolate() extrapolation pitfall (all animations must clamp). Spring timing issues (add extra frames for settling).

**Uses:** SVG overlays + @remotion/motion from STACK.md

### Phase 2: Grid Layout System
**Rationale:** Foundational for complex layouts. After annotation layer is working, layouts can incorporate annotations properly. Templates defined in `visual.ts` need actual components.

**Delivers:** Layout component library (`src/remotion/layouts/`) with HeroFullscreen, SplitHorizontal, SplitVertical, TextOverImage, CodeFocus, Comparison, BulletList, Quote, TitleSlide, ThreeColumn, GridLayout. Master slide base component with CSS Grid zones.

**Addresses:** PPT-style layouts (FEATURES.md) — dynamic layouts, grid-based alignment, visual hierarchy

**Implements:** Architecture integration point 3

**Avoids:** Transition timing misalignment (keep enter/exit symmetrical).

### Phase 3: Deep Research Loop
**Rationale:** Affects upstream only, lower integration risk. Semantic chunking improves content quality for downstream agents. Can be validated independently before visual pipeline changes.

**Delivers:** `deepResearchTool` with multi-round fetch -> gap analysis -> follow-up -> synthesis. Turndown + Readability integration replacing regex. Source quality scoring in types.

**Addresses:** Deep content research (FEATURES.md) — semantic chunking, credibility scoring, code extraction

**Uses:** Turndown, Readability, Cheerio from STACK.md

**Avoids:** DevTools/debug content pitfall (Playwright rendering, content validation).

### Phase 4: Transition Effects
**Rationale:** Low effort, high impact. Enhances existing layouts with fade, slide, wipe transitions. Depends on grid system in Phase 2.

**Delivers:** Transition components for scene-to-scene flow with configurable duration and easing.

**Addresses:** Standard video editing transitions

### Phase 5: Master Slides & Advanced Layouts
**Rationale:** Advanced abstraction for brand theming and reusable slide patterns. Depends on Phase 2 grid system.

**Delivers:** Master slide patterns with theme support, progressive disclosure layouts.

### Phase Ordering Rationale

- **Annotations first** because they are self-contained and provide immediate visual impact
- **Grid layouts second** because they establish the foundation for all subsequent visual work
- **Deep research third** because it only affects upstream (lower risk) and improves content quality
- **Transitions fourth** because they enhance existing layouts with minimal new components
- **Master slides last** because they are advanced abstraction requiring all other pieces in place

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Deep Research Loop):** Multi-round agent tool-use patterns need API research; gap analysis logic needs LLM prompt engineering validation

Phases with standard patterns (skip research-phase):
- **Phase 1 (Annotation Renderer):** Remotion spring/interpolate patterns verified in official docs
- **Phase 2 (Grid Layouts):** CSS Grid is well-documented, layout templates already defined in codebase

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Turndown verified (HIGH); @remotion/motion training data only (MEDIUM) |
| Features | LOW | WebSearch unavailable; training data only; competitor analysis incomplete |
| Architecture | MEDIUM-HIGH | Codebase analysis + verified Remotion docs; two-process model confirmed |
| Pitfalls | MEDIUM | Remotion docs HIGH; others from training data and GitHub discussions |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Semantic chunking specifics:** How to break content into problem/background/solution/code/causes sections — needs prompt engineering research
- **@remotion/motion validation:** Could not verify URL during research — confirm compatibility when WebSearch available
- **Tailwind CSS in Remotion:** If adopting, verify Remotion compatibility (training data only)
- **Deep research quality scoring:** How to weight source authority against recency/citation count — needs decision

## Sources

### Primary (HIGH confidence)
- [Remotion spring docs](https://remotion.dev/docs/spring) — verified animation patterns
- [Remotion interpolate docs](https://remotion.dev/docs/interpolate) — verified extrapolation behavior
- [Remotion AbsoluteFill docs](https://remotion.dev/docs/absolute-fill) — verified layering
- [Turndown GitHub](https://github.com/domchristie/turndown) — verified active, 11k stars

### Secondary (MEDIUM confidence)
- [Mozilla Readability](https://github.com/mozilla/readability) — training data; Firefox Reader View implementation
- [Cheerio GitHub](https://github.com/cheeriojs/cheerio) — training data; jQuery-like API
- [GitHub Remotion discussions](https://github.com/remotion-dev/remotion/discussions) — real user issues
- [Web content extraction issues](https://www.zed.dev/blog/web-scraping) — content extraction best practices

### Tertiary (LOW confidence)
- @remotion/motion — could not verify URL during research
- Recharts — training data, needs verification for Remotion compatibility
- Tailwind CSS — training data, needs verification for Remotion compatibility
- FEATURES.md feature landscape — WebSearch unavailable, training data only

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
