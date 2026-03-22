# Codebase Structure

**Analysis Date:** 2026-03-22

## Directory Layout

```
video-script/
├── src/
│   ├── cli/                    # CLI entry point and phase orchestration
│   ├── mastra/                 # Mastra agents and tools
│   │   ├── agents/             # 5 AI agents
│   │   └── tools/              # Agent tools
│   ├── types/                  # Zod schemas for validation
│   ├── utils/                  # Shared utilities
│   └── remotion/               # Remotion React components (main)
├── packages/
│   └── renderer/               # Isolated renderer subprocess (zod v3)
│       ├── src/
│       │   ├── cli.ts          # Renderer CLI entry
│       │   ├── video-renderer.ts
│       │   └── remotion/       # Renderer-specific components
│       └── bin/                # Published CLI binary
├── tests/                      # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── index.ts                    # Package entry (re-exports)
```

## Directory Purposes

**src/cli/:**
- Purpose: User-facing CLI implementation
- Contains: `index.ts` (main CLI), `prompts.ts`, `help-text.ts`, `phase8-cli-integration.ts`
- Key files: `src/cli/index.ts` - Commander.js setup and workflow orchestration

**src/mastra/agents/:**
- Purpose: LLM-powered agents for each pipeline phase
- Contains: research-agent.ts, script-agent.ts, visual-agent.ts, screenshot-agent.ts, compose-agent.ts
- Key files: `src/mastra/agents/index.ts` - all agent exports

**src/mastra/tools/:**
- Purpose: Tools callable by agents
- Contains: web-fetch.ts, playwright-screenshot.ts, code-highlight.ts, remotion-render.ts, remotion-project-generator.ts
- Key files: `src/mastra/tools/index.ts` - all tool exports

**src/mastra/workflows/:**
- Purpose: Workflow definitions (currently minimal/placeholder)
- Contains: `index.ts`

**src/types/:**
- Purpose: Zod schemas for runtime validation
- Contains: research.ts, script.ts, visual.ts, validations.ts
- Key files:
  - `src/types/research.ts` - ResearchInput, ResearchOutput schemas
  - `src/types/script.ts` - ScriptOutput, Scene, VisualLayer schemas
  - `src/types/visual.ts` - VisualPlan, Annotation, LayoutTemplate schemas
  - `src/types/index.ts` - Re-exports all schemas

**src/utils/:**
- Purpose: Shared utilities
- Contains: config.ts, errors.ts, logger.ts, process-manager.ts, workflow-state.ts, srt-generator.ts, cleanup.ts, output-directory.ts, retry.ts, graceful-shutdown.ts, scene-accumulator.ts, remotion-project-generator.ts, video-renderer.ts
- Key files:
  - `src/utils/process-manager.ts` - spawnRenderer() for subprocess
  - `src/utils/workflow-state.ts` - WorkflowStateManager
  - `src/utils/index.ts` - re-exports

**src/remotion/:**
- Purpose: React/Remotion components for video composition
- Contains: Root.tsx, Composition.tsx, Scene.tsx, Intro.tsx, Outro.tsx, Subtitle.tsx
- Note: These are primarily for reference; the renderer package has its own copies

**packages/renderer/:**
- Purpose: Isolated subprocess package with own node_modules (zod v3)
- Contains: cli.ts, video-renderer.ts, srt-generator.ts, remotion/ components
- Key files:
  - `packages/renderer/src/cli.ts` - subprocess entry point
  - `packages/renderer/bin/video-script-render.js` - published binary
  - `packages/renderer/package.json` - zod v3 dependency

## Key File Locations

**Entry Points:**
- `src/cli/index.ts` - Main CLI (video-script create/config)
- `packages/renderer/src/cli.ts` - Renderer subprocess
- `index.ts` - Package main export

**Configuration:**
- `package.json` - npm workspaces, scripts, dependencies
- `packages/renderer/package.json` - Renderer dependencies (zod v3)
- `.env` - Environment variables (never read contents)

**Mastra Setup:**
- `src/mastra/index.ts` - Mastra instance with all agents
- `.agents/skills/` - Agent skills and instructions

## Naming Conventions

**Files:**
- TypeScript files: kebab-case or camelCase depending on context
  - Agents: kebab-case (research-agent.ts, script-agent.ts)
  - Utils: kebab-case (process-manager.ts, workflow-state.ts)
  - Components: PascalCase (Root.tsx, Scene.tsx)
- Test files: `.test.ts` or `.spec.ts` suffix

**Directories:**
- Lowercase/kebab: cli, mastra, utils, types, remotion
- Plural for collections: agents, tools, workflows

**Agents:**
- Named with -agent suffix: research-agent, script-agent, compose-agent

**Schemas:**
- Suffix with Schema: ResearchInputSchema, ScriptOutputSchema
- Types use Type suffix: type ResearchInput, type Scene

## Where to Add New Code

**New Agent Tool:**
- Implementation: `src/mastra/tools/new-tool.ts`
- Register in: `src/mastra/tools/index.ts`
- Add to agent tools in agent file

**New Agent:**
- Implementation: `src/mastra/agents/new-agent.ts`
- Export from: `src/mastra/agents/index.ts`
- Register in: `src/mastra/index.ts`

**New Type/Schema:**
- Location: `src/types/new-schema.ts`
- Export from: `src/types/index.ts`

**New Utility:**
- Location: `src/utils/new-utility.ts`
- Export from: `src/utils/index.ts`

**New Remotion Component:**
- For renderer: `packages/renderer/src/remotion/components/NewComponent.tsx`
- Copy/reference to: `src/remotion/components/NewComponent.tsx`

**Test Files:**
- Co-located: `src/utils/__tests__/new-utility.test.ts`
- Or in `tests/unit/`, `tests/integration/`, `tests/e2e/`

## Special Directories

**.mastra/:**
- Purpose: Mastra build output and studio assets
- Generated: Yes
- Committed: No (typically .gitignore'd)

**packages/renderer/node_modules/:**
- Purpose: Isolated dependencies including zod v3
- Generated: Yes (npm install)
- Committed: No

**tests/:**
- Purpose: Test suites
- Contains: unit, integration, e2e subdirectories

**.agents/skills/:**
- Purpose: Mastra agent skills and instructions
- Contains: mastra/, remotion/, video-editing/ skill directories

**output/:**
- Purpose: Generated video output
- Contains: Year-organized video directories
- Generated: Yes (runtime)
- Committed: No

---

*Structure analysis: 2026-03-22*
