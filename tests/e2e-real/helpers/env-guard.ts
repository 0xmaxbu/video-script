/**
 * env-guard — ensure required env vars are present before running real E2E tests.
 *
 * Call checkRealApiEnv() at the top of any e2e-real test suite.
 * Tests that need real LLM API must call this or skipIfNoEnv().
 */

const REQUIRED_VARS = ["OPENAI_API_KEY"];

/**
 * Returns true if all required env vars for real API tests are present.
 */
export function hasRealApiEnv(): boolean {
  return REQUIRED_VARS.every((v) => Boolean(process.env[v]));
}

/**
 * Throw a clear error if required env vars are missing.
 * Use this in beforeAll for suites that always need real API.
 */
export function requireRealApiEnv(): void {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Real E2E tests require environment variables: ${missing.join(", ")}\n` +
        `Set them or run with npm test (fixture-e2e) instead.`,
    );
  }
}
