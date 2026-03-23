# Phase 13: Fix Issues + E2E Pipeline Tests - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 4 UAT issues from phases 3/5/6, update project tracking docs (ROADMAP/REQUIREMENTS), and add pipeline tests for the compose step (script → render invocation).

**Scope:**

- Fix UAT issues: dead RelationshipTagEnum, Config API docs, verification module docs, build dist
- Housekeeping: ROADMAP progress table, REQUIREMENTS checkboxes + traceability, packages/types build
- Pipeline tests: scene-adapter, compose-agent helpers, screenshot resource mapping

**Not in scope:** Pre-existing TS errors (38 in renderer), failing test files (18/22) — deferred to Phase 14

</domain>

<decisions>
## UAT Issue Resolution

### Issue 1 (Phase 3): RelationshipTagEnum dead code

- **D-01:** Remove RelationshipTagEnum from `src/types/research.ts` — it's never wired into ResearchSegmentSchema.keyContent

### Issue 2 (Phase 5): Config.overrideWidth vs registerConfiguration

- **D-02:** This is NOT a code bug — `Config.overrideWidth/overrideHeight` from `@remotion/cli/config` IS the correct Remotion API. The UAT expectation was wrong.
- **D-02a:** Update 05-UAT.md to correct the expected behavior
- **D-02b:** Add inline comment to Root.tsx explaining the API choice

### Issue 3 (Phase 5): Verification module deleted

- **D-03:** NOT a code bug — verification module was intentionally deleted in Phase 8 (08-03 cleanup). The Phase 5 UAT expected it to exist, but it was superseded by Phase 8's cleanup.
- **D-03a:** Update 05-UAT.md to note the verification module was intentionally removed

### Issue 4 (Phase 6): packages/types/dist/ not built

- **D-04:** Run `npm run build` in packages/types to generate dist/

## Housekeeping

### ROADMAP.md

- Phase 9: 09-02 is unchecked but was completed (Phase 10 UAT confirmed scene-adapter wired)
- Phase 11: Shows 0/3 but all 3 plans completed
- Phase 12: Shows 1/2 but both plans completed

### REQUIREMENTS.md

- VIS-04~VIS-07: Unchecked but passed Phase 2, 7, 10, 12 UAT
- RES-02: Unchecked but passed Phase 3 UAT (Turndown + Readability verified)
- Traceability table: VIS-04~VIS-07 show "Pending" but should be "Complete"

## E2E Pipeline Tests

### Test Strategy

- Use pre-generated fixture files (script.json, visual.json, mock screenshots)
- Test scene-adapter functions: createTextElements with visualLayers, mapYToPosition
- Test compose-agent helper functions: mapLayoutToComponent, secondsToFrames, generateSceneCode, generateRootCode
- Test findScreenshotFile logic from CLI compose step

</decisions>

<artifacts>
## Key Files

| File                                        | Role                             |
| ------------------------------------------- | -------------------------------- |
| `src/types/research.ts`                     | Remove RelationshipTagEnum       |
| `packages/renderer/src/remotion/Root.tsx`   | Add API comment                  |
| `.planning/phases/05-composition/05-UAT.md` | Fix issues 2+3 docs              |
| `.planning/ROADMAP.md`                      | Fix progress table               |
| `.planning/REQUIREMENTS.md`                 | Fix checkboxes + traceability    |
| `src/utils/scene-adapter.ts`                | Test target                      |
| `src/mastra/agents/compose-agent.ts`        | Test target                      |
| `src/cli/index.ts`                          | Test target (findScreenshotFile) |

</artifacts>
