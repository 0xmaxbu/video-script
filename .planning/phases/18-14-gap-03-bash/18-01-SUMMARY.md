---
phase: 18-14-gap-03-bash
plan: "01"
subsystem: testing
tags: [cli, uat, bash, artifacts, review]
requires:
  - phase: "17"
    provides: non-blocking quality-report output and test-output conventions
provides:
  - fixed Phase 18 CLI input set and output directories
  - animation-first human review template with locked verdict strings
  - preflight bash script for build, typecheck, config, and API key checks
  - artifact packaging bash script for output.mp4 normalization and manifest generation
affects: [18-02, 18-03, phase-18-review]
tech-stack:
  added: []
  patterns:
    - deterministic CLI validation inputs committed to repo
    - shell-based preflight gate before real agent-driven runs
    - shell-based artifact normalization after render completion
key-files:
  created:
    - tests/manual/phase-18/phase-14-animation-input.md
    - tests/manual/phase-18/review-template.md
    - tests/manual/phase-18/preflight-check.sh
    - tests/manual/phase-18/package-artifacts.sh
  modified: []
key-decisions:
  - "Pinned the Phase 14 Animation Engine title, five GitHub blob links, and both fixed output roots directly in repo docs so real CLI runs are reproducible."
  - "Used bash-only preflight and packaging scripts so Phase 18 validation stays on the public CLI path instead of internal TypeScript helpers."
patterns-established:
  - "Preflight must fail fast on missing provider key before any real create/resume execution."
  - "Artifact packaging copies the rendered slugged video to output.mp4 and records a manifest for review evidence."
requirements-completed: [UAT-01, UAT-02, UAT-03]
duration: 17min
completed: 2026-03-28
---

# Phase 18 Plan 01: Summary

**Deterministic Phase 18 CLI input docs plus bash preflight and artifact-packaging scripts for reproducible real-run review**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-28T11:53:19Z
- **Completed:** 2026-03-28T12:10:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Locked the exact Phase 18 title, links, output directories, and CLI command templates into `tests/manual/phase-18/phase-14-animation-input.md`.
- Added `tests/manual/phase-18/review-template.md` with animation-first checklist items and only the three allowed verdict strings: `通过` / `可接受但需优化` / `不通过`.
- Added `tests/manual/phase-18/preflight-check.sh` and `tests/manual/phase-18/package-artifacts.sh` so later plans can validate environment readiness and normalize final artifacts consistently.

## Task Commits

1. **Task 1: 固化 Phase 18 输入集与人工审核模板** - `457bcd9` (feat)
2. **Task 2: 创建 Phase 18 预检与工件打包脚本** - `457bcd9` (feat)

Additional fixes during execution:

- `bcb0f71` — first attempted repo-root correction for preflight script
- `4f4a5f7` — final corrected repo-root path for preflight script

## Files Created/Modified

- `tests/manual/phase-18/phase-14-animation-input.md` - pinned title, links, outputs, and exact CLI command templates
- `tests/manual/phase-18/review-template.md` - human review checklist and final verdict placeholders
- `tests/manual/phase-18/preflight-check.sh` - build/typecheck/config/provider-key preflight gate plus output-dir reset
- `tests/manual/phase-18/package-artifacts.sh` - verifies artifact bundle, copies `output.mp4`, and writes `artifact-manifest.txt`

## Decisions Made

- Pinned all real-run inputs in repo files instead of relying on plan prose, so the execution path cannot drift between one-shot and resume runs.
- Kept packaging in shell so Phase 18 continues validating the public CLI and filesystem behavior rather than internal helper contracts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected preflight script repo-root resolution**

- **Found during:** Post-task verification
- **Issue:** The initial root-path adjustment made the script run from `/Volumes/SN350-1T/dev`, so `npm run build` could not locate `package.json`.
- **Fix:** Restored the correct relative path from `tests/manual/phase-18/` back to the repository root.
- **Files modified:** `tests/manual/phase-18/preflight-check.sh`
- **Verification:** Re-ran the script until it reached the expected API-key gate after successful build and typecheck.
- **Committed in:** `4f4a5f7`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope creep. The fix was required so later real CLI runs would execute from the repository root.

## Issues Encountered

- Verification commands in the plan used `rg`, but `rg` was not installed in this environment. I switched file verification to the dedicated Grep tool without changing any plan outputs.
- A parallel commit attempt caused the first feature commit to include all four new files at once; no user-visible artifacts were lost, but the plan ended with one feature commit plus two follow-up fix commits instead of two separate feature commits.

## User Setup Required

External services require manual configuration before Plan 18-02 can run. The current config uses `llm.provider=openai`, so `OPENAI_API_KEY` must be present in the shell environment or `.env`.

## Next Phase Readiness

- Plan 18-01 outputs are complete and committed.
- Plan 18-02 is blocked only by missing LLM credentials; build and typecheck already pass.

## Self-Check: PASSED

- Found `tests/manual/phase-18/phase-14-animation-input.md`
- Found `tests/manual/phase-18/review-template.md`
- Found `tests/manual/phase-18/preflight-check.sh`
- Found `tests/manual/phase-18/package-artifacts.sh`
- Found commits `457bcd9`, `bcb0f71`, and `4f4a5f7`
