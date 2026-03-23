---
phase: 11-screenshot-quality
plan: "01"
subsystem: screenshot
tags:
  - screenshot
  - ai-selector
  - playwright
requires: []
provides:
  - AI-guided selector generation
  - Page structure analysis
  - Semantic region detection
affects:
  - src/mastra/tools/playwright-screenshot.ts
  - src/mastra/agents/screenshot-agent.ts
tech_stack:
  added:
    - analyzePageStructure function
    - generateAISelector function
    - PageStructure and SemanticRegion types
patterns:
  - AI-guided selection
  - Content-aware screenshot capture
key_files:
  created:
    - src/mastra/tools/playwright-screenshot.ts (modified)
    - src/mastra/agents/screenshot-agent.ts (modified)
  modified: []
key_decisions:
  - AI-guided selection using page structure analysis
  - Narration context used to select best semantic region
  - Smart fallback to DEFAULT_SELECTORS on AI failure
requirements_completed: []
duration: 5 min
completed: "2026-03-23T12:05:00Z"
---

# Phase 11 Plan 01: AI-Guided Selector Generation Summary

## What Was Built

Added AI-guided selector generation to Screenshot Agent so it analyzes page content and generates precise CSS selectors instead of using generic defaults.

## Tasks Completed

1. **Task 1: Add analyzePageStructure to playwright-screenshot.ts** ✓
   - Added PageStructure and SemanticRegion interfaces
   - Added analyzePageStructure function that extracts headings, links, codeBlocks, semanticRegions
   - Uses Playwright page.evaluate() to analyze page structure
   - Supports content-type hints (documentation/code/article)
   - 60 second timeout on page load

2. **Task 2: Add generateAISelector to screenshot-agent.ts** ✓
   - Added GenerateAISelectorInput and GenerateAISelectorResult interfaces
   - Added generateAISelector function with content analysis
   - selectBestRegion() scores regions based on content match
   - Falls back to DEFAULT_SELECTORS on failure

3. **Task 3: Update agent instructions** ✓
   - Agent now calls generateAISelector for informational screenshots
   - Added AI-Guided Selector Generation section
   - IMPORTANT: prefer AI-generated selectors over DEFAULT_SELECTORS

## Files Modified

- `src/mastra/tools/playwright-screenshot.ts` — Added analyzePageStructure function and types
- `src/mastra/agents/screenshot-agent.ts` — Added generateAISelector and updated instructions

## Verification

- ✓ TypeScript compiles without errors
- ✓ analyzePageStructure exported from playwright-screenshot.ts
- ✓ generateAISelector exists in screenshot-agent.ts
- ✓ Agent instructions reference AI-guided selectors

## Next Steps

Ready for Plan 11-02: Intelligent retry with AI refinement + ORB mitigation
