# External Integrations

**Analysis Date:** 2026-03-22

## APIs & External Services

**LLM Provider (Primary AI):**
- MiniMax M2.5 via `minimax-cn-coding-plan/MiniMax-M2.5` - Default model for all agents
  - Used by: `src/mastra/agents/research-agent.ts`, `src/mastra/agents/script-agent.ts`, `src/mastra/agents/screenshot-agent.ts`, `src/mastra/agents/compose-agent.ts`
  - Auth: `MINIMAX_CN_API_KEY` or `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` environment variable

**LLM Provider (Alternative):**
- OpenAI GPT-4 Turbo - Configurable alternative
  - Config: `video-script.config.json` → `llm.provider: "openai"`, `llm.model: "gpt-4-turbo"`
  - Auth: `OPENAI_API_KEY` environment variable

**LLM Provider (Alternative):**
- Anthropic Claude - Configurable alternative
  - Auth: `ANTHROPIC_API_KEY` environment variable

**Web Fetch:**
- Native Node.js `fetch` API - Used by `webFetchTool` in `src/mastra/tools/web-fetch.ts`
  - No external HTTP client library
  - User-Agent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`
  - Timeout: 30 seconds

## Data Storage

**Databases:**
- None - No database integration detected

**File Storage:**
- Local filesystem only
  - Screenshots: `./output/screenshots` (default, configurable per tool call)
  - Video output: `~/simple-videos/<Year>/<Week>-<StartMonth>_<StartDay>-<EndMonth>_<EndDay>/<slugified-title>`
  - Remotion projects: `.remotion-project/` subdirectory within output
  - Config: `video-script.config.json`

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- API Key based authentication for LLM providers
  - `OPENAI_API_KEY` - OpenAI models
  - `ANTHROPIC_API_KEY` - Anthropic models
  - `MINIMAX_CN_API_KEY` - MiniMax models (primary)
- No OAuth, no JWT, no session management

## Monitoring & Observability

**Error Tracking:**
- None - No external error tracking service (Sentry, Bugsnag, etc.)

**Logs:**
- Console logging via `console.log`, `console.error`
- Spinner/loading indicators via `ora`
- No structured logging library

## CI/CD & Deployment

**Hosting:**
- None - CLI tool, not hosted

**CI Pipeline:**
- None detected (no GitHub Actions, no CircleCI, no Travis)
- No `.github/workflows/` directory

## Environment Configuration

**Required env vars:**
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` or `MINIMAX_CN_API_KEY` - LLM provider authentication (at least one required)
- `LLM_MODEL` - Optional, defaults to `minimax-cn-coding-plan/MiniMax-M2.5`

**Optional env vars:**
- `NODE_ENV` - Set to `test` to disable retries in web fetch tool
- `VIDEO_FPS` - Optional video framerate
- `VIDEO_CODEC` - Optional video codec

**Secrets location:**
- `.env` file (gitignored, not committed)
- `video-script.config.json` for non-secret configuration

**Config file:**
- `video-script.config.json` - Stores: LLM provider/model, video settings (fps, codec, aspect ratio), screenshot settings (viewport, browser pool size), TTS settings (disabled by default)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Two-Process Architecture (Zod Version Isolation)

**Purpose:** Handle zod version conflicts between main CLI and Remotion renderer

**Implementation:**
```
Main CLI (zod v4)  →  Spawns  →  video-script-render subprocess (zod v3)
```

**Communication:**
- JSON input file written to disk
- stdout JSON result
- Entrypoint: `packages/renderer/src/cli.ts`
- Bin command: `video-script-render`

**Files involved:**
- `src/cli/index.ts` - Spawns renderer subprocess
- `src/utils/process-manager.ts` - Handles subprocess spawning
- `packages/renderer/src/cli.ts` - Renderer subprocess entry
- `packages/renderer/package.json` - Renderer package with zod v3

---

*Integration audit: 2026-03-22*
