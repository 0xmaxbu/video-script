# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**
- Use kebab-case: `web-fetch.ts`, `cleanup.test.ts`, `scene-accumulator.ts`
- Test files: `*.test.ts` suffix, co-located in `__tests__/` directory
- Barrel files: `index.ts` for module exports

**Types:**
- PascalCase: `ResearchInput`, `VideoGenerationError`, `Scene`
- Schema types: `Schema` suffix - `ResearchInputSchema`, `SceneSchema`, `ScriptOutputSchema`
- Enum members: PascalCase - `VideoGenerationErrorCode.INVALID_INPUT`
- Zod inferred types: `<Name> = z.infer<typeof <Name>Schema>` pattern

**Functions:**
- camelCase: `parseResearchMarkdown`, `filterEssentialContent`, `cleanupTempFiles`
- Tool functions: `createTool()` from `@mastra/core/tools`
- Retry wrapper: `withRetry()`

**Variables:**
- camelCase: `tempDir`, `mockBrowser`, `validScene`
- Constants: UPPER_SNAKE_CASE for truly constant values - `DEFAULT_RETRY_OPTIONS`

## Code Style

**Formatting:**
- Tool: Prettier (version ^3.8.1)
- Command: `npm run format`
- No project-level config file (uses Prettier defaults)
- Print width: Default (80)

**Linting:**
- Tool: ESLint (version ^10.0.3)
- Command: `npm run lint`
- Config: No project-level `.eslintrc` (uses ESLint defaults)
- No strict rules enforcement in place

**TypeScript Configuration:**
- Target: ES2022
- Module: ES2022 with `bundler` moduleResolution
- Strict mode enabled with additional checks:
  - `noImplicitAny: true`
  - `noImplicitReturns: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `exactOptionalPropertyTypes: true`
  - `noFallthroughCasesInSwitch: true`

## Import Organization

**Order:**
1. Node.js built-ins (`fs`, `path`, `os`)
2. External packages (`zod`, `commander`, `playwright`)
3. Internal modules (`@mastra/core`, `@video-script/renderer`)
4. Relative imports (`../../utils/`, `../types/`)

**Path Extensions:**
- Always include `.js` extension for ES module imports
- Example: `import { webFetchTool } from "./web-fetch.js";`

**Barrel Exports:**
- Use `index.ts` files for module exports
- Example: `src/utils/index.ts`, `src/types/index.ts`

## Error Handling

**Pattern:** Hierarchical custom error classes extending `VideoGenerationError`

```typescript
// Base error class
export class VideoGenerationError extends Error {
  public readonly code: VideoGenerationErrorCode;
  public readonly retryable: boolean;
  public readonly cause: Error | undefined;
}

// Specialized errors
export class ValidationError extends VideoGenerationError { ... }
export class TimeoutError extends VideoGenerationError { ... }
export class NetworkError extends VideoGenerationError { ... }
```

**Error Codes (from `src/utils/errors.ts`):**
- `INVALID_INPUT`
- `WEB_FETCH_FAILED`
- `SCREENSHOT_FAILED`
- `CODE_HIGHLIGHT_FAILED`
- `REMOTION_RENDER_FAILED`
- `LLM_API_ERROR`
- `TIMEOUT`
- `UNKNOWN`

**Retry Pattern:**
```typescript
const retryOptions =
  process.env.NODE_ENV === "test"
    ? { maxRetries: 0 }
    : { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 5000, factor: 2 };

return withRetry(async () => { ... }, retryOptions);
```

## Comments

**JSDoc Style:**
```typescript
/**
 * Error codes for video generation failures
 */
export enum VideoGenerationErrorCode { ... }

/**
 * Custom error class for video generation failures
 */
export class VideoGenerationError extends Error { ... }
```

**Function Documentation:**
```typescript
/**
 * Executes an async function with retry logic for transient failures
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects with last error
 *
 * @example
 * ```typescript
 * const result = await withRetry(() => fetchData(url), { maxAttempts: 3 });
 * ```
 */
export async function withRetry<T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T> { ... }
```

## Function Design

**Size:** Prefer small, focused functions; helper functions extracted for complex logic

**Parameters:**
- Typed input schemas via Zod
- Options objects with sensible defaults
- No primitive obsession

**Return Values:**
- Return type annotations on exported functions
- Use `z.infer<typeof Schema>` for type inference
- Never return `any`

## Module Design

**Tool Creation:**
```typescript
export const webFetchTool = createTool({
  id: "web-fetch",
  description: "Fetch and extract content...",
  inputSchema: z.object({ url: z.string().url() }),
  outputSchema: z.object({ content: z.string(), title: z.string(), url: z.string() }),
  execute: async ({ url }) => { ... }
});
```

**Schema Definition Pattern:**
```typescript
export const ResearchInputSchema = z.object({
  title: z.string().min(1),
  links: z.array(z.string().url()).optional(),
  document: z.string().optional(),
  documentFile: z.string().optional(),
});

export type ResearchInput = z.infer<typeof ResearchInputSchema>;
```

## Special Patterns

**Environment-Specific Logic:**
```typescript
// Disable retries in test environment
const retryOptions =
  process.env.NODE_ENV === "test"
    ? { maxRetries: 0 }
    : { maxRetries: 3, ... };
```

**Mock Pattern for Tools:**
```typescript
vi.mock("../logger", () => ({
  logger: {
    start: vi.fn(),
    succeed: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
```

**Async Import Pattern:**
```typescript
const { chromium } = await import("playwright");
```

---

*Convention analysis: 2026-03-22*
