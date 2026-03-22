# Technology Stack

**Analysis Date:** 2026-03-22

## Languages

**Primary:**
- TypeScript 5.9.3 - Main language for CLI, agents, tools, and React components
- TSX - For React/Remotion components

**Secondary:**
- JavaScript - Legacy/test files (`.mjs`, some test files)

## Runtime

**Environment:**
- Node.js >=18.0.0 - Server-side runtime
- ES2022 modules - Native ESM (`"type": "module"` in package.json)

**Package Manager:**
- npm - Package management
- npm workspaces - Monorepo support (`packages/*`)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Mastra 1.13.2 - AI agent framework (agents, tools, workflows)
- Zod 4.3.6 (main) / Zod 3.25.56 (renderer) - Schema validation and type safety

**CLI:**
- Commander.js 14.0.3 - CLI argument parsing
- Inquirer 13.3.0 - Interactive CLI prompts
- Chalk 5.6.2 - Terminal string styling
- Ora 9.3.0 - Terminal spinner/loading indicators

**Video Rendering:**
- Remotion 4.0.436 - React-based video rendering
- React 19.2.4 (main) / React 18.3.1 (studio) - UI library
- `@remotion/cli`, `@remotion/renderer`, `@remotion/studio`, `@remotion/transitions` 4.0.436

**Browser Automation:**
- Playwright 1.58.2 - Screenshot capture via `chromium` from `playwright`

**Code Highlighting:**
- Shiki 4.0.2 - Syntax highlighting (generates HTML from code)

**Text Processing:**
- Pinyin 4.0.0 - Chinese pinyin conversion (for video slug generation)

**Testing:**
- Vitest 4.1.0 - Test runner
- `@vitest/coverage-v8` 4.1.0 - Coverage reporting

**Build/Dev:**
- TypeScript 5.9.3 - Type checking and compilation
- tsx 4.21.0 - TypeScript execution (dev mode)
- Vite 6.0.0 (studio package) - Frontend build tool
- ESLint 10.0.3 - Linting
- Prettier 3.8.1 - Code formatting

## Key Dependencies

**Critical:**
- `@mastra/core` 1.13.2 - Agent runtime, tools, workspace
- `zod` 4.3.6 - Runtime type validation (main CLI)
- `playwright` 1.58.2 - Webpage screenshots
- `shiki` 4.0.2 - Code syntax highlighting
- `remotion` 4.0.436 - Video composition and rendering

**Infrastructure:**
- `dotenv` 17.3.1 - Environment variable loading
- `react` 19.2.4 / 18.3.1 - UI components

## Configuration

**TypeScript:**
- Config file: `tsconfig.json`
- Target: ES2022
- Module: ES2022
- Strict mode enabled
- `exactOptionalPropertyTypes: true`
- `noImplicitAny: true`
- Path alias: Not detected

**Environment:**
- `.env` file for local development (not committed)
- `.env.example` for reference
- `.env` contains: `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`), `LLM_MODEL`
- Project config: `video-script.config.json` (JSON, not env)

**Linting/Formatting:**
- ESLint 10.0.3 configured (config not found in project root - may rely on IDE)
- Prettier 3.8.1 configured (config not found in project root)
- No project-level `eslint.config.*` or `.prettierrc`

**Testing:**
- Vitest 4.1.0 (config not found in project root)
- Test files co-located: `src/**/*.test.ts`
- Coverage enabled via `@vitest/coverage-v8`

## Platform Requirements

**Development:**
- Node.js >=18.0.0
- npm
- Chromium browser (for Playwright screenshots)

**Production:**
- Node.js >=18.0.0
- FFmpeg (for Remotion rendering - invoked via `npx remotion`)
- Chromium browser (for Playwright screenshots)

---

*Stack analysis: 2026-03-22*
