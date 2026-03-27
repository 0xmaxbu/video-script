---
status: diagnosed
phase: 16-visual-polish
source: 16-01-SUMMARY.md, 16-02-SUMMARY.md, 16-03-SUMMARY.md, 16-04-SUMMARY.md, 16-05-SUMMARY.md
started: 2026-03-27T02:35:00Z
updated: 2026-03-27T03:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Build compiles cleanly

expected: `npm run build` exits 0, no TypeScript errors across all packages
result: pass

### 2. Full test suite passes

expected: `npm test` completes with 508 passed, 0 failed (across 36 test files)
result: pass

### 3. Callout layer schema validation

expected: A VisualLayer JSON with `type: "callout"` and content `{"text":"Key insight","style":"highlight"}` passes Zod schema validation; a layer with `style: "invalid-style"` is rejected
result: issue
reported: "FAIL: invalid_enum_value - type 'callout' not in enum options ['screenshot','code','text','diagram','image']"
severity: major

### 4. ProgressIndicator schema validation

expected: A SceneScript JSON with `progressIndicator: { enabled: true, total: 3, current: 2 }` parses cleanly; omitting the field entirely also works (backward compatible)
result: issue
reported: "VALID: undefined — field parses without error but progressIndicator is stripped from output (not present in SceneScriptSchema)"
severity: major

### 5. THEME constants structure

expected: `packages/renderer/src/remotion/theme.ts` exports `THEME` with `bg.primary: "#0a0a0a"`, `text.primary: "#ffffff"`, `accent.yellow: "#FFD700"`, `glass.bg: "rgba(255,255,255,0.05)"`
result: issue
reported: "FAIL: Cannot find module '/Volumes/SN350-1T/dev/video-script/packages/renderer/dist/remotion/theme.js' — file missing from dist output"
severity: major

### 6. @remotion/bundler and @remotion/renderer installed

expected: Both `@remotion/bundler` and `@remotion/renderer` appear in `packages/renderer/package.json` dependencies at version `^4.0.436`; their directories exist under `packages/renderer/node_modules/@remotion/`
result: pass

### 7. Compose command smoke test

expected: Run `npm run build && node dist/cli/index.js compose tests/e2e/video-playback-test/script.json --output /tmp/uat-test-render-16`. Command should complete (may take several minutes) and produce a video file at that path. OR, if blocked by long render time, the command should at least start without schema/import errors.
result: issue
reported: "Build succeeded (tsc clean), but CLI rejected --output flag: 'error: unknown option --output'"
severity: major

## Summary

total: 7
passed: 3
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "VisualLayerSchema accepts type: 'callout' as a valid layer type"
  status: failed
  reason: "User reported: FAIL: invalid_enum_value - 'callout' not in enum options ['screenshot','code','text','diagram','image']"
  severity: major
  test: 3
  root_cause: "packages/renderer dist is stale — src/types.ts:75 correctly has 'callout' in the enum, but packages/renderer was never rebuilt after source changes. Root-level `npm run build` only compiles the main CLI (tsc), not packages/renderer."
  artifacts:
  - path: "packages/renderer/src/types.ts"
    issue: "Source is correct (line 75 has callout) but dist/types.js is stale"
  - path: "packages/renderer/dist/types.js"
    issue: "Stale — does not reflect recent source changes"
    missing:
  - "Run `cd packages/renderer && npx tsc` to rebuild the package dist"
  - "Or add packages/renderer build step to root npm run build script"
    debug_session: ""

- truth: "SceneScriptSchema includes progressIndicator field and returns it in parsed output"
  status: failed
  reason: "User reported: VALID: undefined — field parses without error but progressIndicator is stripped from output"
  severity: major
  test: 4
  root_cause: "Same stale dist issue as gap 3 — src/types.ts:185 correctly defines progressIndicator in SceneScriptSchema, but packages/renderer/dist is not rebuilt."
  artifacts:
  - path: "packages/renderer/src/types.ts"
    issue: "Source is correct (lines 185-191 have progressIndicator) but dist is stale"
    missing:
  - "Rebuild packages/renderer dist (same fix as gap 3)"
    debug_session: ""

- truth: "packages/renderer dist output includes remotion/theme.js with THEME constants"
  status: failed
  reason: "User reported: Cannot find module 'packages/renderer/dist/remotion/theme.js' — file missing from dist"
  severity: major
  test: 5
  root_cause: "packages/renderer/src/remotion/theme.ts exists but was not compiled into dist. The tsconfig.json excludes only remotion.config.ts — theme.ts should be compiled. However dist/remotion/ has no theme.js, meaning the packages/renderer dist hasn't been rebuilt since theme.ts was created."
  artifacts:
  - path: "packages/renderer/src/remotion/theme.ts"
    issue: "Source exists but not compiled to dist"
  - path: "packages/renderer/dist/remotion/"
    issue: "Missing theme.js/theme.d.ts entirely"
    missing:
  - "Rebuild packages/renderer dist (same fix as gaps 3 & 4)"
    debug_session: ""

- truth: "CLI compose command accepts --output flag for specifying render output path"
  status: failed
  reason: "User reported: Build succeeded (tsc clean), but CLI rejected --output flag: 'error: unknown option --output'"
  severity: major
  test: 7
  root_cause: "The compose command (src/cli/index.ts:784) only defines .option('--subtitles') — no --output option exists. The compose command takes <dir> as a positional arg (the directory already containing script.json + screenshots). The beads task video-script-nhfg 'Update CLI compose command for new schema' is in-progress and not yet implemented."
  artifacts:
  - path: "src/cli/index.ts"
    issue: "compose command at line 784 missing --output option"
    missing:
  - "Add .option('--output <dir>', 'Custom output path for rendered video') to compose command"
  - "Wire options.output into the renderVideo call"
    debug_session: ""

## Gaps

- truth: "VisualLayerSchema accepts type: 'callout' as a valid layer type"
  status: failed
  reason: "User reported: FAIL: invalid_enum_value - 'callout' not in enum options ['screenshot','code','text','diagram','image']"
  severity: major
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "SceneScriptSchema includes progressIndicator field and returns it in parsed output"
  status: failed
  reason: "User reported: VALID: undefined — field parses without error but progressIndicator is stripped from output"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "packages/renderer dist output includes remotion/theme.js with THEME constants"
  status: failed
  reason: "User reported: Cannot find module 'packages/renderer/dist/remotion/theme.js' — file missing from dist"
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
