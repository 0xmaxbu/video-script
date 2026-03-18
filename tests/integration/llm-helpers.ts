import "dotenv/config";

export const LLM_TEST_TIMEOUT = 120_000;

export function hasLLMCredentials(): boolean {
  const apiKey =
    process.env.MINIMAX_CN_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY;

  return Boolean(apiKey && apiKey.length > 0);
}

export function getLLMProvider(): string {
  if (process.env.MINIMAX_CN_API_KEY) return "minimax";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "unknown";
}
