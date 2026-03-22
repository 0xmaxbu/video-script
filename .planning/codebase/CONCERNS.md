# Codebase Concerns

**Analysis Date:** 2026-03-22

## Tech Debt

**Video Rendering Pipeline Not Fully Integrated:**
- Issue: `renderVideo` function is commented out in `src/cli/index.ts` (per design doc at `openspec/changes/archive/2026-03-17-fix-video-rendering-pipeline/design.md`)
- Files: `src/cli/index.ts`
- Impact: The `compose` command only calls LLM for layout suggestions but never executes actual video rendering
- Fix approach: Uncomment and integrate `renderVideo()` call, update schema compatibility

**Schema Mismatch Between Renderer and ScriptOutput:**
- Issue: `video-renderer.ts` uses `RenderVideoInputSchema` with `totalDuration` as optional field, but `ScriptOutputSchema` requires `totalDuration` as positive number
- Files: `src/utils/video-renderer.ts`, `src/types/script.ts`
- Impact: Video rendering may fail validation when passing script output
- Fix approach: Align schemas per design doc D2 decision

**Duplicate Rendering Code Paths:**
- Issue: Two different rendering approaches exist: `process-manager.ts` spawns `packages/renderer/bin/video-script-render.js`, while `video-renderer.ts` directly spawns `npx remotion render`
- Files: `src/utils/process-manager.ts`, `src/utils/video-renderer.ts`
- Impact: Code duplication, maintenance burden, inconsistent behavior
- Fix approach: Consolidate to single rendering path

**Code Highlight Tool - Incomplete Screenshot Generation:**
- Issue: `generateScreenshot` parameter is accepted but always returns `null` for `imagePath` - marked as "MVP phase"
- Files: `src/mastra/tools/code-highlight.ts` (lines 39-41)
- Impact: Visual code annotations cannot be captured as images
- Fix approach: Implement actual screenshot capture using Playwright

**Zod Version Conflict - Two-Process Architecture:**
- Issue: Main CLI uses zod v4 (`"zod": "^4.3.6"`), renderer package uses zod v3 (`"zod": "^3.25.56"`)
- Files: `package.json`, `packages/renderer/package.json`
- Impact: Runtime type errors if packages share zod instances; forces two-process model
- Fix approach: Migrate renderer to zod v4 or use compatibility layer

## Known Bugs

**Generated Remotion Project Returns Null for Unknown Scene Types:**
- Symptom: Scene components in generated `Composition.tsx` return `null` for unmatched scene types
- Files: `src/mastra/tools/remotion-project-generator.ts` (line 266)
- Trigger: When `scene.type` is not "intro", "feature", "code", or "outro"
- Workaround: Ensure all scene types map to known types

**Scene Accumulator Hardcodes Title:**
- Symptom: `buildScript()` always returns title "Generated Video" when scenes exist
- Files: `src/utils/scene-accumulator.ts` (line 62)
- Trigger: Calling `getScript()` on accumulator with scenes
- Workaround: Title not critical for internal processing

## Security Considerations

**.env File Present in Repository:**
- Risk: `.env` file is tracked in git (visible in directory listing)
- Files: `.env`
- Current mitigation: Listed in `.gitignore`
- Recommendations: Ensure `.env` never gets committed; verify gitignore is working

**Process Environment Inheritance:**
- Risk: Child processes inherit full `process.env` including potentially sensitive variables
- Files: `src/utils/process-manager.ts` (lines 107-110)
- Current mitigation: NODE_PATH manipulation only
- Recommendations: Consider explicit env scrubbing for child processes

## Performance Bottlenecks

**LLM JSON Parsing with Fallback:**
- Problem: `parseScriptFromLLMOutput()` uses heuristic scoring and multiple parse attempts
- Files: `src/utils/json-parser.ts`
- Cause: LLM output may be malformed, requiring multiple extraction attempts
- Improvement path: Improve prompt engineering to reduce malformed output rate

**Synchronous Video Rendering:**
- Problem: `renderVideo()` blocks CLI until rendering completes
- Files: `src/utils/video-renderer.ts`
- Cause: Remotion rendering is CPU-intensive
- Improvement path: Consider async rendering with progress callback

## Fragile Areas

**Screenshot Agent - Filename Matching Logic:**
- Files: `src/cli/index.ts` (lines 59-89)
- Why fragile: Complex regex matching for `scene-XXX-layer-Y.png` format; breaks if naming changes
- Safe modification: Add unit tests for filename patterns; document naming convention
- Test coverage: No explicit tests found for filename matching

**Workflow State Manager - Silent Error Swallowing:**
- Files: `src/utils/workflow-state.ts` (lines 93-96, 113-116, 306-308, 320-322)
- Why fragile: Errors are caught but silently ignored; state corruption may go unnoticed
- Safe modification: Add error logging; consider throwing in critical paths
- Test coverage: No tests for error recovery scenarios

**Graceful Shutdown - Best-Effort Cleanup:**
- Files: `src/utils/graceful-shutdown.ts`
- Why fragile: State saving and cleanup silently fail; no retry or alert
- Safe modification: Log failures; consider queue for retry
- Test coverage: No tests for shutdown scenarios

## Scaling Limits

**Single-Process CLI Architecture:**
- Current capacity: One video generation at a time per CLI instance
- Limit: No parallel processing of multiple videos
- Scaling path: Add job queue with worker processes

**Workflow State File-Based Storage:**
- Current capacity: Single machine, single workflow at a time
- Limit: Cannot share state between machines or handle concurrent workflows
- Scaling path: Move to database (SQLite/PostgreSQL)

## Dependencies at Risk

**@remotion/* packages at version 4.0.436:**
- Risk: Remotion 4.x may have breaking changes in future minor versions
- Impact: Video rendering pipeline breaks if upgraded without testing
- Migration plan: Pin to exact version, test upgrades before deploying

**shiki at version ^4.0.2:**
- Risk: New major version may change API
- Impact: Code highlighting breaks
- Migration plan: Test shiki 5.x when available

**@mastra/core at version ^1.13.2:**
- Risk: Mastra agent framework changes
- Impact: Agent behavior may change silently
- Migration plan: Review changelog on upgrade

## Missing Critical Features

**No SRT Subtitle Generation in Main Pipeline:**
- Problem: SRT generator exists but is not integrated into main workflow
- Files: `src/utils/srt-generator.ts`
- Blocks: Accessible video with captions

**No Video Progress/Preview During Rendering:**
- Problem: No way to preview video while it is rendering
- Blocks: Quality assurance of video before completion

**No Error Recovery Mid-Workflow:**
- Problem: If screenshot fails, entire workflow must restart
- Files: Workflow state only supports retry on step level
- Blocks: Resumable workflows after partial failure

## Test Coverage Gaps

**Screenshot Filename Matching:**
- What's not tested: Regex patterns for `scene-XXX.png` and `scene-XXX-layer-Y.png`
- Files: `src/cli/index.ts`
- Risk: Silent failures if screenshot naming changes
- Priority: Medium

**Error Handling in Workflow State:**
- What's not tested: Corrupted JSON file recovery, concurrent access
- Files: `src/utils/workflow-state.ts`
- Risk: Silent data loss
- Priority: High

**JSON Parser Edge Cases:**
- What's not tested: Malformed LLM output with unbalanced braces, nested code blocks
- Files: `src/utils/json-parser.ts`
- Risk: Script generation fails unexpectedly
- Priority: Medium

**Render Process Timeout Scenarios:**
- What's not tested: What happens when render times out
- Files: `src/utils/process-manager.ts`
- Risk: Zombie processes, orphaned temp files
- Priority: High

---

*Concerns audit: 2026-03-22*
