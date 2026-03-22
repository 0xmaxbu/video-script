---
id: SEED-001
status: dormant
planted: 2026-03-22
planted_during: current milestone
trigger_when: After current milestone completes
scope: Medium
---

# SEED-001: Restructure CLI with modular subcommands (research/script/visual/screenshot/compose)

## Why This Matters

The user needs to use this tool to make videos. The current monolithic "create" command makes it difficult to:
- Run individual pipeline steps independently
- Debug/iterate on specific steps when something goes wrong
- Use the tool flexibly for different workflows

Breaking into subcommands gives users granular control over each stage of the video generation pipeline.

## When to Surface

**Trigger:** After current milestone completes

This seed should be presented during `/gsd:new-milestone` when the milestone scope includes CLI redesign or v2.0 planning.

## Scope Estimate

**Medium** — A phase or two — needs planning. Involves restructuring the CLI entry point, creating separate handlers for each subcommand, and ensuring state flows correctly between steps.

## Breadcrumbs

Related code and decisions found in the current codebase:

- `src/cli/index.ts` - Current CLI entry point (Commander.js)
- `src/cli/prompts.ts` - CLI prompts
- `src/mastra/agents/index.ts` - Agent exports (researchAgent, scriptAgent, visualAgent, screenshotAgent)
- `src/types/research.js` - Research input/output schemas
- `src/types/script.js` - Script output schema
- `packages/renderer/src/cli.ts` - Renderer CLI (reference for isolated command pattern)

## Notes

Proposed subcommand structure:

```bash
video-script research "Title" --links "url1,url2"  # Generate MD research report
video-script script <research.md>                    # Generate scene JSON scripts
video-script visual <scene.json>                    # Arrange visuals per scene
video-script screenshot <visual.json>               # Capture screenshots
video-script compose <visual.json> --screenshots    # Render final video + SRT
```

Each subcommand should:
- Read output from previous step
- Write to a predictable location
- Be independently rerunnable
- Output progress/errors clearly
