# Phase 11: Screenshot Quality - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix screenshot quality issues so that videos show content-relevant screenshots rather than generic captures or failures. This phase addresses:

- ORB blocking (remote URLs blocked by browser)
- CSS selector improvements for content relevance
- Content-type-specific screenshot strategies
- Intelligent retry on failure

</domain>

<decisions>
## Implementation Decisions

### Content Selection Approach

- **D-01:** AI-guided selection — LLM analyzes page content and generates precise CSS selector for the relevant section

### When AI Analysis Happens

- **D-02:** Screenshot Agent analyzes page structure when capturing — Visual Agent plans layout, Screenshot Agent refines selectors at capture time

### Failure Handling

- **D-03:** Retry with AI refinement — When screenshot fails or content isn't relevant, Screenshot Agent analyzes why and retries with improved selector

### Content-Type Strategies

- **D-04:** Type-specific strategies — Different approaches per content type:
  - Documentation: text-focused selectors (article, .content, .markdown-body)
  - Code: syntax-highlighted blocks (pre, code, .highlight)
  - Articles: semantic section detection (h1, h2, main sections)

### the agent's Discretion

- Exact retry logic and max retry count
- How to extract selector suggestions from page analysis
- Fallback selector priority ordering

</decisions>

<specifics>
## Specific Ideas

- "LLM should understand what content is relevant to the narration and find it on the page"
- "Code screenshots should capture syntax-highlighted regions, not full page"

</specifics>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Screenshot Infrastructure

- `src/mastra/tools/playwright-screenshot.ts` — Playwright tool with selector support, retry logic
- `src/mastra/agents/screenshot-agent.ts` — Screenshot Agent with DEFAULT_SELECTORS and fallback strategy

### Prior Phase Context

- `.planning/phases/10-wire-layouts/10-CONTEXT.md` §D-06 — Screenshot quality deferred from Phase 10

### Visual Planning

- `src/mastra/agents/visual-agent.ts` — Visual Agent that creates visual.json with mediaResources

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `playwrightScreenshotTool`: Already has retry logic, selector support, viewport configuration
- `screenshot-agent.ts`: Has DEFAULT_SELECTORS map and fallback strategy
- `parseMediaResources()`: Parses visual plan to extract resource info

### Established Patterns

- Visual Agent creates mediaResources with type, selector hints
- Screenshot Agent receives mediaResources and captures screenshots
- Screenshots stored in `screenshots/` directory with scene-resource naming

### Integration Points

- Screenshot Agent → screenshots directory (PNG files)
- Screenshot Agent output → screenshotResources mapping in compose CLI
- `imagePaths` Record<string, string> passed to Remotion for rendering

</code_context>

<deferred>
## Deferred Ideas

- **ORB blocking fix** — Remote URL images blocked by browser; use local screenshot files only — belongs in Phase 11 ORB discussion
- **AI-generated selector precision** — How to ensure generated selectors are robust across page variations

None — discussion stayed within phase scope

</deferred>

---

_Phase: 11-screenshot-quality_
_Context gathered: 2026-03-23_
