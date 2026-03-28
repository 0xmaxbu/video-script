import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest config for real E2E tests (npm run test:e2e).
 *
 * Only includes tests/e2e-real/ — tests that call real LLM APIs.
 * Never run by `npm test` (which uses vitest.config.ts).
 * No --passWithNoTests: if no e2e-real tests exist, the command fails.
 */
export default defineConfig({
  resolve: {
    alias: {
      "zod/v4": path.resolve(__dirname, "node_modules/zod/lib/index.mjs"),
      "zod/v3": path.resolve(__dirname, "node_modules/zod/lib/index.mjs"),
    },
  },
  test: {
    include: ["tests/e2e-real/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    // Real E2E tests can be slow — extend timeout to 10 minutes
    testTimeout: 10 * 60 * 1000,
    hookTimeout: 2 * 60 * 1000,
  },
});
