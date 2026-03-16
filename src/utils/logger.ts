import ora, { type Ora } from "ora";
import chalk from "chalk";

type LogLevel = "debug" | "info" | "warn" | "error" | "success";

interface LoggerOptions {
  silent?: boolean;
  debug?: boolean;
}

class Logger {
  private spinner: Ora | null = null;
  private silent: boolean;
  private debugEnabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.silent = options.silent ?? false;
    this.debugEnabled = options.debug ?? false;
  }

  start(text: string): void {
    if (this.silent) return;
    this.spinner = ora(text).start();
  }

  update(text: string): void {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  succeed(text?: string): void {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    } else {
      console.log(chalk.green("✓"), text ?? "");
    }
  }

  fail(text?: string): void {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    } else {
      console.log(chalk.red("✗"), text ?? "");
    }
  }

  warn(text?: string): void {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.warn(text);
      this.spinner = null;
    } else {
      console.log(chalk.yellow("⚠"), text ?? "");
    }
  }

  info(text?: string): void {
    if (this.silent) return;
    if (this.spinner) {
      this.spinner.info(text);
      this.spinner = null;
    } else {
      console.log(chalk.blue("ℹ"), text ?? "");
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  log(message: string, level: LogLevel = "info"): void {
    if (this.silent) return;

    const prefix: Record<LogLevel, string> = {
      debug: chalk.gray("⚙"),
      info: chalk.blue("ℹ"),
      warn: chalk.yellow("⚠"),
      error: chalk.red("✗"),
      success: chalk.green("✓"),
    };

    console.log(prefix[level], message);
  }

  debug(message: string): void {
    if (!this.debugEnabled) return;
    this.log(message, "debug");
  }

  error(message: string, error?: Error): void {
    if (this.silent) return;
    this.log(message, "error");
    if (error && this.debugEnabled) {
      console.error(error);
    }
  }

  step(stepName: string, text: string): void {
    if (this.silent) return;
    this.update(`${chalk.cyan(`[${stepName}]`)} ${text}`);
  }

  progress(current: number, total: number, text: string): void {
    if (this.silent) return;
    const percentage = Math.round((current / total) * 100);
    const bar = this.progressBar(percentage);
    this.update(`${bar} ${text}`);
  }

  private progressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    return chalk.cyan(`[${bar}] ${percentage}%`);
  }

  table(data: Record<string, unknown>[]): void {
    if (this.silent) return;
    console.table(data);
  }

  newline(): void {
    if (this.silent) return;
    console.log();
  }

  getSpinner(): Ora | null {
    return this.spinner;
  }

  setSilent(silent: boolean): void {
    this.silent = silent;
  }

  setDebug(debug: boolean): void {
    this.debugEnabled = debug;
  }
}

export const logger = new Logger();
export { Logger };
export type { LoggerOptions, LogLevel };
