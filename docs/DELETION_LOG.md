# Code Deletion Log

## [2026-03-26] Refactor Session — Dead Code Cleanup

### Unused Files Deleted

| File                                                   | Reason                                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/__mocks__/zod.ts`                                 | Dead manual mock — not referenced in `vitest.config.ts` or any test file; replaced by alias-based zod resolution |
| `tests/e2e/fixtures/video-script-e2e-test/script.json` | Orphaned fixture — not referenced by any test file                                                               |
| `src/mastra/pipelines/research-pipeline.ts`            | Orphaned module — no external imports; self-contained dead code                                                  |
| `src/mastra/quality/quality-agent.ts`                  | Only used by `research-pipeline.ts` (itself orphaned)                                                            |
| `src/mastra/quality/quality-schemas.ts`                | Only used by `research-pipeline.ts` (itself orphaned)                                                            |
| `src/mastra/quality/quality-prompt.ts`                 | Only used by `research-pipeline.ts` (itself orphaned)                                                            |
| `src/mastra/agents/quality-agent.ts`                   | Imported from deleted quality module; not exported from `agents/index.ts`; no other consumers                    |
| `packages/renderer/src/output-directory.ts`            | Duplicate of `src/utils/output-directory.ts`; not imported by any file in the renderer package                   |
| `test-research-agent.mjs`                              | Root-level experiment script; not referenced from any production or test code                                    |
| `test-visual-playwright.ts`                            | Root-level experiment script; not referenced from any production or test code                                    |

### Generated Artifacts Removed (not git-tracked)

| Path                                               | Reason                                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `tests/e2e/video-playback-test/.remotion-bundle/`  | Generated Remotion build artifact (~1.1 MB); not source code                       |
| `tests/e2e/video-playback-test/.remotion-project/` | Generated Remotion project with embedded `node_modules` (~7.2 MB); not source code |

### Dead Exports Removed

| File                 | Removed Exports                                                                                                                    | Reason                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/utils/index.ts` | `generateRemotionProject`, `GenerateProjectInput`, `GenerateProjectOutput`                                                         | Re-exported but never consumed outside `src/utils/`; CLI only imports `spawnRenderer`, `workflowStateManager`, `generateRunId` |
| `src/utils/index.ts` | `renderVideo`, `RenderVideoInput`, `RenderVideoOutput`                                                                             | Same — CLI uses `spawnRenderer` (subprocess), not direct `renderVideo`                                                         |
| `src/utils/index.ts` | `generateSrt`, `GenerateSrtInput`, `GenerateSrtOutput`                                                                             | No consumer outside the barrel itself                                                                                          |
| `src/utils/index.ts` | `cleanupTempFiles`, `cleanupRemotionTempDir`, `DEFAULT_PRESERVE_PATTERNS`, `CleanupOptions`, `CleanupResult`, `CleanupTempOptions` | No consumer outside the barrel itself                                                                                          |

### Impact

| Metric                       | Value      |
| ---------------------------- | ---------- |
| Files deleted                | 10         |
| Dead re-exports removed      | 14 symbols |
| Lines of code removed        | ~524       |
| Disk space freed (artifacts) | ~8.3 MB    |

### Commits

| Commit    | Description                                                                   |
| --------- | ----------------------------------------------------------------------------- |
| `ef703b4` | `chore/cleanup: remove dead zod mock and orphaned e2e fixture`                |
| `4e05333` | `chore/cleanup: remove orphaned research pipeline and quality module cluster` |
| `6cbc38b` | `chore/cleanup: remove dead output-directory.ts from renderer package`        |
| `47236c5` | `chore/cleanup: remove root-level experiment scripts`                         |
| `d543f80` | `chore/cleanup: remove dead re-exports from src/utils/index.ts`               |

### Testing

- `pnpm build` — ✅ passes after every batch
- `pnpm typecheck` — ✅ passes after every batch

### Items Kept (Verified Live)

- `tests/e2e/video-playback-test/script.json` — actively referenced by `compose-pipeline.test.ts`
- `src/utils/remotion-project-generator.ts` — used by `src/mastra/tools/remotion-project-generator.ts` (Mastra tool)
- `src/utils/video-renderer.ts` — used by renderer package and tests
- `packages/renderer/src/utils/sceneAdapter.ts` — used in renderer layout pipeline
- `src/mastra/workflows/index.ts` — retained (comment-only placeholder, harmless)
