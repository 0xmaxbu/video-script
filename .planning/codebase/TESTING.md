# Testing Patterns

**Analysis Date:** 2026-03-22

## Test Framework

**Runner:**
- Vitest version ^4.1.0
- Config: No project-level `vitest.config.ts` found (uses defaults)

**Run Commands:**
```bash
npm run test              # Run all tests (vitest run)
npm run test:watch        # Watch mode (vitest)
npm run typecheck         # TypeScript validation (tsc --noEmit)
```

**Assertion Library:**
- Vitest built-in `expect` with matchers

**Mocking:**
- Vitest's `vi` for mocks and spies
- `vi.fn()` for function mocks
- `vi.mock()` for module mocking
- `vi.clearAllMocks()` and `vi.resetModules()` for cleanup

## Test File Organization

**Location:**
- Co-located with source in `__tests__/` directories
- Example: `src/utils/__tests__/cleanup.test.ts`

**Naming:**
- Pattern: `*.test.ts`
- Example: `cli.test.ts`, `web-fetch.test.ts`, `schemas.test.ts`

**Structure:**
```
src/
  mastra/
    agents/
      __tests__/
        agents.test.ts
        research-agent.test.ts
        script-agent.test.ts
        screenshot-agent.test.ts
        visual-agent.test.ts
    tools/
      __tests__/
        web-fetch.test.ts
        playwright-screenshot.test.ts
        code-highlight.test.ts
        remotion-render.test.ts
        remotion-project-generator.test.ts
  utils/
    __tests__/
      cleanup.test.ts
      output-directory.test.ts
      scene-accumulator.test.ts
      json-parser.test.ts
  types/
    __tests__/
      schemas.test.ts
      new-schemas.test.ts
      visual-types.test.ts
  cli/
    __tests__/
      cli.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ComponentName", () => {
  describe("success cases", () => {
    it("should do something specific", async () => { ... });
    it("should handle another case", async () => { ... });
  });

  describe("error cases", () => {
    it("should throw on invalid input", async () => { ... });
    it("should handle network failure", async () => { ... });
  });

  describe("edge cases", () => {
    it("should handle empty input", async () => { ... });
    it("should handle special characters", async () => { ... });
  });
});
```

**Setup/Teardown Pattern:**
```typescript
describe("cleanupRemotionTempDir", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), ".test-temp-" + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      void 0; // Ignore cleanup errors
    }
  });
});
```

## Mocking

**Module Mocking:**
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

**Function Mocking:**
```typescript
global.fetch = vi.fn().mockResolvedValue({
  status: 200,
  ok: true,
  url: "https://example.com",
  text: () => Promise.resolve(mockHtml),
});
```

**Dynamic Import Mocks:**
```typescript
const { chromium } = await import("playwright");
(chromium.launch as any).mockResolvedValue(mockBrowser);
```

**Mock Cleanup:**
```typescript
afterEach(() => {
  vi.clearAllMocks();
});
```

## Fixtures and Factories

**Test Data:**
```typescript
const validScene = {
  id: "1",
  type: "feature",
  title: "Scene Title",
  narration: "Scene narration text",
  duration: 30,
};

const validScript = {
  title: "My Script",
  totalDuration: 60,
  scenes: [
    { id: "1", type: "intro", title: "Intro", narration: "Welcome", duration: 10 },
    { id: "2", type: "outro", title: "Outro", narration: "Goodbye", duration: 10 },
  ],
};
```

**Helper Functions in Tests:**
```typescript
// Helper to cast tool result
const castResult = (result: any) =>
  result as { content: string; title: string; url: string };
```

## Test Patterns by Category

**Schema Validation Tests:**
```typescript
describe("ResearchInputSchema", () => {
  it("should accept a minimal valid input with title only", () => {
    const result = ResearchInputSchema.safeParse({ title: "My Video" });
    expect(result.success).toBe(true);
  });

  it("should reject empty title", () => {
    const result = ResearchInputSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});
```

**Async Tool Tests:**
```typescript
it("should fetch and convert HTML to markdown", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    status: 200,
    ok: true,
    url: "https://example.com",
    text: () => Promise.resolve(mockHtml),
  });

  const result = castResult(
    await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
  );

  expect(result.title).toBe("Test Page");
  expect(result.content).toContain("# Welcome");
});
```

**Error Testing:**
```typescript
it("should throw error on 404 response", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    status: 404,
    ok: false,
    text: () => Promise.resolve("<html></html>"),
  });

  await expect(
    webFetchTool.execute!({ url: "https://example.com" }, {} as any),
  ).rejects.toThrow("PAGE_NOT_FOUND");
});
```

**File System Tests:**
```typescript
it("should delete temporary files and preserve output files", async () => {
  const tempFile = path.join(tempDir, "temp.txt");
  const mp4File = path.join(tempDir, "output.mp4");

  await fs.writeFile(tempFile, "temp content");
  await fs.writeFile(mp4File, "video content");

  await cleanupRemotionTempDir(tempDir);

  await expect(fs.access(tempFile)).rejects.toThrow();
  await expect(fs.access(mp4File)).resolves.not.toThrow();
});
```

**Config Tests:**
```typescript
it("should load defaults when config file does not exist", async () => {
  const { loadConfig } = await import("../../utils/config.js");
  const config = loadConfig(join(tempDir, "nonexistent.json"));
  expect(config.llm.provider).toBe("openai");
  expect(config.video.fps).toBe(30);
});
```

## Coverage

**Configuration:**
- Provider: `@vitest/coverage-v8` (version ^4.1.0)
- No enforced coverage thresholds in place
- Reports likely in `coverage/` directory

**View Coverage:**
```bash
# Not explicitly documented in package.json scripts
```

## Test Types

**Unit Tests:**
- Focus on individual functions and tools
- Heavy mocking of external dependencies
- Fast execution, no I/O

**Integration Tests:**
- Config loading from filesystem
- CLI command parsing
- Agent definition verification
- Schema consistency between packages

**Not Used:**
- E2E tests (no Playwright test runner for app)
- Snapshot testing

## Common Patterns

**Async Testing:**
```typescript
it("should handle async operations", async () => {
  await expect(
    cleanupRemotionTempDir("/nonexistent/path"),
  ).resolves.not.toThrow();
});
```

**Promise Rejection:**
```typescript
it("should reject on error", async () => {
  await expect(promiseThatFails).rejects.toThrow("ERROR_CODE");
});
```

**Type Casting in Tests:**
```typescript
const castResult = (result: any) =>
  result as { content: string; title: string; url: string };

const result = castResult(await tool.execute!(input, {} as any));
```

**Temporary Directory Pattern:**
```typescript
beforeEach(async () => {
  tempDir = path.join(process.cwd(), ".test-temp-" + Date.now());
  await fs.mkdir(tempDir, { recursive: true });
});

afterEach(async () => {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {
    void 0;
  }
});
```

---

*Testing analysis: 2026-03-22*
