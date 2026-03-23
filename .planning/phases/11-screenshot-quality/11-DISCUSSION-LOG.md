# Phase 11: Screenshot Quality - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 11-screenshot-quality
**Areas discussed:** Content quality

---

## Content Quality

| Option                | Description                                                                           | Selected |
| --------------------- | ------------------------------------------------------------------------------------- | -------- |
| AI-guided selection   | LLM analyzes page content and generates precise CSS selector for the relevant section | ✓        |
| Semantic extraction   | Extract relevant content directly (via Turndown/Readability) instead of screenshot    |          |
| Viewport optimization | Capture full page but use smart viewport positioning                                  |          |

**User's choice:** AI-guided selection (Recommended)
**Notes:** LLM should understand what content is relevant to the narration and find it on the page

---

## When AI Analysis Happens

| Option           | Description                                                                        | Selected |
| ---------------- | ---------------------------------------------------------------------------------- | -------- |
| Visual Agent     | Visual Agent analyzes URLs during visual planning, generates precise selectors     |          |
| Screenshot Agent | Screenshot Agent uses AI to analyze page structure when capturing                  | ✓        |
| Both             | Visual Agent plans selectors, Screenshot Agent can refine if initial capture fails |          |

**User's choice:** Screenshot Agent
**Notes:** Screenshot Agent analyzes page structure when capturing

---

## Failure Handling

| Option                   | Description                                                                | Selected |
| ------------------------ | -------------------------------------------------------------------------- | -------- |
| Retry with AI refinement | Screenshot Agent analyzes why it failed and retries with improved selector | ✓        |
| Skip scene               | Scene renders without screenshot, falls back to text-only layout           |          |
| Placeholder + flag       | Use placeholder image, flag for human review                               |          |

**User's choice:** Retry with AI refinement (Recommended)
**Notes:** When screenshot fails or content isn't relevant, Screenshot Agent analyzes why and retries

---

## Content-Type Strategies

| Option                   | Description                                                           | Selected |
| ------------------------ | --------------------------------------------------------------------- | -------- |
| Type-specific strategies | Different approaches per content type (documentation, code, articles) | ✓        |
| Unified approach         | Same AI-guided selection works for all content types                  |          |

**User's choice:** Type-specific strategies (Recommended)
**Notes:** Documentation: text-focused selectors; Code: syntax-highlighted blocks; Articles: semantic section detection

---

## Deferred Ideas

None
