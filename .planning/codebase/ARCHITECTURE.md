# Architecture

**Analysis Date:** 2026-03-22

## Pattern Overview

**Overall:** Two-Process Agent Pipeline with Mastra orchestration

The project implements a **two-process architecture** to isolate zod version conflicts between the main CLI and the Remotion renderer:

```
Main CLI (Mastra + zod v4)  →  Spawns  →  video-script-render (Remotion + zod v3)
```

**Key Characteristics:**
- Agent-based orchestration via Mastra framework
- Pipeline workflow: Research → Script → Visual → Screenshot → Compose → Render
- Subprocess spawning for renderer isolation (zod v3 vs v4 incompatibility)
- JSON file-based IPC between main process and renderer subprocess
- React/Remotion for video composition in isolated package

## Layers

**CLI Layer:**
- Purpose: User-facing command-line interface and workflow orchestration
- Location: `src/cli/`
- Contains: Commander.js commands, Inquirer prompts, phase orchestration
- Depends on: Mastra agents, utils, types
- Used by: End users via terminal

**Agent Layer:**
- Purpose: LLM-powered agents for video generation tasks
- Location: `src/mastra/agents/`
- Contains: research-agent, script-agent, visual-agent, screenshot-agent, compose-agent
- Depends on: Tools, types/schemas
- Used by: CLI layer calls agents sequentially

**Tools Layer:**
- Purpose: Reusable tools accessible to agents
- Location: `src/mastra/tools/`
- Contains: web-fetch, playwright-screenshot, code-highlight, remotion-render, remotion-project-generator
- Depends on: External services (web, Playwright, Shiki, Remotion)
- Used by: Agent layer

**Types Layer:**
- Purpose: Zod schemas for runtime validation across the pipeline
- Location: `src/types/`
- Contains: research.ts, script.ts, visual.ts, validations.ts
- Depends on: Zod v4 (main), Zod v3 (renderer package)
- Used by: All layers

**Remotion Components (Main):**
- Purpose: React components for video composition (used by renderer)
- Location: `src/remotion/`
- Contains: Root.tsx, Composition.tsx, Scene.tsx, Intro.tsx, Outro.tsx, Subtitle.tsx
- Depends on: React, Remotion
- Used by: Generated projects (copied or referenced)

**Renderer Package:**
- Purpose: Isolated subprocess for actual video rendering
- Location: `packages/renderer/`
- Contains: CLI entry point, video-renderer.ts, remotion components, SRT generator
- Depends on: Remotion, zod v3 (isolated)
- Used by: Main process via spawnRenderer()

**Utils Layer:**
- Purpose: Shared utilities for process management, error handling, workflow state
- Location: `src/utils/`
- Contains: process-manager.ts, errors.ts, workflow-state.ts, config.ts, etc.
- Depends on: Node.js built-ins
- Used by: CLI layer, tools

## Data Flow

**Video Generation Pipeline:**

1. **Input** (title + links + document)
   - CLI collects via Inquirer prompts or command arguments

2. **Research Agent** (`src/mastra/agents/research-agent.ts`)
   - Fetches web content from provided URLs
   - Extracts key concepts and content segments
   - Outputs: ResearchOutput (markdown or structured)

3. **Script Agent** (`src/mastra/agents/script-agent.ts`)
   - Converts research to spoken narration
   - Divides into scenes (intro/feature/code/outro)
   - Segments narration with timing
   - Marks key points for visual emphasis
   - Outputs: NewScriptOutput (narration + segments + highlights)

4. **Visual Agent** (`src/mastra/agents/visual-agent.ts`)
   - Reads visual plan requirements
   - Selects layout templates, annotations, animations
   - Binds visual elements to narration timeline
   - Outputs: VisualPlan (scenes with mediaResources, annotations, textElements)

5. **Screenshot Agent** (`src/mastra/agents/screenshot-agent.ts`)
   - Captures screenshots via Playwright
   - Applies code highlighting via Shiki
   - Generates manifest of screenshot resources

6. **Compose Agent** (`src/mastra/agents/compose-agent.ts`)
   - Reads Visual Plan and screenshot manifest
   - Generates Remotion project (Root.tsx, Scene components)
   - Outputs: Project path and resource mapping

7. **Renderer Subprocess** (`packages/renderer/src/cli.ts`)
   - Spawned via spawnRenderer() in `src/utils/process-manager.ts`
   - Receives JSON input via temp file
   - Renders video via Remotion
   - Outputs MP4 + optional SRT
   - Returns result via stdout JSON

**State Management:**
- WorkflowStateManager (`src/utils/workflow-state.ts`) tracks step progress
- GracefulShutdown (`src/utils/graceful-shutdown.ts`) handles SIGINT/SIGTERM
- SceneAccumulator (`src/utils/scene-accumulator.ts`) aggregates scene data

## Key Abstractions

**Agent Abstraction:**
- Each agent is a Mastra Agent with instructions, model, and tools
- Example: `src/mastra/agents/script-agent.ts` - "You are a professional video scriptwriter..."
- Agents return structured JSON validated by Zod schemas

**Tool Abstraction:**
- Tools are registered with agents and callable by LLM
- Example: `src/mastra/tools/remotion-render.ts` - wraps renderVideo()
- Tools follow a consistent interface: name, description, schema

**Process Manager Abstraction:**
- `src/utils/process-manager.ts` - spawnRenderer() isolates Remotion rendering
- JSON input file + stdout JSON result pattern
- Progress callbacks via stdout line-by-line JSON

**Workflow State Abstraction:**
- `src/utils/workflow-state.ts` - WorkflowStateManager class
- Tracks: runId, currentStep, completedSteps, errors, outputs

## Entry Points

**CLI Entry:**
- Location: `src/cli/index.ts`
- Triggers: `video-script create` or `npm run dev:cli`
- Responsibilities: Command parsing, Inquirer prompts, phase orchestration, spawns renderer

**Renderer CLI Entry:**
- Location: `packages/renderer/src/cli.ts`
- Triggers: Spawned by main CLI via `node packages/renderer/bin/video-script-render.js render --input <file>`
- Responsibilities: Parse JSON input, call renderVideo(), output result to stdout

**Mastra Dev Entry:**
- Location: `src/mastra/` (directory with index.ts)
- Triggers: `npm run dev` (mastra dev -d src/mastra)
- Responsibilities: Agent registration, skill loading, Mastra studio

## Error Handling

**Strategy:** Error codes + typed errors + retry logic

**Patterns:**
- `VideoGenerationError` with codes: INVALID_INPUT, WEB_FETCH_FAILED, SCREENSHOT_FAILED, CODE_HIGHLIGHT_FAILED, REMOTION_RENDER_FAILED, LLM_API_ERROR
- `ValidationError` for Zod schema failures
- `TimeoutError` for long-running operations
- `NetworkError` for web fetch issues
- `withRetry()` wrapper in `src/utils/errors.ts` for retryable operations

**Renderer Errors:**
- Propagated via RenderProcessOutput.success and RenderProcessOutput.error
- Timeout kills process after 10 minutes default

## Cross-Cutting Concerns

**Logging:** Custom logger in `src/utils/logger.ts` (not console.log)

**Validation:** Zod schemas in `src/types/` validate all agent inputs/outputs

**Authentication:** API keys via environment variables (MINIMAX_CN_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY)

**Configuration:** Config file `video-script.config.json` + .env support via `src/utils/config.ts`

---

*Architecture analysis: 2026-03-22*
