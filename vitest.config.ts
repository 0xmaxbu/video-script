import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "zod/v4": path.resolve(__dirname, "node_modules/zod/lib/index.mjs"),
      "zod/v3": path.resolve(__dirname, "node_modules/zod/lib/index.mjs"),
    },
  },
  test: {
    // Default test run (npm test): src/ unit tests + tests/fixture-e2e/ (no real API calls)
    // Excludes: tests/e2e-real/ (requires real LLM API, run via npm run test:e2e)
    include: [
      "src/**/*.test.ts",
      "tests/unit/**/*.test.ts",
      "tests/integration/**/*.test.ts",
      "tests/fixture-e2e/**/*.test.ts",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "tests/e2e-real/**",
      "tests/e2e/**",
    ],
  },
});
