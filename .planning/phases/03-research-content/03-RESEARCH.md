# Phase 3: Research & Content - Research

**Researched:** 2026-03-22
**Domain:** Web content extraction, LLM agent evaluation, script generation with narration timing
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 addresses the core pipeline failure discovered in testing: the research agent extracts placeholder content instead of real article content. The root cause is the simplistic `htmlToMarkdown()` function in `web-fetch.ts` that uses regex-based HTML parsing rather than proper content extraction. This phase fixes web content extraction using Turndown + @mozilla/readability, adds input/output validation layers with retry logic, introduces relationship tags (cause/comparison/example/caveat) for semantic chunking, and adds an independent quality evaluation agent that scores content depth without blocking the pipeline. The script agent is updated to generate narration with proper timing segments and scene structure.

**Primary recommendation:** Replace `htmlToMarkdown()` with Turndown + @mozilla/readability for proper content extraction, add validation layer before LLM processing, and add quality evaluation agent as non-blocking enhancement.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Single deep research (no multi-round iteration) — fix single-pass first, v2 adds iteration
- **D-02:** Hierarchical chunking with relationship tags (原因/对比/示例/注意事项) — script agent can reconstruct narrative logic
- **D-03:** Narration tone = tutorial-friendly (讲解型，像老师上课)
- **D-04:** Scene distribution = content-driven with defaults — agent auto-assigns scene count based on content, CLI `--duration` flag overrides
- **D-05:** Video duration = fixed 10-15 minutes, CLI configurable via `--duration` flag
- **D-06:** Content elasticity — too little: add examples; too much: compress supporting content
- **D-07:** Code display = camera pan/zoom effect (code image shown full, but video uses camera movement to reveal sections sequentially)
- **D-08:** Multi-topic handling = split topics — each topic generates independent research + script
- **D-09:** Research failure = 3 retries, then fail with specific error reason (no fallback to prompt engineering)
- **D-10:** Input layer validation (after web fetch): word count threshold (<500 chars = suspicious), placeholder detection (finds `placeholder`/`example.com` = fail), HTML structure validation (checks for `<p>`, `<code>` tags) — retry 3 times on any failure
- **D-11:** Output layer validation: Zod schema validation for priority tags and source index format; independent LLM evaluation agent for quality scoring (depth, logical coherence, hallucination detection) — non-blocking but records quality score, warns at minimum threshold

### Claude's Discretion

- Specific camera motion speed and timing curve details
- Zod schema specific field definitions
- LLM evaluation agent specific prompt template
- Example addition strategy (which types of examples to add)

### Deferred Ideas (OUT OF SCOPE)

- Multi-round iterative research + gap analysis + follow-up (current single-pass first)
- User-configurable example addition strategy
- Multi-language narration support (current Chinese only)
- Different platform duration presets (BiliBili vs Twitter vs YouTube Shorts)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RES-01 | Research agent performs deep content analysis — not placeholder links | Turndown + Readability replaces regex HTML parsing; proper content extraction from actual article content |
| RES-02 | Research crawls actual paper/article content using Turndown + Readability | New `content extraction pipeline` in web-fetch.ts using Turndown + @mozilla/readability |
| RES-03 | Research extracts semantic chunks (problem/solution/code/caveats) preserving logical flow | Relationship tags: 原因(reason), 对比(comparison), 示例(example), 注意事项(caveat) added to ResearchOutput schema |
| SCR-01 | Script generates content with depth — thorough explanations | Tutorial-friendly narration tone (D-03), content-driven scene distribution (D-04) |
| SCR-02 | Scene narration is engaging, not generic summaries | Scene narration with highlights and codeHighlights, annotation suggestions for visual emphasis |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| turndown | ^7.2.0 | Convert HTML to Markdown | Best-in-class HTML→MD conversion; used by @mozilla/readability output |
| @mozilla/readability | ^0.5.0 | Extract clean article content | Mozilla's proven content extraction; pairs with Turndown |
| zod | ^3.24.0 | Schema validation | Project standard (zod v4 in main, v3 in renderer) |

**Installation:**
```bash
npm install turndown @mozilla/readability
```

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| mastra | ^1.0.0 | Agent framework | New quality agent follows existing agent patterns |
| linkedom | ^0.18.0 | DOM parsing for Readability | Required peer for @mozilla/readability in Node.js |

**Installation:**
```bash
npm install linkedom
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Turndown + Readability | mozilla/readability alone | Readability outputs DOM, Turndown converts to Markdown — they compose |
| Turndown + Readability | regex-based htmlToMarkdown | Current regex approach fails on complex pages; Turndown+Readability handles edge cases |
| linkedom | jsdom | Lighter weight, sufficient for content extraction |

---

## Architecture Patterns

### Recommended Project Structure

```
src/mastra/
├── agents/
│   ├── research-agent.ts     # MODIFIED: uses new content extraction pipeline
│   ├── script-agent.ts       # MODIFIED: uses new narration schema
│   └── quality-agent.ts      # NEW: independent evaluation agent
├── tools/
│   ├── web-fetch.ts          # MODIFIED: uses Turndown + Readability
│   └── validators/
│       ├── input-validator.ts  # NEW: validates web fetch output
│       └── output-validator.ts # NEW: validates LLM output
├── pipelines/
│   └── research-pipeline.ts    # NEW: orchestrates fetch → validate → research
└── quality/
    ├── quality-schemas.ts       # NEW: quality score schema
    └── quality-prompt.ts        # NEW: quality evaluation prompt template
```

### Pattern 1: Content Extraction Pipeline (Fetch → Extract → Validate)

**What:** Web content flows through: fetch HTML → parse with Readability → convert with Turndown → validate → pass to research agent

**When to use:** Every research request

**Flow:**
```
fetch(url) → Readability.parse(doc) → Turndown.turndown(content) → validate() → research agent
```

**Why:** The current `htmlToMarkdown()` regex approach fails on complex pages. Readability extracts clean article content before conversion, dramatically improving quality.

**Source:** [@mozilla/readability README](https://github.com/mozilla/readability) — "Readability is aimed at extracting the primary content from a web page, removing clutter."

### Pattern 2: Input Validation Layer

**What:** After fetch, validate content before passing to LLM. Retry on failure.

**When to use:** After every web fetch in research pipeline

**Implementation (D-10):**
```typescript
// 1. Word count check: < 500 chars = suspicious
// 2. Placeholder detection: finds "placeholder", "example.com" = fail
// 3. HTML structure: checks for <p>, <code> tags = fail

function validateFetchedContent(content: string): ValidationResult {
  const checks = [
    { name: 'wordCount', pass: content.length >= 500 },
    { name: 'placeholder', pass: !/(placeholder|example\.com)/i.test(content) },
    { name: 'htmlStructure', pass: /<p>.*<\/p>|<code>.*<\/code>/s.test(content) },
  ];
  return { valid: checks.every(c => c.pass), failures: checks.filter(c => !c.pass) };
}
```

**Source:** Project D-10 decision in 03-CONTEXT.md

### Pattern 3: Relationship Tags for Semantic Chunks (D-02)

**What:** Research output includes relationship tags that help script agent reconstruct narrative logic.

**Tags:**
- `原因` (reason): Why something works or matters
- `对比` (comparison): Comparing alternatives or before/after
- `示例` (example): Concrete code or use case
- `注意事项` (caveat): Warnings or important notes

**Example:**
```markdown
### 1. NoInfer 工具类型 [priority: important][relationship: 示例]

`NoInfer<T>` 用于阻止类型推断...

[relationship: 原因] 解决闭包中类型收窄丢失的问题
```

### Pattern 4: Non-Blocking Quality Evaluation (D-11)

**What:** Independent LLM evaluation agent runs in parallel, scores output quality but does not block main pipeline.

**When to use:** After research agent generates output

**Evaluation dimensions:**
- 内容深度 (content depth)
- 逻辑连贯性 (logical coherence)
- 幻觉检测 (hallucination detection)

**Quality score threshold:** Agent warns user if score falls below minimum, but pipeline continues.

**Source:** Project D-11 decision in 03-CONTEXT.md

### Anti-Patterns to Avoid

- **Don't use regex HTML parsing for content extraction** — Current `htmlToMarkdown()` fails on complex pages. Use Turndown + Readability instead.
- **Don't block pipeline with quality evaluation** — Quality agent is advisory (D-11: "不 blocking")
- **Don't retry on validation failure without retry limit** — D-09: max 3 retries

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML to Markdown conversion | Custom regex parser | Turndown + @mozilla/readability | Handles malformed HTML, nested structures, code blocks correctly |
| Content extraction | String matching for article content | @mozilla/readability | Mozilla's proven algorithm identifies article vs. noise |
| Quality scoring | Heuristics | Independent LLM evaluation agent | Nuance of "depth" and "hallucination" requires semantic understanding |
| Retry logic | Ad-hoc if/else | withRetry utility (already in project) | Consistent retry with exponential backoff already exists at `src/utils/retry.ts` |

**Key insight:** The core failure in the current pipeline is content extraction. Building a better regex parser will fail again on edge cases. Turndown + Readability is the community-standard solution.

---

## Common Pitfalls

### Pitfall 1: Readability in Node.js requires a DOM parser
**What goes wrong:** `@mozilla/readability` expects a browser-like `Document` object; raw Node.js `fetch` returns HTML string.
**Why it happens:** Readability.parse() needs DOM, not HTML string.
**How to avoid:** Use `linkedom` to parse HTML into DOM-compatible object:
```typescript
import { parseHTML } from 'linkedom';
const { document } = parseHTML(html);
const reader = new Readability(document);
const article = reader.parse();
```
**Warning signs:** `TypeError: Readability is not a constructor` or `document is not defined`

### Pitfall 2: Research agent returns placeholder content
**What goes wrong:** Links resolve to placeholder URLs like `https://placeholder.example.com`.
**Why it happens:** web-fetch tool URL resolution fails, returns fallback/placeholder.
**How to avoid:** Input validation (D-10) catches placeholder patterns and triggers retry.
**Warning signs:** Output contains `placeholder`, `example.com`, or word count < 500

### Pitfall 3: Script agent output doesn't match visual layer expectations
**What goes wrong:** Visual agent expects `NewSceneSchema` but script agent outputs old `SceneScriptSchema`.
**Why it happens:** Schema mismatch between script-agent.ts output and types/index.ts `NewSceneSchema`.
**How to avoid:** Ensure script agent uses `NewScriptOutputSchema` from `src/types/visual.ts` — includes `narration.segments[]`, `highlights[]`, `codeHighlights[]`.

### Pitfall 4: Quality agent blocks pipeline on low score
**What goes wrong:** Pipeline waits for quality evaluation before proceeding.
**Why it happens:** Implementing quality agent as synchronous blocking call.
**How to avoid:** Quality agent runs as async fire-and-forget with callback or event emission. D-11 explicitly says "不 blocking".

---

## Code Examples

### Content Extraction Pipeline (web-fetch.ts upgrade)

```typescript
// Source: turndown + @mozilla/readability composition
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import Turndown from 'turndown';

const td = new Turndown();

async function fetchAndExtract(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();

  // Parse HTML into DOM using linkedom
  const { document } = parseHTML(html);

  // Extract article content
  const reader = new Readability(document, { charThreshold: 0 });
  const article = reader.parse();

  if (!article) {
    throw new Error('READABILITY_FAILED');
  }

  // Convert to Markdown
  const markdown = td.turndown(article.content);

  return markdown;
}
```

### Input Validation Function

```typescript
// Source: D-10 decision in 03-CONTEXT.md
interface ValidationResult {
  valid: boolean;
  failures: Array<{ name: string; reason: string }>;
}

function validateFetchedContent(content: string, url: string): ValidationResult {
  const failures: Array<{ name: string; reason: string }> = [];

  // 1. Word count threshold: < 500 chars = suspicious
  if (content.length < 500) {
    failures.push({
      name: 'wordCount',
      reason: `Content too short (${content.length} chars), likely extraction failure`
    });
  }

  // 2. Placeholder detection
  if (/(placeholder|example\.com|localhost)/i.test(content)) {
    failures.push({
      name: 'placeholder',
      reason: 'Content contains placeholder text'
    });
  }

  // 3. HTML structure validation
  const hasParagraphs = /<p>[\s\S]*?<\/p>/.test(content);
  const hasCode = /<code>[\s\S]*?<\/code>/.test(content);
  if (!hasParagraphs && !hasCode) {
    failures.push({
      name: 'htmlStructure',
      reason: 'No <p> or <code> tags found, likely not article content'
    });
  }

  return {
    valid: failures.length === 0,
    failures
  };
}
```

### ResearchOutput Schema with Relationship Tags

```typescript
// Source: D-02 decision in 03-CONTEXT.md
// Extends existing ResearchOutputSchema from src/types/research.ts

const RelationshipTagEnum = z.enum(['原因', '对比', '示例', '注意事项']);

const SemanticChunkSchema = z.object({
  order: z.number().int().positive(),
  sentence: z.string().min(1),
  keyContent: z.object({
    concept: z.string(),
    // NEW: relationship tags
    relationships: z.array(RelationshipTagEnum).optional(),
    relationshipNotes: z.record(z.string(), z.string()).optional(),
  }),
  links: z.array(ResearchLinkSchema).min(1),
});

// Updated ResearchOutputSchema
const ResearchOutputWithRelationshipsSchema = z.object({
  title: z.string().min(1),
  segments: z.array(SemanticChunkSchema).min(1).max(20),
});
```

### Quality Agent (Non-Blocking)

```typescript
// Source: D-11 decision in 03-CONTEXT.md
// Quality agent runs asynchronously, records score, does not block pipeline

const qualityAgent = new Agent({
  id: 'quality-agent',
  name: 'Quality Evaluation Agent',
  instructions: `Evaluate research content quality across three dimensions:
1. 内容深度 (content depth): Does it provide thorough explanations?
2. 逻辑连贯性 (logical coherence): Does it preserve logical flow?
3. 幻觉检测 (hallucination detection): Are claims supported by sources?

Output JSON: { "scores": { "depth": 1-5, "coherence": 1-5, "hallucination": 1-5 }, "warnings": [], "qualityScore": number }`,
  model: 'minimax-cn-coding-plan/MiniMax-M2.5',
});

// Usage: fire-and-forget
async function evaluateQuality(content: string): Promise<void> {
  qualityAgent
    .run(content)
    .then(result => {
      const score = JSON.parse(result.text).qualityScore;
      if (score < MINIMUM_QUALITY_THRESHOLD) {
        console.warn(`Quality score ${score} below threshold ${MINIMUM_QUALITY_THRESHOLD}`);
        // Notify user but do NOT block
      }
    })
    .catch(err => console.error('Quality evaluation failed:', err));
  // Pipeline continues immediately
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Regex htmlToMarkdown() | Turndown + Readability | Phase 3 | Dramatically better content extraction from real articles |
| Single-pass research | Single deep research with validation | Phase 3 (D-01) | More reliable content extraction |
| No relationship tags | Relationship tags (原因/对比/示例/注意事项) | Phase 3 (D-02) | Script agent can reconstruct narrative logic |
| No quality evaluation | Independent LLM evaluation agent | Phase 3 (D-11) | Catches depth/hallucination issues non-blocking |
| Fixed scene count | Content-driven scene distribution | Phase 3 (D-04) | More appropriate scene breakdown per content |

**Deprecated/outdated:**
- `htmlToMarkdown()` regex function: Replaced by Turndown + Readability
- `SceneScriptSchema`: Superseded by `NewSceneSchema` from `src/types/visual.ts`
- Research agent Markdown output format: Superseded by structured `ResearchOutputWithRelationshipsSchema`

---

## Open Questions

1. **Relationship tag granularity**
   - What we know: D-02 specifies 4 tag types (原因/对比/示例/注意事项)
   - What's unclear: Should these be required per chunk or optional? Can a chunk have multiple tags?
   - Recommendation: Make optional, allow multiple per chunk. Parser-friendly but LLM-flexible.

2. **Quality agent prompt template**
   - What we know: Three evaluation dimensions (depth, coherence, hallucination)
   - What's unclear: Exact scoring rubric (1-5 how?), what constitutes "minimum threshold"
   - Recommendation: Start with 1-5 scale, threshold at 3.0 average. Refine after testing.

3. **Content elasticity — example addition**
   - What we know: D-06 says "内容少了：增加示例展示"
   - What's unclear: Which types of examples? How many? Added by script agent or research agent?
   - Recommendation: Script agent adds concrete code examples when content is thin. Research agent flags "needs example" relationship.

4. **Camera pan/zoom effect implementation**
   - What we know: D-07 says code shown via camera movement, not static full view
   - What's unclear: Animation timing, speed curves, how scene duration relates to number of code sections
   - Recommendation: Defer to Phase 4 (Animation Transitions). Script agent only marks code highlights; visual agent handles animation.

---

## Sources

### Primary (HIGH confidence)
- [@mozilla/readability](https://github.com/mozilla/readability) — Mozilla's content extraction library
- [Turndown](https://github.com/mixmark-io/turndown) — HTML to Markdown converter
- [linkedom](https://github.com/nicolo-ribaudo/linkedom) — DOM parser for Node.js (peer for Readability)
- `src/mastra/agents/research-agent.ts` — Current research agent implementation
- `src/mastra/agents/script-agent.ts` — Current script agent implementation
- `src/mastra/tools/web-fetch.ts` — Current web fetch tool (to be replaced)
- `src/types/visual.ts` — NewSceneSchema, NewScriptOutputSchema

### Secondary (MEDIUM confidence)
- Project decisions from 03-CONTEXT.md (user-locked decisions, authoritative for this phase)
- State.md notes about pipeline failure ("research agent 连真实内容都没能提取")

### Tertiary (LOW confidence)
- Quality agent scoring rubric — not yet designed, needs validation

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH — Turndown/Readability are well-documented; specific version compatibility with Node.js needs verification
- Architecture: HIGH — Project patterns well established; new quality agent follows existing mastra agent pattern
- Pitfalls: MEDIUM — linkedom requirement is known; other pitfalls identified from pipeline failure analysis

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days — stable technology)
