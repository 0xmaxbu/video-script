---
phase: 03-research-content
plan: "01"
subsystem: research
tags: [web-fetch, content-extraction, readability, turndown, validation]
dependency_graph:
  requires: []
  provides:
    - RES-01
    - RES-02
  affects:
    - src/mastra/tools/web-fetch.ts
    - src/types/research.ts
    - src/mastra/tools/validators/input-validator.ts
tech_stack:
  added:
    - "@mozilla/readability@^0.6.0"
    - "turndown@^7.2.2"
    - "linkedom@^0.18.12"
  patterns:
    - Readability for article content extraction
    - Turndown for HTML-to-Markdown conversion
    - linkedom for DOM parsing in Node.js
    - Input validation before research agent
key_files:
  created:
    - src/mastra/tools/validators/input-validator.ts
  modified:
    - src/mastra/tools/web-fetch.ts
    - src/types/research.ts
    - package.json
decisions:
  - "Replace regex-based htmlToMarkdown with Turndown + Readability for proper article extraction"
  - "Use linkedom to provide DOM parsing required by Readability in Node.js environment"
  - "Add relationship tags (原因/对比/示例/注意事项) to research segments per D-02"
  - "Create input-validator.ts with word count, placeholder, and HTML structure checks per D-10"
metrics:
  duration: "~1 minute"
  completed: "2026-03-22T11:48:00Z"
---

# Phase 03 Plan 01 Summary: Web Content Extraction Pipeline Upgrade

## One-liner

Web fetch tool upgraded from regex-based HTML extraction to Turndown + Mozilla Readability with input validation layer

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Turndown + Readability dependencies | f55a182 | package.json, package-lock.json |
| 2 | Update web-fetch.ts with Turndown + Readability | 98e4ae9 | src/mastra/tools/web-fetch.ts |
| 3 | Update research.ts schema with relationship tags | 3398be4 | src/types/research.ts |
| 4 | Create input-validator.ts | f44bbe7 | src/mastra/tools/validators/input-validator.ts |

## What Was Built

**Content Extraction Pipeline:**
- Replaced broken regex-based `htmlToMarkdown()` with Turndown + @mozilla/readability
- linkedom provides DOM parsing for Node.js (Readability requires browser-like DOM)
- `fetchAndExtract()` function handles full pipeline: fetch -> parse -> extract -> convert

**Research Schema Enhancement:**
- Added `RelationshipTagEnum`: '原因' | '对比' | '示例' | '注意事项'
- Extended `ResearchSegmentSchema.keyContent` with `relationships` array and `relationshipNotes` record

**Input Validation Layer:**
- Created `validateFetchedContent()` per D-10
- Checks: word count >= 500, no placeholder text, HTML structure presence
- Returns `{ valid: boolean, failures: Array<{ name, reason }> }`

## Verification

All success criteria met:
- web-fetch.ts uses Turndown + Readability instead of regex htmlToMarkdown
- Content extraction properly handles article content via Readability
- linkedom provides DOM parsing for Node.js environment
- Research schema includes relationship tags (原因/对比/示例/注意事项)
- Input validation function checks word count, placeholder text, and HTML structure

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check

- [x] package.json contains turndown, @mozilla/readability, linkedom
- [x] web-fetch.ts imports Readability, parseHTML, Turndown
- [x] research.ts exports RelationshipTagEnum and has relationships field
- [x] src/mastra/tools/validators/input-validator.ts exists with validateFetchedContent function
- [x] All 4 task commits exist: f55a182, 98e4ae9, 3398be4, f44bbe7

## Self-Check: PASSED
