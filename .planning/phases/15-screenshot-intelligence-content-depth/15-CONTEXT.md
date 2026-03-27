# Phase 15: Screenshot Intelligence + Content Depth - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade screenshot capabilities with dark mode support and zoom-to-region cropping. Deepen research quality with multi-round + example-extraction passes. Improve layout variety by tracking and enforcing visual diversity. Add Tailwind CSS v4 as the base styling framework for Remotion scenes. Expand agent skills with UI/UX Pro Max and the full Remotion ruleset.

</domain>

<decisions>
## Implementation Decisions

### Screenshot Intelligence

- **D-01: Dark Mode** — Use Playwright `page.emulateMedia({ colorScheme: 'dark' })` before navigation. Add `darkMode?: boolean` to `playwrightScreenshotTool` inputSchema. Sites that don't respect `prefers-color-scheme` will fall back to unchanged appearance (acceptable for MVP).

- **D-02: Zoom-to-Region** — Full-page capture + `sharp` crop to element's bounding box. Flow: capture full-page screenshot → get element bounding box via `element.boundingBox()` → crop with `sharp`. Add `zoomToSelector?: string` to inputSchema (separate from existing `selector` which captures element directly). Requires `sharp` as new dependency in the main package.

### Research Depth

- **D-03: Multi-Round Research** — Three-pass approach replacing the current single-pass:
  - **Round 1**: Broad research (current behavior — webFetch all links, synthesize)
  - **Round 2**: Targeted follow-up — LLM identifies specific gaps (exact API signatures, version numbers, WHY explanations) and fetches additional sources
  - **Round 3**: Example-extraction pass — dedicated pass finding concrete analogies, runnable demos, code snippets
  - Implementation: Add `researchDepth?: 'standard' | 'deep'` param to research workflow step. `deep` triggers rounds 2+3. Default: `deep` (since we're improving quality).
  - Higher latency (~3x LLM calls) but dramatically richer content.

### Layout Variety

- **D-04: LLM Enforcement via History** — Pass `visualLayersHistory` (array of previously-used layout template IDs) into the visual agent's generation prompt. Instructions explicitly tell the agent to avoid layouts already used in the current video. Non-deterministic but flexible — no rigid round-robin, LLM picks the most appropriate unused layout.
  - `generateVisualPrompt()` in `visual-agent.ts` gains a `usedLayouts: string[]` parameter
  - Workflow passes accumulated layout IDs after each scene is processed

### Tailwind CSS v4 in Remotion

- **D-05: Tailwind v4 Integration** — Install `@remotion/tailwind-v4` + `tailwindcss` in `packages/renderer`. The package is Rspack-compatible (Rspack implements Webpack API). Steps:
  1. `npm i -D @remotion/tailwind-v4 tailwindcss` in `packages/renderer`
  2. Add `enableTailwind(currentConfiguration)` import from `@remotion/tailwind-v4` to `remotion.config.ts`
  3. Create `packages/renderer/src/remotion/index.css` with `@import 'tailwindcss'`
  4. Import `./index.css` in `packages/renderer/src/remotion/Root.tsx`
  - **Critical Remotion rule**: Never use `transition-*` or `animate-*` Tailwind classes — always animate via `useCurrentFrame()` hook.

### Agent Skills

- **D-06: UI/UX Pro Max Skill** — Install the `nextlevelbuilder/ui-ux-pro-max-skill` skill to `.agents/skills/ui-ux-pro-max/`. This skill is used by the **visual agent** (`visual-agent.ts`) for layout design, color scheme selection, and component decisions. Content includes: 67 UI styles, 161 color palettes, 57 font pairings, 99 UX guidelines. Has a Python design system generator script. Installation: manual copy from GitHub repo or `uipro init --ai opencode`.

- **D-07: Full Remotion Skill Ruleset** — The existing `.agents/skills/remotion/` only has 5 rule files. Fetch all missing rule files from `remotion-dev/skills` repo and add to `.agents/skills/remotion/rules/`. The full set covers: 3D, assets, audio, charts, fonts, transitions, tailwind, video, image, noise, paths, shapes, spring, svg, and more. The **visual agent** (and any agent generating Remotion code) uses this skill.

### Agent's Discretion

- Exact prompt wording for layout variety enforcement
- Sharp crop padding amount around zoom-to-region bounding box (suggestion: 16px padding)
- Multi-round research prompt templates for rounds 2 and 3
- Which remotion-dev skill files to include vs. skip (focus on production-relevant ones)

</decisions>

<specifics>
## Specific Ideas

- `playwrightScreenshotTool` dark mode: add `darkMode?: boolean` to schema, call `page.emulateMedia({ colorScheme: darkMode ? 'dark' : 'light' })` right after `browser.newPage()`
- `playwrightScreenshotTool` zoom-to-region: add `zoomToSelector?: string` field. After full-page capture, call `page.$(zoomToSelector)`, then `element.boundingBox()`, then `sharp(imagePath).extract({ left, top, width, height }).toFile(croppedPath)`
- Research round 2 prompt: "Based on the research above, identify 3-5 specific gaps: missing version numbers, unclear WHY explanations, undocumented edge cases. Fetch the most relevant source to fill each gap."
- Research round 3 prompt: "Extract the most illustrative code examples and real-world analogies from all fetched content. Format as runnable snippets with context."
- Visual agent layout history: add `## Previously Used Layouts\n${usedLayouts.join(', ')}\n\nDo NOT use these layouts again. Pick a different template for maximum visual variety.` to the prompt
- Remotion Tailwind: after setup, update any hardcoded `style={{}}` in scene components to use Tailwind utility classes where appropriate

</specifics>

<canonical_refs>

## Canonical References

### Screenshot Tool

- `src/mastra/tools/playwright-screenshot.ts` — Current tool (229 lines): inputSchema has `url`, `selector`, `viewport`, `outputDir`, `filename`. No dark mode, no zoom-to-region. The `selector` field captures element directly — `zoomToSelector` will be a new field for crop-after-capture.
- `src/mastra/tools/__tests__/playwright-screenshot.test.ts` — Existing tests to extend
- `src/mastra/agents/screenshot-agent.ts` — Agent that calls the screenshot tool

### Research Agent

- `src/mastra/agents/research-agent.ts` — Current single-pass agent (293 lines). Uses `webFetchTool`. Instructions define output format with `[priority:]` and `[relationship:]` tags. `parseResearchMarkdown()` and `filterEssentialContent()` are utility functions.
- `src/mastra/agents/__tests__/research-agent.test.ts` — Tests to extend

### Visual Agent

- `src/mastra/agents/visual-agent.ts` — Current agent (257 lines). `generateVisualPrompt(scriptOutput, researchMd)` function needs a third `usedLayouts: string[]` parameter. Has 8 layout templates defined in instructions.
- `src/mastra/agents/__tests__/visual-agent.test.ts` — Tests to extend

### Renderer Package (Tailwind Setup)

- `packages/renderer/src/remotion/remotion.config.ts` — Must add `enableTailwind()` call. Currently uses `Config.setExperimentalRspackEnabled(true)`.
- `packages/renderer/src/remotion/Root.tsx` — Must import `./index.css`
- `packages/renderer/package.json` — Must add `@remotion/tailwind-v4` and `tailwindcss` dev dependencies
- `packages/renderer/src/remotion/index.css` — New file to create with `@import 'tailwindcss'`

### Skills

- `.agents/skills/remotion/SKILL.md` — Existing skill entry point
- `.agents/skills/remotion/rules/` — Currently: animations.md, sequencing.md, text-animations.md, timing.md, transitions.md (5 files, ~25 missing)
- `.agents/skills/ui-ux-pro-max/` — Does NOT exist yet, must create

</canonical_refs>

<code_context>

## Existing Code Insights

### Current playwrightScreenshotTool Gap

- `selector` field (line 80-87): captures element directly via `element.screenshot()` — this is element-clipping, NOT zoom-to-region
- `zoomToSelector` (new): full-page capture first, then `sharp` crop — different semantics
- Both can coexist: `selector` for element screenshots, `zoomToSelector` for zoomed-in region of full page
- `withRetry` wrapper (line 65): all screenshot logic is inside retry — keep `sharp` crop inside same retry block

### Research Agent Multi-Round Architecture

- Current: single `generate()` call with all links upfront
- New: sequential calls — round1 result feeds into round2 prompt, round2 result feeds into round3 prompt
- The `researchAgent` generates text output (Markdown) — multi-round is implemented as multiple `agent.generate()` calls in the workflow, not inside the agent itself
- Each round appends to a `researchContext` accumulator
- `filterEssentialContent()` runs on the final merged output

### Visual Agent Layout Variety

- `generateVisualPrompt()` (line 233-256): currently takes `scriptOutput` and `researchMd`
- Add `usedLayouts: string[]` as third param (default `[]`)
- Inject layout history into prompt before "输出要求:" section
- Caller (workflow) must accumulate used layouts: extract `layoutTemplate` from each scene's visual output and append to list

### Tailwind + Remotion Coexistence

- Remotion uses Rspack (webpack-compatible) — `@remotion/tailwind-v4` plugin works via webpack loader API
- Production rendering uses `puppeteer-renderer.ts` which bypasses the Remotion bundler — Tailwind classes will still work because they're compiled at bundle time into CSS, not at render time
- No conflict with existing `style={{}}` inline styles — Tailwind and inline styles coexist in React

</code_context>

<deferred>
## Deferred Ideas

- Browser pool optimization for screenshot agent (batched captures)
- TTS-synced dark mode switching within a scene
- Playwright viewport scaling for responsive screenshots
- Sharp-based image enhancement (contrast boost, sharpening) for screenshot quality
- Python-based UI/UX Pro Max design system generator integration into workflow

</deferred>

---

_Phase: 15-screenshot-intelligence-content-depth_
_Context gathered: 2026-03-26_
