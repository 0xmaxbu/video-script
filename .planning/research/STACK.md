# Technology Stack Research: AI Video Generation Tool

**Project:** video-script improvements
**Researched:** 2026-03-22
**Overall confidence:** MEDIUM-LOW (WebSearch unavailable; findings from training data and limited WebFetch verification)

## Research Scope

Focus areas for stack improvements:
1. Web research/crawling agents (deeper content extraction)
2. Visual effects (highlight, underline, circle, number annotations)
3. PPT-style layout rendering in video

---

## 1. Web Research/Crawling - Deep Content Extraction

### Current State
The project uses a regex-based `htmlToMarkdown()` function in `web-fetch.ts`. This approach:
- Converts HTML tags to Markdown via string replacement
- Has limited handling for complex DOM structures
- Does not extract structured data (tables, lists, code blocks)
- Cannot handle JavaScript-rendered content

### Recommended Stack

| Technology | Purpose | Confidence | Why |
|------------|---------|------------|-----|
| **Turndown** | HTML to Markdown conversion | HIGH | Verified via WebFetch. Actively maintained (11k stars, 89 contributors). Better than regex approach. Supports GFM via plugin. Extensible with custom rules. |
| **Mozilla Readability** | Main content extraction | MEDIUM | Training data. Extracts article content, title, byline, siteName, excerpt. Standalone version of Firefox Reader View. |
| **Cheerio** | DOM parsing and traversal | MEDIUM | Training data. jQuery-like API for Node.js. Fast parsing with selector support. Use for targeted extraction before Turndown. |
| **Playwright** (already in use) | JavaScript-rendered content | HIGH | Already part of stack. Use `content()` after page load for SPAs. |

### Implementation Approach

```
Raw HTML
  → Playwright (if JS-rendered) → Cheerio (parse) → Readability (extract main) → Turndown (convert)
```

**Key benefits over current approach:**
- Readability extracts only the article content, removing nav/ads/sidebars
- Turndown handles complex HTML structures correctly
- Cheerio enables targeted extraction via CSS selectors

### Alternatives Considered

| Library | Verdict | Why Not |
|---------|---------|---------|
| **marked** | Not suitable | Markdown parser, not HTML-to-Markdown converter |
| **htmlparser2** | Inferior to Cheerio | Lower-level, more complex API |
| **node-html-parser** | Training data | Newer option, less proven than Cheerio |
| **sitemap-parser** | Partial solution | Good for discovering pages, but doesn't extract content |

---

## 2. Visual Effects - Annotations (Highlight, Underline, Circle, Number)

### Current State
The `visual.ts` defines annotation types but the Remotion `CodeAnimation.tsx` only implements:
- Line highlight via background color + left border
- No circle, underline, arrow, box, number, crossout, or checkmark annotations

### Recommended Stack

| Technology | Purpose | Confidence | Why |
|------------|---------|------------|-----|
| **SVG overlays** (native React) | All annotation types | HIGH | No external library needed. SVG supports circles, rectangles, lines, arrows, text. Directly composable with Remotion's `<AbsoluteFill>`. |
| **@remotion/motion** | Animation between states | MEDIUM | Training data. Official Remotion motion wrapper. Spring animations for annotation reveals. |

### Annotation Implementation Guide

```tsx
// Example: Circle annotation component
const CircleAnnotation: React.FC<{
  x: number; y: number; radius: number;
  color: string;
  appearAt: number; // frame
}> = ({ x, y, radius, color, appearAt }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [appearAt, appearAt + 10], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <circle
          cx={x} cy={y} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          opacity={opacity}
        />
      </svg>
    </AbsoluteFill>
  );
};
```

### Annotation Types to Implement

| Type | SVG Element | Complexity |
|------|-------------|------------|
| Circle | `<circle>` | Low |
| Underline | `<line>` or `<rect>` | Low |
| Arrow | `<line>` + `<polygon>` | Medium |
| Highlight (background) | `<rect>` with fill | Low |
| Box | `<rect>` | Low |
| Number | `<text>` with circle | Medium |
| Crossout | `<line>` diagonal | Low |
| Checkmark | `<polyline>` | Low |

### Alternatives Considered

| Library | Verdict | Why Not |
|---------|---------|---------|
| **react-annotation** | Training data | Designed for images, not video timelines |
| **rough-notation** | Training data | Browser-based, not Remotion-compatible |
| **Framer Motion** | Training data | Overkill for SVG annotations; @remotion/motion is purpose-built |

---

## 3. PPT-Style Layout Rendering

### Current State
`visual.ts` defines layout templates:
- hero-fullscreen, split-horizontal, split-vertical, text-over-image
- code-focus, comparison, bullet-list, quote

No actual Remotion components implement these layouts yet.

### Recommended Stack

| Technology | Purpose | Confidence | Why |
|------------|---------|------------|-----|
| **Custom React + CSS** (native Remotion) | Layout implementation | HIGH | Remotion is already React-based. Custom CSS Grid/Flexbox layouts give full control. Avoids dependency bloat. |
| **Tailwind CSS** | Utility-first styling | MEDIUM | Training data. If project adopts it, enables rapid layout development. |
| **Recharts** (optional) | Data visualization | MEDIUM | Training data. For comparison layouts with charts. Native SVG, composable with Remotion. |

### Layout Implementation Patterns

**Split Horizontal (50/50):**
```tsx
<div style={{ display: 'flex', width: '100%', height: '100%' }}>
  <div style={{ flex: 1 }}>{/* Left content */}</div>
  <div style={{ flex: 1 }}>{/* Right content */}</div>
</div>
```

**Text Over Image:**
```tsx
<AbsoluteFill>
  <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  <div style={{
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    padding: 40,
  }}>
    {title}
  </div>
</AbsoluteFill>
```

### Key Layout Considerations

| Concern | Approach |
|---------|----------|
| **Responsive viewport** | Fixed 1920x1080 or 1280x720, scale proportionally |
| **Text readability** | Contrast overlays, text shadows |
| **Transitions between layouts** | Remotion's `<Sequence>` and `interpolate` |
| **Z-index layering** | Screenshot base → annotations overlay → text top |

### Alternatives Considered

| Library | Verdict | Why Not |
|---------|---------|---------|
| **react-pptx** | Not suitable | Generates static PPTX files, not video frames |
| **pptxgenjs** | Not suitable | Same as above - file generation, not rendering |
| **Slidev** | Not suitable | Vue-based, not compatible with Remotion |
| **spectacle** | Training data | React presentation library but for browser, not video |
| **mdx-deck** | Deprecated | No longer actively maintained |

---

## 4. Cross-Cutting Concerns

### Animation Library
If spring/transition animations are needed beyond basic interpolation:

| Library | Confidence | Notes |
|---------|------------|-------|
| **@remotion/motion** | MEDIUM | Training data. Official Remotion wrapper for motion. |
| **react-spring** | MEDIUM | Training data. Works with React, may work with Remotion. |

### Code Highlighting
Already using Shiki (`code-highlight.ts`). No changes needed.

### Diagram Generation
If diagrams are needed for explanations:

| Library | Confidence | Notes |
|---------|------------|-------|
| **Mermaid** | MEDIUM | Training data. Text-based diagrams, could render to SVG |
| **Excalidraw** | MEDIUM | Training data. Hand-drawn style diagrams |

---

## 5. Summary Recommendations

### For Web Research (Priority: HIGH)
**Add:** Turndown + optional Readability
- Drop-in replacement for regex HTML-to-Markdown
- Better handling of code blocks, tables, lists
- Consider adding Cheerio for targeted extraction

**Verification:** Run WebSearch to confirm "turndown npm" is current best practice

### For Visual Effects (Priority: HIGH)
**Add:** SVG annotation components (custom)
- No external library needed
- Circle, underline, arrow, box, number annotations are all basic SVG
- Compose with `@remotion/motion` for spring animations

**Implementation:** Create `src/remotion/components/Annotations.tsx` with each annotation type

### For PPT-Style Layouts (Priority: MEDIUM)
**Approach:** Custom React + CSS
- Layout templates are defined but not implemented
- Build components as needed rather than upfront
- Consider Tailwind CSS if project wants faster styling iteration

---

## Confidence Notes

| Area | Confidence | Reason |
|------|------------|--------|
| Turndown | HIGH | Verified via WebFetch (11k stars, active) |
| Readability | MEDIUM | Training data; WebFetch 404 on mozilla.github.io |
| Cheerio | MEDIUM | Training data; jQuery-like API well-known |
| SVG annotations | HIGH | Standard web technology, no library needed |
| @remotion/motion | MEDIUM | Training data; official library but couldn't verify URL |
| Recharts | MEDIUM | Training data; popular library |
| Tailwind | MEDIUM | Training data; widely used but couldn't verify specific Remotion compatibility |

**Recommended validation:** Run WebSearch for "turndown vs marked 2025" and "Remotion annotation best practices 2025" when WebSearch is available.

---

## Sources

Verified:
- [Turndown GitHub](https://github.com/domchristie/turndown) - HIGH confidence
- [Cheerio GitHub](https://github.com/cheeriojs/cheerio) - MEDIUM confidence (training data)
- [Mozilla Readability](https://github.com/mozilla/readability) - MEDIUM confidence (training data)

Training data (not verified):
- @remotion/motion
- Recharts
- Tailwind CSS
- react-spring
