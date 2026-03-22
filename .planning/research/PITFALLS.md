# Domain Pitfalls

**Domain:** AI Video Generation Tool Improvements
**Researched:** 2026-03-22
**Confidence:** MEDIUM

## Pitfall Sources

| Source | Confidence | Relevance |
|--------|------------|-----------|
| Remotion Official Docs | HIGH | Transitions, animations, performance |
| GitHub Discussions | MEDIUM | Real user issues |
| Web extraction best practices | MEDIUM | Content crawling issues |

---

## Critical Pitfalls

### Pitfall 1: Research Agent Extracts DevTools/Debug Content

**What goes wrong:** Agent captures React Server Components payload, Next.js serialization data, or DevTools panel content instead of actual page content.

**Why it happens:** Simple regex-based HTML-to-Markdown conversion (`<script>`, `<style>` not properly stripped) or fetching from wrong URLs (debug endpoints, localhost mirrors).

**Consequences:**
- Research output contains garbage (`self.__next_f.push(...)`, serialization metadata)
- Downstream script agent receives meaningless content
- Video script has no coherent narrative

**Prevention:**
- Always extract from rendered DOM, not raw HTML source
- Filter `<script>`, `<style>`, `<link rel="stylesheet">` before processing
- Detect and reject content with high script-to-text ratio
- Use Playwright for JavaScript-heavy pages

**Detection:**
```typescript
// Check for debug/devtools content signatures
const debugPatterns = [
  /self\.__next_f\.push/,
  /__NEXT_DATA__/,
  /__REACT_ERROR_BOUNDARY/,
  /webpackChunkName/,
];
const hasDebugContent = debugPatterns.some(p => p.test(content));
```

---

### Pitfall 2: Spring Animation Duration Misunderstanding

**What goes wrong:** Transitions/animation feel slightly off, content appears to "stretch" before the spring settles.

**Why it happens:** Spring `delay` parameter delays the final result, NOT the stretching phase. Order of operations: `durationInFrames` first, then `reverse`, then `delay`. Also, `durationRestThreshold` (default 0.001) means spring reaches 99.9% not 100%.

**Consequences:**
- Timed sequences feel 1-3 frames off
- Annotation effects appear to "lag"
- Transitions look unprofessional

**Prevention:**
```typescript
// Wrong: delay doesn't affect the stretch
<Spring delay={30} config={{ damping: 12 }} />

// Correct: account for durationRestThreshold
const actualDuration = durationInFrames + Math.ceil(1000 / fps); // extra frames for settling
```

**Detection:** Watch for subtle "stretching" before animations settle.

---

### Pitfall 3: interpolate() Extrapolation Without Clamping

**What goes wrong:** Scale/opacity continues growing beyond intended range, causing elements to disappear or grow unexpectedly.

**Why it happens:** Default `extrapolateRight: 'extend'` allows values outside output range. E.g., mapping `[0, 20]` to `[0, 1]` produces scale `2` at frame 40.

**Consequences:**
- Annotations become invisible or tiny
- Transitions look broken
- Elements scale beyond viewport

**Prevention:**
```typescript
// Always clamp unless you explicitly want extrapolation
const scale = interpolate(frame, [0, 20], [0, 1], {
  extrapolateRight: 'clamp',
  extrapolateLeft: 'clamp',
});
```

**Detection:**
```typescript
// Add runtime validation
const validateAnimationValue = (value: number, min: number, max: number) => {
  if (value < min - 0.01 || value > max + 0.01) {
    console.warn(`Animation value ${value} outside expected range [${min}, ${max}]`);
  }
};
```

---

## Moderate Pitfalls

### Pitfall 4: Heavy Effects Without Performance Budget

**What goes wrong:** Video renders locally but times out or produces corrupted output on CI/cloud.

**Why it happens:** Heavy GPU effects (shadows, gradients, blur, canvas graphics) work on local GPU but cloud instances often lack GPU. Additionally, `concurrency` setting wrong for workload.

**Consequences:**
- `REMOTION_RENDER_FAILED` errors
- 1 hour+ render times for short videos
- Cloud costs spiral

**Prevention:**
- Profile with `--log=verbose` and `console.time`
- Run `npx remotion benchmark` to find optimal concurrency
- Replace dynamic effects with precomputed images where possible
- Use `--scale` flag for faster previews
- Consider PNG vs JPEG tradeoff (transparency vs speed)

**Detection:** Monitor render times; >3x realtime suggests performance issue.

---

### Pitfall 5: Mixed Content Types in Extracted Research

**What goes wrong:** Research markdown contains embedded source code, CSS variables, or truncated sections.

**Why it happens:** Regex-based extraction pulls everything, including `<pre>` blocks that are styling demos, CSS variable blocks, or React component code embedded for documentation.

**Consequences:**
- Script agent receives irrelevant content
- Priority tagging becomes unreliable
- Source citations point to wrong sections

**Prevention:**
- Prioritize semantic elements (`<article>`, `<main>`, `<p>`, `<h1-6>`)
- Filter `<pre>` blocks that are styling examples (not code tutorials)
- Detect and truncate at natural boundaries, not arbitrary limits
- Validate extracted content has minimum meaningful text ratio

**Detection:**
```typescript
const codeToTextRatio = (content: string) => {
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
  const words = content.split(/\s+/).length;
  return codeBlocks / words; // High ratio = mostly code
};
```

---

### Pitfall 6: Non-Atomic Source References

**What goes wrong:** Source citations `[1]` appear in multiple sections but reference different parts of the source document, confusing downstream agents.

**Why it happens:** LLM-generated markdown uses `[1]` notation but doesn't maintain consistent reference mapping. A source discussing multiple features gets cited multiple times without clarification.

**Consequences:**
- Script agent cannot trace claims back to sources
- Video narration may contradict source material
- Research becomes hard to verify

**Prevention:**
- Require `[N-start:N-end]` range notation for citations
- Validate source index entries match all citations
- Reject markdown where same citation number appears in unrelated sections

**Detection:**
```typescript
// Verify citation consistency
const citationsBySection = extractCitationsBySection(markdown);
const sectionTopics = extractSectionTopics(markdown);
const mismatches = citationsBySection.filter(c => !relatesToTopic(c.url, sectionTopics));
```

---

## Minor Pitfalls

### Pitfall 7: Ignoring Version-Specific Behaviors

**What goes wrong:** Effects work in development but fail in CI due to different Remotion version.

**Why it happens:** Some Remotion versions have specific bugs (e.g., certain spring configs in 5.x). Also, Node.js v24 compatibility issues with native modules.

**Prevention:**
- Pin Remotion version in `packages/renderer/package.json`
- Use two-process model to isolate zod version conflicts
- Test render in Docker container matching CI environment

---

### Pitfall 8: Transition Component Timing Misalignment

**What goes wrong:** Enter transitions work but exit transitions feel abrupt, or vice versa.

**Why it happens:** The `Transition` component logic for combined enter/exit may not handle all frame combinations correctly. Exit progress calculation can produce unexpected values at scene boundaries.

**Prevention:**
- Keep enter and exit transitions symmetrical (same duration)
- Test at scene boundary frames specifically
- Consider using `Sequence` component for scene-level transitions instead

**Detection:** Watch first and last 10 frames of each scene.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Research agent content extraction | DevTools/debug content capture | Add Playwright rendering, validate content ratios |
| Visual effects layer | interpolate extrapolation | Mandatory clamping on all animations |
| Annotation/transition additions | Spring timing issues | Extra frames for settling, explicit fps parameter |
| Video rendering pipeline | Cloud performance | Benchmark concurrency, precompute heavy effects |
| Script-to-scene conversion | Citation mismatch | Validate citation-topic relationships |

---

## Sources

- [Remotion interpolate docs](https://remotion.dev/docs/interpolate) - HIGH confidence
- [Remotion spring docs](https://remotion.dev/docs/spring) - HIGH confidence
- [Remotion performance docs](https://remotion.dev/docs/performance) - HIGH confidence
- [GitHub Remotion discussions](https://github.com/remotion-dev/remotion/discussions) - MEDIUM confidence
- [Web content extraction issues](https://www.zed.dev/blog/web-scraping) - MEDIUM confidence
