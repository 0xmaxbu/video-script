import ora from 'ora';
import chalk from 'chalk';

class Logger {
  spinner = null;
  silent;
  debugEnabled;
  constructor(options = {}) {
    this.silent = options.silent ?? false;
    this.debugEnabled = options.debug ?? false;
  }
  start(text) {
    if (this.silent) return;
    this.spinner = ora(text).start();
  }
  update(text) {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.text = text;
    }
  }
  succeed(text) {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    } else {
      console.log(chalk.green("\u2713"), text ?? "");
    }
  }
  fail(text) {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    } else {
      console.log(chalk.red("\u2717"), text ?? "");
    }
  }
  warn(text) {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.warn(text);
      this.spinner = null;
    } else {
      console.log(chalk.yellow("\u26A0"), text ?? "");
    }
  }
  info(text) {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.info(text);
      this.spinner = null;
    } else {
      console.log(chalk.blue("\u2139"), text ?? "");
    }
  }
  stop() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
  log(message, level = "info") {
    if (this.silent) return;
    const prefix = {
      debug: chalk.gray("\u2699"),
      info: chalk.blue("\u2139"),
      warn: chalk.yellow("\u26A0"),
      error: chalk.red("\u2717"),
      success: chalk.green("\u2713")
    };
    console.log(prefix[level], message);
  }
  debug(message) {
    if (!this.debugEnabled) return;
    this.log(message, "debug");
  }
  error(message, error) {
    if (this.silent) return;
    this.log(message, "error");
    if (error && this.debugEnabled) {
      console.error(error);
    }
  }
  step(stepName, text) {
    if (this.silent) return;
    this.update(`${chalk.cyan(`[${stepName}]`)} ${text}`);
  }
  progress(current, total, text) {
    if (this.silent) return;
    const percentage = Math.round(current / total * 100);
    const bar = this.progressBar(percentage);
    this.update(`${bar} ${text}`);
  }
  progressBar(percentage, width = 20) {
    const filled = Math.round(percentage / 100 * width);
    const empty = width - filled;
    const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty);
    return chalk.cyan(`[${bar}] ${percentage}%`);
  }
  table(data) {
    if (this.silent) return;
    console.table(data);
  }
  newline() {
    if (this.silent) return;
    console.log();
  }
  getSpinner() {
    return this.spinner;
  }
  setSilent(silent) {
    this.silent = silent;
  }
  setDebug(debug) {
    this.debugEnabled = debug;
  }
}
const logger = new Logger();

const RETRYABLE_ERRORS = [
  "ETIMEDOUT",
  "ECONNRESET",
  "ENOTFOUND",
  "TIMEOUT",
  "DNS",
  "RATE_LIMIT"
];
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelayMs: 1e3,
  maxDelayMs: 5e3,
  factor: 2,
  jitter: false
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isRetryableError(error) {
  if (!error) return false;
  const err = error;
  const errorCode = err?.code;
  if (errorCode && RETRYABLE_ERRORS.includes(errorCode)) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return RETRYABLE_ERRORS.some((e) => message.includes(e.toLowerCase())) || message.includes("timeout") || message.includes("rate limit");
  }
  return false;
}
function calculateDelay(retryCount, options) {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const delay = opts.initialDelayMs * Math.pow(opts.factor, retryCount);
  const cappedDelay = Math.min(delay, opts.maxDelayMs);
  if (opts.jitter) {
    const jitterAmount = cappedDelay * 0.3 * Math.random();
    return cappedDelay + jitterAmount;
  }
  return cappedDelay;
}
async function withRetry(fn, options = {}) {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let retryCount = 0;
  let lastError = null;
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

export { withRetry as w };
