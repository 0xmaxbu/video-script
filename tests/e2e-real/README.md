# E2E Real Tests

This directory contains **real end-to-end tests** that call the actual `video-script` CLI and require live API credentials (e.g. `OPENAI_API_KEY`).

They are intentionally separated from the unit/integration test suite so they never run accidentally in dev or CI without credentials.

---

## Running the tests

```bash
# Run all E2E real tests (skips gracefully when API keys are missing)
npm run test:e2e

# Run in CI with real keys — enforce ≥1 non-skipped test per suite
REQUIRE_REAL_EXECUTION=true npm run test:e2e
```

---

## Test files

| File                         | What it tests                                | Requirement      |
| ---------------------------- | -------------------------------------------- | ---------------- |
| `script-quality.test.ts`     | Script Quality eval on the `create` path     | `OPENAI_API_KEY` |
| `screenshot-quality.test.ts` | Screenshot Quality eval on the `resume` path | `OPENAI_API_KEY` |

---

## Helpers

| File                         | Purpose                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `helpers/env-guard.ts`       | `hasRealApiEnv()` — returns `true` if the required env vars are present                  |
| `helpers/cli-runner.ts`      | `runCreate()` / `runResume(dir)` — thin wrappers around the CLI for use in tests         |
| `assert-suite-execution.mjs` | Parses a Vitest JSON report and asserts that required suites were discovered + non-empty |

---

## Skip behaviour

All tests in this directory call `maybeSkip()` — a local helper that wraps `it.skip` when `OPENAI_API_KEY` is absent. This means:

- `npm test` (unit/integration suite) **never runs these files** (excluded by `vitest.config.ts`)
- `npm run test:e2e` runs them but **skips gracefully** if API keys are missing
- In CI with keys, every test runs for real

---

## Suite discovery assertion

`assert-suite-execution.mjs` reads the Vitest JSON reporter output and verifies that:

1. Each required suite file **appears in the report** (was discovered)
2. Each suite has **at least 1 test listed** (not empty)
3. _(CI only)_ Each suite has **≥1 non-skipped test** when `REQUIRE_REAL_EXECUTION=true`

This prevents silent regressions where a suite is accidentally excluded from the runner config.
