---
phase: "17"
plan: "17"
subsystem: "quality"
tags: ["e2e", "testing", "quality-eval", "vitest", "cli"]
dependency-graph:
  requires:
    [
      "src/utils/quality/",
      "src/mastra/agents/quality/",
      "src/cli/index.ts",
      "packages/renderer/src/utils/project-generator.ts",
    ]
  provides:
    [
      "tests/e2e-real/",
      "tests/fixture-e2e/",
      "src/types/quality.ts",
      "src/utils/quality/",
    ]
  affects: ["vitest.config.ts", "vitest.e2e.config.ts", "package.json"]
tech-stack:
  added:
    [
      "vitest JSON reporter",
      "assert-suite-execution.mjs (custom assertion script)",
    ]
  patterns:
    [
      "non-blocking eval hook",
      "skip-on-missing-env-var pattern",
      "fixture-driven contract testing",
      "JSON report assertion",
    ]
key-files:
  created:
    - src/types/quality.ts
    - src/utils/quality/report-writer.ts
    - src/utils/quality/non-blocking-runner.ts
    - src/utils/quality/test-output.ts
    - src/utils/quality/run-script-quality-step.ts
    - src/utils/quality/run-screenshot-quality-step.ts
    - src/utils/augment-screenshot-layers.ts
    - src/mastra/agents/quality/script-quality-agent.ts
    - src/mastra/agents/quality/screenshot-quality-agent.ts
    - src/utils/quality/__tests__/report-contract.test.ts
    - src/utils/quality/__tests__/report-writer.test.ts
    - src/cli/__tests__/quality-hook-extraction.test.ts
    - src/cli/__tests__/quality-create-path.test.ts
    - src/cli/__tests__/quality-resume-path.test.ts
    - tests/fixture-e2e/fixture-output.ts
    - tests/fixture-e2e/compose-structure.test.ts
    - tests/e2e-real/helpers/env-guard.ts
    - tests/e2e-real/helpers/cli-runner.ts
    - tests/e2e-real/script-quality.test.ts
    - tests/e2e-real/screenshot-quality.test.ts
    - tests/e2e-real/assert-suite-execution.mjs
    - tests/e2e-real/README.md
    - vitest.e2e.config.ts
  modified:
    - package.json (added test:e2e script)
    - vitest.config.ts (exclude e2e-real from unit suite)
    - src/cli/index.ts (wired quality hooks to create + resume paths)
    - src/mastra/agents/__tests__/fixtures/sample-script.json (refreshed, 4 scenes with screenshot layers)
    - src/mastra/agents/__tests__/fixtures/sample-visual.json (refreshed, 4 matching visual scenes)
    - packages/renderer/src/utils/project-generator.ts (added skipInstall option)
decisions:
  - "D-01: Quality eval is non-blocking — failures emit warnings but never abort the pipeline"
  - "D-02: Suite execution assertion uses Vitest JSON reporter output, not file-name grep or pass/fail alone"
  - "D-03: test-output/ root is project-root/test-output/ in dev, not ~/simple-videos/ (avoids polluting user output)"
  - "D-04: create path clears test-output/ before each run; resume path does NOT clear it"
  - "D-05: Script quality eval failure is non-blocking (warning only)"
  - "D-06: Screenshot quality eval failure is non-blocking (warning only)"
  - "D-07: augmentScreenshotLayers extracted to shared util (src/utils/augment-screenshot-layers.ts)"
  - "D-08: skipInstall option in GenerateProjectInput skips npm install only, not scaffolding"
  - "D-09: quality-report.md is written by both evals to the same file; screenshot eval reads sidecar JSON for prior state"
metrics:
  duration: "~3 sessions"
  completed: "2026-03-28"
  tasks: 10
  files: 24
---

# Phase 17 Plan 17: E2E Testing Summary

**One-liner:** Non-blocking quality eval hooks (Script + Screenshot) with fixture contract tests, real E2E suites (skip-on-no-key), and JSON-report-based suite discovery assertion.

---

## What Was Built

Phase 17 implemented a complete E2E testing layer for the video-script quality evaluation pipeline across 10 atomic steps in 5 waves.

### Wave 1 — Report Contract, Writer, Test Infrastructure (Steps 1-3)

- **`src/types/quality.ts`** — `QualityLevel` enum (`ok | warning | error`), `QualityReport` schema, `QualityEvalResult` type
- **`src/utils/quality/report-writer.ts`** — writes `quality-report.md` to the output directory; reads prior state via sidecar JSON so multiple evals accumulate into one report
- **`src/utils/quality/non-blocking-runner.ts`** — wraps any quality eval; catches all errors and downgrades them to `warning` so the pipeline is never blocked
- **`src/utils/quality/test-output.ts`** — `TEST_OUTPUT_ROOT` constant (`project-root/test-output/`); `getTestOutputSubdir()` for deterministic per-run subdirectory
- **`vitest.e2e.config.ts`** — separate Vitest config for `tests/e2e-real/**`; `vitest.config.ts` excludes the same glob

### Wave 2 — CLI Quality Hook Wiring (Steps 4-6)

- **`src/utils/augment-screenshot-layers.ts`** — extracted from CLI inline code; adds `kenBurnsWaypoints` to screenshot visual layers
- **`src/mastra/agents/quality/script-quality-agent.ts`** — Mastra Agent that evaluates script quality; wrapped by non-blocking runner
- **`src/mastra/agents/quality/screenshot-quality-agent.ts`** — Mastra Agent that evaluates screenshot quality; writes sidecar JSON for multi-eval accumulation
- **`src/cli/index.ts`** — wired `run-script-quality-step` to `create` path; wired `run-screenshot-quality-step` to `resume` path; both are fire-and-forget (non-blocking)

### Wave 3 — Fixture Contract Tests (Steps 7-8)

- **`tests/fixture-e2e/compose-structure.test.ts`** — 22 tests across two describe blocks:
  - _Fixture prerequisites_ (10 tests): validates `sample-script.json` and `sample-visual.json` shape so fixture regressions are caught immediately
  - _Renderer contract_ (12 tests): calls `generateProject({ skipInstall: true })` and asserts the generated Remotion project has the correct structure (Root.tsx, index.ts, package.json, tsconfig.json, public/, .gitignore, README.md, props.json)
- **`packages/renderer/src/utils/project-generator.ts`** — added `skipInstall?: boolean` to `GenerateProjectInput`; skips only the `npm install` call, not any scaffolding

### Wave 4 — Script E2E Suite (Step 9)

- **`tests/e2e-real/script-quality.test.ts`** — 11 tests across 3 describe blocks:
  - _Default topic_ — verifies quality-report.md is written after `video-script create`
  - _Topic override semantics (D-03)_ — verifies `--topic` flag changes output subdirectory name
  - _Non-blocking eval (D-05/D-06)_ — verifies a quality eval failure does not abort the pipeline
  - All tests skip gracefully when `OPENAI_API_KEY` is absent

### Wave 5 — Screenshot E2E Suite + Suite Discovery Assertion (Step 10)

- **`tests/e2e-real/screenshot-quality.test.ts`** — 8 tests across 2 describe blocks:
  - _Resume path_ — runs `create` then `resume`; checks quality-report.md, screenshot section, non-blocking behaviour
  - _Output root invariant_ — verifies `test-output/` path is always under project root
- **`tests/e2e-real/assert-suite-execution.mjs`** — parses Vitest JSON reporter output; asserts each required suite was discovered + non-empty; `REQUIRE_REAL_EXECUTION=true` enforces ≥1 non-skipped test (CI mode)
- **`tests/e2e-real/README.md`** — documents the e2e-real suite, skip behaviour, helper files, and assertion script

---

## Verification Results

```
npm run test:e2e   →  2 suites discovered, 19 tests total (all skip gracefully — no OPENAI_API_KEY in dev)
assert-suite-execution.mjs  →  ✅ All required suites discovered and verified
npm test           →  460 passed | 4 failed (pre-existing, not introduced by Phase 17)
```

Pre-existing failures (confirmed by reverting to before Phase 17):

- `src/mastra/tools/__tests__/playwright-screenshot.test.ts` — 1 failure (`waitUntil: "networkidle"` vs `"load"`)
- `src/utils/__tests__/scene-adapter-visual.test.ts` — 3 failures (adapter shape mismatch)

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] `skipInstall` option in project-generator**

- **Found during:** Step 8
- **Issue:** Fixture contract tests call `generateProject()` which runs `npm install` — this takes ~30 seconds and fails in CI without network, making fixture tests slow and fragile
- **Fix:** Added `skipInstall?: boolean` to `GenerateProjectInput`; only the `execSync("npm install")` call is guarded; all scaffolding is identical to production
- **Files modified:** `packages/renderer/src/utils/project-generator.ts`
- **Commit:** `d4c236e`

**2. [Rule 2 - Missing Critical Functionality] Sidecar JSON for multi-eval report accumulation**

- **Found during:** Step 6 design
- **Issue:** Screenshot quality eval would overwrite Script quality eval's `quality-report.md` if both wrote independently
- **Fix:** `run-screenshot-quality-step.ts` reads prior Script eval result from sidecar JSON (`quality-report.json`) and merges both into the final Markdown report
- **Files modified:** `src/utils/quality/run-screenshot-quality-step.ts`, `src/utils/quality/report-writer.ts`
- **Commit:** `668fe9c`

---

## Known Stubs

None — all tests wire to real implementations. Quality agents require `OPENAI_API_KEY` but skip gracefully without it.

---

## Commits

| Step | Hash      | Message                                                                           |
| ---- | --------- | --------------------------------------------------------------------------------- |
| 1    | `28621e7` | feat/quality: define report schema contract                                       |
| 2    | `0c8e4dc` | feat/quality: implement report writer and non-blocking runner                     |
| 3    | `c069e30` | feat/quality: add test-output helper and fix test layering                        |
| 4    | `f7591fe` | refactor/quality: extract augmentScreenshotLayers to shared util                  |
| 5    | `569b292` | feat/quality: wire script quality eval to create path                             |
| 6    | `668fe9c` | feat/quality: wire screenshot quality eval to resume path                         |
| 7    | `a5c945f` | test(17): add TEST-01 fixture prerequisites for compose-structure                 |
| 8    | `d4c236e` | test(17): add renderer contract assertions and skipInstall option                 |
| 9    | `2aba433` | test(17): add script quality E2E test suite for create path                       |
| 10   | `2f4d1d6` | test(17): add screenshot quality E2E suite, assertion script, and e2e-real README |
