import { z } from "zod";

/**
 * Error codes for video generation failures
 */
export enum VideoGenerationErrorCode {
  INVALID_INPUT = "INVALID_INPUT",
  WEB_FETCH_FAILED = "WEB_FETCH_FAILED",
  SCREENSHOT_FAILED = "SCREENSHOT_FAILED",
  CODE_HIGHLIGHT_FAILED = "CODE_HIGHLIGHT_FAILED",
  REMOTION_RENDER_FAILED = "REMOTION_RENDER_FAILED",
  PROJECT_GENERATION_FAILED = "PROJECT_GENERATION_FAILED",
  SRT_GENERATION_FAILED = "SRT_GENERATION_FAILED",
  LLM_API_ERROR = "LLM_API_ERROR",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
}

/**
 * Custom error class for video generation failures
 */
export class VideoGenerationError extends Error {
  public readonly code: VideoGenerationErrorCode;
  public readonly retryable: boolean;
  public readonly cause: Error | undefined;

  constructor(
    code: VideoGenerationErrorCode,
    message: string,
    retryable: boolean = false,
    cause: Error | undefined = undefined,
  ) {
    super(message);
    this.name = "VideoGenerationError";
    this.code = code;
    this.retryable = retryable;
    this.cause = cause;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, VideoGenerationError.prototype);
  }
}

/**
 * Validation error for schema validation failures
 */
export class ValidationError extends VideoGenerationError {
  public readonly details: z.ZodError;

  constructor(message: string, details: z.ZodError, cause?: Error) {
    super(VideoGenerationErrorCode.INVALID_INPUT, message, false, cause);
    this.name = "ValidationError";
    this.details = details;
  }
}

/**
 * Timeout error for operations that exceed time limits
 */
export class TimeoutError extends VideoGenerationError {
  public readonly timeoutMs: number;

  constructor(
    message: string,
    timeoutMs: number,
    cause: Error | undefined = undefined,
  ) {
    super(VideoGenerationErrorCode.TIMEOUT, message, true, cause);
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * HTTP/Network error for fetch failures
 */
export class NetworkError extends VideoGenerationError {
  public readonly statusCode: number | undefined;

  constructor(
    message: string,
    code: VideoGenerationErrorCode,
    statusCode: number | undefined = undefined,
    cause: Error | undefined = undefined,
  ) {
    // Network errors with 5xx codes or timeout are retryable
    const retryable = statusCode
      ? statusCode >= 500 || statusCode === 408
      : true;
    super(code, message, retryable, cause);
    this.name = "NetworkError";
    this.statusCode = statusCode;
  }
}

/**
 * Options for retry mechanism
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  delayMs: number;
  /** Multiplier for exponential backoff (default: 1.5) */
  backoffMultiplier?: number;
}

/**
 * Retry configuration with defaults
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 1.5,
};

/**
 * Executes an async function with retry logic for transient failures
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects with last error
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchData(url),
 *   { maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRetryable =
        error instanceof VideoGenerationError ? error.retryable : true;

      // Don't retry if not retryable or this is the last attempt
      if (!isRetryable || attempt === config.maxAttempts) {
        throw error;
      }

      // Calculate backoff delay
      const delayMs =
        config.delayMs * Math.pow(config.backoffMultiplier, attempt - 1);

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Should never reach here, but handle for completeness
  throw lastError || new Error("Retry exhausted without error information");
}

/**
 * Error logging utility with context information
 *
 * @param error - Error to log
 * @param context - Additional context for debugging
 *
 * @example
 * ```typescript
 * try {
 *   await fetchData(url);
 * } catch (error) {
 *   logError(error, { url, userId: user.id });
 * }
 * ```
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();
  const errorInfo: Record<string, unknown> = {
    timestamp,
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  // Add VideoGenerationError specific info
  if (error instanceof VideoGenerationError) {
    errorInfo.code = error.code;
    errorInfo.retryable = error.retryable;

    if (error instanceof ValidationError) {
      errorInfo.validationErrors = error.details.issues;
    }

    if (error instanceof TimeoutError) {
      errorInfo.timeoutMs = error.timeoutMs;
    }

    if (error instanceof NetworkError) {
      errorInfo.statusCode = error.statusCode;
    }

    if (error.cause) {
      errorInfo.cause = {
        message: error.cause.message,
        stack: error.cause.stack,
      };
    }
  }

  // Add context information
  if (context) {
    errorInfo.context = context;
  }

  // Log to console (in production, this would be sent to a logging service)
  console.error(JSON.stringify(errorInfo, null, 2));
}

/**
 * Creates a VideoGenerationError from an unknown error
 *
 * @param error - Unknown error object
 * @param fallbackCode - Error code to use if error type is unknown
 * @returns VideoGenerationError instance
 */
export function normalizeError(
  error: unknown,
  fallbackCode: VideoGenerationErrorCode = VideoGenerationErrorCode.UNKNOWN,
): VideoGenerationError {
  if (error instanceof VideoGenerationError) {
    return error;
  }

  if (error instanceof Error) {
    return new VideoGenerationError(fallbackCode, error.message, true, error);
  }

  return new VideoGenerationError(
    fallbackCode,
    `Unknown error: ${String(error)}`,
    true,
  );
}

/**
 * Determines if an error is retryable
 *
 * @param error - Error to check
 * @returns True if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof VideoGenerationError) {
    return error.retryable;
  }

  // Network-like errors are generally retryable
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("failed")
    );
  }

  return false;
}

/**
 * Get user-friendly error message from VideoGenerationError
 *
 * @param error - Error to extract message from
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (!(error instanceof VideoGenerationError)) {
    return "An unexpected error occurred. Please try again later.";
  }

  const messages: Record<VideoGenerationErrorCode, string> = {
    [VideoGenerationErrorCode.INVALID_INPUT]:
      "Invalid input provided. Please check your inputs and try again.",
    [VideoGenerationErrorCode.WEB_FETCH_FAILED]:
      "Failed to fetch web content. Please check the URL and try again.",
    [VideoGenerationErrorCode.SCREENSHOT_FAILED]:
      "Failed to capture screenshot. The website may have changed or become unavailable.",
    [VideoGenerationErrorCode.CODE_HIGHLIGHT_FAILED]:
      "Failed to highlight code. Please check the code syntax.",
    [VideoGenerationErrorCode.REMOTION_RENDER_FAILED]:
      "Failed to render video. This may be a temporary issue. Please try again.",
    [VideoGenerationErrorCode.PROJECT_GENERATION_FAILED]:
      "Failed to generate video project. Please check your script content.",
    [VideoGenerationErrorCode.SRT_GENERATION_FAILED]:
      "Failed to generate subtitles. Please check your script timing.",
    [VideoGenerationErrorCode.LLM_API_ERROR]:
      "AI service error. Please check your API key and try again.",
    [VideoGenerationErrorCode.TIMEOUT]:
      "Operation timed out. Please try again or use a faster internet connection.",
    [VideoGenerationErrorCode.UNKNOWN]:
      "An unknown error occurred. Please contact support if the problem persists.",
  };

  return messages[error.code];
}
