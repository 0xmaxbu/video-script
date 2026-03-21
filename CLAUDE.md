# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**video-script** is an AI-powered CLI tool that generates technical tutorial videos from titles, links, and documentation. It automates the complete video generation pipeline: research, script generation, screenshot capture, video composition (Remotion), and MP4/SRT output.

## Commands

```bash
# Development
npm run dev           # Mastra dev mode (watch)
npm run dev:cli       # CLI in watch mode with tsx
npm run build         # TypeScript compile
npm run test          # Vitest run
npm run test:watch    # Vitest watch mode
npm run typecheck     # tsc --noEmit
npm run format        # Prettier format
npm run lint          # ESLint

# Project-specific
npm run studio        # Mastra studio
video-script create "Title" --links "url1,url2"  # Generate video
video-script config   # View/update config
```

## Architecture

### Two-Process Model

The project uses a **two-process architecture** to handle zod version conflicts:

```
Main CLI (Mastra + zod v4)  →  Spawns  →  video-script-render (Remotion + zod v3)
```

- **Main process**: CLI, agents, workflows, tools (zod v4)
- **Renderer subprocess**: Remotion video rendering (zod v3, isolated in `packages/renderer`)
- Communication: JSON input file + stdout JSON result
- This avoids runtime type errors and Node.js v24 native module compatibility issues

### Data Flow

```
Input (title + links + doc)
  → Research Agent (web fetch + analysis)
  → Script Agent (narration + scene timeline)
  → Screenshot Agent (Playwright capture + Shiki highlight)
  → Compose Agent (Remotion project generation)
  → video-script-render subprocess (MP4 + SRT output)
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/cli/` | CLI entry point (Commander.js + Inquirer) |
| `src/mastra/agents/` | 4 AI agents: research, script, screenshot, compose |
| `src/mastra/tools/` | Tools: web-fetch, playwright-screenshot, code-highlight, remotion-render |
| `src/mastra/workflows/` | Video generation workflow orchestration |
| `src/types/` | Zod schemas for research, script, validation |
| `src/utils/` | Config, errors, SRT generator, process manager |
| `src/remotion/` | Remotion React components (used by renderer) |
| `packages/renderer/` | Isolated renderer package (own node_modules) |

### Renderer Package (`packages/renderer`)

The standalone renderer is published as `@video-script/renderer`:
- `src/cli.ts` - Accepts JSON input, writes result to stdout
- `src/video-renderer.ts` - Core Remotion rendering
- `src/remotion/` - React composition components
- `src/srt-generator.ts` - Subtitle generation

## Task Tracking (Beads)

**ALL task tracking uses `bd` (beads)** - never markdown TODOs or external trackers.

```bash
bd ready              # Show available issues (no blockers)
bd list --status=open # All open issues
bd create "Title" -t feature -p 2  # Create issue
bd update <id> --status=in_progress  # Claim work
bd close <id> --reason "Done"  # Complete
bd dolt push          # Sync to remote
```

**Session recovery**: Run `bd prime` after context compaction, clear, or new session.

## Output Directory

Default: `~/simple-videos/<Year>/<Week>-<StartMonth>_<StartDay>-<EndMonth>_<EndDay>/<slugified-title>`

Example: `~/simple-videos/2026/12-3_16-3_22/typescript-54-xin-te-xing`

Use `--output <dir>` to override.

## Session Close Protocol

Before ending a session, you MUST:
1. `git status` - Check what changed
2. `git add <files>` - Stage code changes
3. `git commit -m "..."` - Commit
4. `git push` - Push to remote

Work is NOT complete until pushed.

## TypeScript Conventions

- All interfaces use Zod for runtime validation
- Schemas defined in `src/types/` with `z.object()`, `z.infer<typeof ...>`
- No `any` types, no `@ts-ignore`, no `@ts-expect-error`
- Scene types: `intro`, `feature`, `code`, `outro`
- Visual layers: `screenshot`, `code`, `text`, `diagram`, `image`

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Validation errors |
| `WEB_FETCH_FAILED` | Network issues |
| `SCREENSHOT_FAILED` | Playwright timeout |
| `CODE_HIGHLIGHT_FAILED` | Shiki errors |
| `REMOTION_RENDER_FAILED` | Video rendering errors |
| `LLM_API_ERROR` | API failures |

## Configuration

Environment variables in `.env`:
- `MINIMAX_CN_API_KEY` or `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `LLM_MODEL` (defaults to `minimax-cn-coding-plan/MiniMax-M2.5`)

Config file: `video-script.config.json` (LLM, video settings, screenshot viewport)
