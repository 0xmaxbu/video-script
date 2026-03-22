# Feature Landscape: Video-Script Improvements

**Domain:** AI video generation for technical tutorials
**Researched:** 2026-03-22
**Confidence:** LOW (WebSearch unavailable; training data only)

---

## 1. Deep Content Research / Crawling

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| URL fetching | Basic requirement | Low | Already implemented via web-fetch tool |
| HTML parsing | Extract text content | Low | Standard cheerio/jsdom approach |
| Link extraction | Discover related content | Low | Standard scraping |

### Differentiators (What Sets Products Apart)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Semantic chunking** | Breaks content into meaningful sections (paragraphs, code blocks, arguments) not just DOM nodes | Med | Key differentiator - competitors like Glarity, YouTubeSummary use surface-level extraction |
| **Multi-page traversal** | Crawls related pages, follows navigation, builds content graph | High | Not just fetching URLs but understanding site structure |
| **Paper/Academic analysis** | Parses citations, extracts methodology, summarizes findings, identifies claims vs evidence | High | Tools like SciSpace, Consensus specialize here |
| **Code extraction + explanation** | Identifies code blocks, explains what they do, traces execution paths | Med | Already partially done via Shiki highlighting |
| **Multi-modal synthesis** | Combines text + diagrams + code + tables into coherent narrative | High | Current pipeline does this but could be deeper |
| **Question-answering against content** | Not just summarize but answer specific questions from the source | Med | RAG-style approach on fetched content |
| **Source credibility scoring** | Evaluates source authority, recency, citation count | Med | Important for technical accuracy |

### Anti-Features to Avoid

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Blind link following | Infinite loops, spam, irrelevant content | User provides curated link list (current approach is correct) |
| Full site crawls | Memory explosion, irrelevant noise | Scope to provided URLs only |
| Generic summarization | Loses technical nuance | Preserve structure: problem, solution, code, caveats |

### Standard Patterns

1. **Fetch → Parse → Extract → Summarize** (linear pipeline)
2. **RAG-based Q&A** on fetched content
3. **Tree-of-thought** for analyzing complex papers
4. **Citation graph building** for academic content

### Recommendation for video-script

The current research agent fetches and analyzes. Differentiator opportunity: **deeper semantic chunking** that preserves logical flow (problem statement, background, solution, code examples, edge cases). Current approach may be too surface-level.

---

## 2. Visual Annotation Effects

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Text highlighting | Draw attention to key terms | Low | Standard in all tutorial videos |
| Code syntax highlighting | Essential for technical content | Low | Already implemented via Shiki |
| Screenshot display | Show what user sees | Low | Already implemented via Playwright |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Animated highlights** | Pulse, glow, or trace effect to guide eye | Med | Motion draws attention better than static |
| **Numbered callout sequences** | Multi-step annotations appear in order | Med | Great for tutorials showing steps |
| **Spotlight/shadow effects** | Dim everything except focal area | Med | Focus attention on specific UI element |
| **Zoom-and-pan** | Smooth camera movement over screenshots | Med | Creates cinematic feel, avoids static slides |
| **Drawing/pen strokes** | Hand-drawn effect annotations | Med-High | Popular in explainer videos (Loom, Vidyard) |
| **Arrow/connector animations** | Show relationships, click paths | Low-Med | Essential for pointing to UI elements |
| **Animated diagrams** | Build diagrams piece by piece | High | Explains complex processes well |
| **Transition wipes/fades** | Scene-to-scene flow | Low | Standard video editing |

### Anti-Features to Avoid

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Excessive animation | Distracting, reduces professionalism | Subtle entrance animations only |
| Text-to-speech sync animations | Complex to implement, fragile | Pre-defined scene timing |
| 3D transforms | Overkill for technical tutorials | Flat annotations are clearer |
| Random/chaotic motion | Makes content harder to follow | Purposeful, directed motion |

### Standard Patterns

1. **Highlight → Fade pattern**: Callout appears, pulses once, fades slightly to persistent state
2. **Step reveal**: Numbered items appear sequentially
3. **Zoom-in on click**: Show detail, then pull back
4. **Cursor animation**: Animated cursor shows clicks/keypresses
5. **Typing simulation**: Code appears character-by-character

### Current State in video-script

Based on recent commits, the pipeline uses Shiki for code highlighting and Playwright for screenshots. Annotation effects appear limited to static highlights. **Opportunity**: Add animated annotation layers in Remotion composition.

---

## 3. PPT-Style Layout Principles for Video

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Title cards | Clear segment identification | Low | Standard in all video production |
| 16:9 aspect ratio | Standard video format | Low | Already handled by Remotion |
| Consistent typography | Professional appearance | Low | Requires brand guidelines |
| Centered focal point | Natural eye anchor | Low | Core principle |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Dynamic layouts** | Content-driven arrangement (not same template every scene) | Med | Avoids monotony |
| **Visual hierarchy by size** | Primary message largest, supporting details smaller | Low | Basic but often violated |
| **Breathing room / whitespace** | Clean, professional feel | Low | Underused in busy technical content |
| **Grid-based alignment** | Visual coherence across scenes | Med | Enforced consistency |
| **Progressive disclosure** | Layer information: title first, then details | Med | Prevents cognitive overload |
| **Visual contrast** | Dark/light, large/small creates rhythm | Low | Essential for engagement |
| **Code + commentary split** | Code on one side, narration context on other | Low-Med | Familiar from tutorials |
| **Screenshot annotation zones** | Designated areas for overlays/callouts | Med | Keeps content organized |

### Anti-Features to Avoid

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Centered everything | Boring, static feel | Off-center focal points (rule of thirds) |
| Full-screen text blocks | Hard to read, overwhelming | Short phrases, animated reveal |
| Clashing colors | Unprofessional | Consistent palette, high contrast |
| Information density everywhere | Cognitive overload | Alternate dense/sparse scenes |
| Ignoring safe zones | Text gets cut off | 10% margin from edges |

### Standard Patterns

1. **Title + subtitle layout**: Title top-center, subtitle below
2. **Code + narration split**: 60/40 or 50/50 horizontal split
3. **Screenshot with overlay zone**: Screenshot fills frame, annotations in corner
4. **Three-column for comparisons**: Side-by-side + summary
5. **Quote/callout styling**: Large quote with attribution
6. **Diagram + explanation**: Visual left, text right (or vice versa)

### Layout Grid Recommendation

For Remotion composition, consider a **12-column grid**:
- Safe zone: columns 1-12, rows 1-9 (10% margin)
- Content zone: columns 2-11, rows 2-8
- Annotation zone: columns 9-12, rows 6-8 (for callouts)
- Title position: columns 1-12, row 1 (top) or centered

---

## Feature Dependencies

```
Deep Content Research
├── URL fetching (exists)
├── Semantic chunking (gap)
├── Multi-modal synthesis (partial)
└── Credibility scoring (gap)

Visual Annotations
├── Static highlights (partial)
├── Animated highlights (gap)
├── Numbered callouts (gap)
├── Zoom/pan (gap)
└── Transition effects (gap)

PPT Layout Principles
├── Grid system (gap)
├── Safe zones (need to implement)
├── Dynamic layouts (gap)
└── Visual hierarchy (needs guidelines)
```

---

## MVP Recommendation

### Prioritize for immediate improvement:
1. **Semantic chunking in research** - biggest content quality impact
2. **Animated annotation layers in Remotion** - high visual impact
3. **Grid-based layout system** - foundational for consistency

### Defer:
- Drawing/pen stroke animations (high complexity, niche appeal)
- Full academic paper parsing (specialized use case)
- 3D transforms or complex transitions

---

## Sources

- LOW confidence - WebSearch unavailable during research
- Findings based on training data (knowledge cutoff may predate current ecosystem)
- Recommend verifying with current competitor analysis when search tools available
