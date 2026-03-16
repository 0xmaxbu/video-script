import { logger } from "./logger.js";

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter?: boolean;
}
const RETRYABLE_ERRORS: readonly string[] = [
  "ETIMEDOUT",
  "ECONNRESET",
  "ENOTFOUND",
  "TIMEOUT",
  "DNS",
  "RATE_LIMIT",
];
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  factor: 2,
  jitter: false,
};
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isRetryableError(error: unknown): boolean {
  if (!error) return false;
  const err = error as NodeJS.ErrnoException | undefined;
  const errorCode = err?.code;
  if (errorCode && RETRYABLE_ERRORS.includes(errorCode)) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      RETRYABLE_ERRORS.some((e) => message.includes(e.toLowerCase())) ||
      message.includes("timeout") ||
      message.includes("rate limit")
    );
  }
  return false;
}
function calculateDelay(retryCount: number, options: RetryOptions): number {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const delay = opts.initialDelayMs * Math.pow(opts.factor, retryCount);
  const cappedDelay = Math.min(delay, opts.maxDelayMs);
  if (opts.jitter) {
    const jitterAmount = cappedDelay * 0.3 * Math.random();
    return cappedDelay + jitterAmount;
  }
  return cappedDelay;
}
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let retryCount = 0;
  let lastError: Error | null = null;
  while (retryCount <= opts.maxRetries) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount++;
      if (retryCount > opts.maxRetries) {
        break;
      }
      if (!isRetryableError(error)) {
        throw lastError;
      }
      const delay = calculateDelay(retryCount - 1, opts);
      logger.debug(`Retry ${retryCount}/${opts.maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastError ?? new Error("Max retries exceeded");
}
