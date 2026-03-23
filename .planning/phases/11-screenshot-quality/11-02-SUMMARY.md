---
phase: 11-screenshot-quality
plan: "02"
subsystem: screenshot
tags:
  - screenshot
  - retry
  - ai-refinement
  - orb
requires: []
provides:
  - Intelligent retry with AI refinement
  - Failure analysis and selector suggestion
  - ORB-safe screenshot paths
affects:
  - src/mastra/tools/playwright-screenshot.ts
  - src/mastra/agents/screenshot-agent.ts
tech_stack:
  added:
    - analyzeFailureAndSuggestSelector function
    - captureWithRetry function
    - AnalyzeFailureInput/Result interfaces
    - CaptureWithRetryInput/Result interfaces
patterns:
  - Retry with AI refinement
  - Failure analysis
key_files:
  created:
    - src/mastra/tools/playwright-screenshot.ts (modified)
    - src/mastra/agents/screenshot-agent.ts (modified)
  modified: []
key_decisions:
  - D-03: Retry with AI refinement on failure
  - ORB mitigation via local file paths
requirements_completed: []
duration: 3 min
completed: "2026-03-23T12:08:00Z"
---

# Phase 11 Plan 02: Intelligent Retry with AI Refinement Summary

## What Was Built

Added intelligent retry with AI refinement and ORB blocking mitigation to the Screenshot Agent.

## Tasks Completed

1. **Task 1: Add analyzeFailureAndSuggestSelector** ✓
   - Added AnalyzeFailureInput and AnalyzeFailureResult interfaces
   - Analyzes why selector failed (SELECTOR_NOT_FOUND, Timeout, etc.)
   - Uses analyzePageStructure to find alternative selectors
   - Returns improved selector + up to 2 alternatives

2. **Task 2: Add captureWithRetry** ✓
   - Added CaptureWithRetryInput and CaptureWithRetryResult interfaces
   - Implements D-03: Retry with AI refinement
   - Up to 2 retry attempts (configurable)
   - Each attempt logs selector and failure reason

3. **Task 3: ORB Mitigation Documentation** ✓
   - imagePath is always local file path
   - ORB-safe comment in output schema description
   - Screenshots saved via Playwright to local filesystem

## Files Modified

- `src/mastra/tools/playwright-screenshot.ts` — ORB-safe documentation
- `src/mastra/agents/screenshot-agent.ts` — Added analyzeFailureAndSuggestSelector, captureWithRetry

## Verification

- ✓ TypeScript compiles without errors
- ✓ analyzeFailureAndSuggestSelector exported
- ✓ captureWithRetry implements retry logic
- ✓ ORB mitigation documented

## Next Steps

Ready for Plan 11-03: Content-type-specific screenshot strategies
