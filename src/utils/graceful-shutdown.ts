import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";

export interface ShutdownState {
  runId?: string;
  workflowStatus?: string;
  tempFiles: string[];
  timestamp: string;
}

class GracefulShutdown extends EventEmitter {
  private static instance: GracefulShutdown;
  private isShuttingDown = false;
  private tempFiles: Set<string> = new Set();
  private state: ShutdownState;
  private stateFile: string;
  private spinner: ReturnType<typeof ora> | null = null;

  private constructor() {
    super();
    this.state = {
      tempFiles: [],
      timestamp: new Date().toISOString(),
    };
    this.stateFile = path.join(process.cwd(), ".video-script-state.json");
    this.setupHandlers();
  }

  static getInstance(): GracefulShutdown {
    if (!GracefulShutdown.instance) {
      GracefulShutdown.instance = new GracefulShutdown();
    }
    return GracefulShutdown.instance;
  }

  setSpinner(spinner: ReturnType<typeof ora>): void {
    this.spinner = spinner;
  }

  registerTempFile(filePath: string): void {
    this.tempFiles.add(filePath);
    this.state.tempFiles = Array.from(this.tempFiles);
  }

  unregisterTempFile(filePath: string): void {
    this.tempFiles.delete(filePath);
    this.state.tempFiles = Array.from(this.tempFiles);
  }

  setRunId(runId: string): void {
    this.state.runId = runId;
  }

  setWorkflowStatus(status: string): void {
    this.state.workflowStatus = status;
  }

  saveState(): void {
    try {
      this.state.timestamp = new Date().toISOString();
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      // Silently fail - state saving is best effort
    }
  }

  loadState(): ShutdownState | null {
    try {
      if (fs.existsSync(this.stateFile)) {
        const content = fs.readFileSync(this.stateFile, "utf-8");
        return JSON.parse(content) as ShutdownState;
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  clearState(): void {
    try {
      if (fs.existsSync(this.stateFile)) {
        fs.unlinkSync(this.stateFile);
      }
    } catch {
      // Ignore errors
    }
  }

  private setupHandlers(): void {
    // Handle Ctrl+C
    process.on("SIGINT", () => this.handleShutdown("SIGINT"));

    // Handle termination signal
    process.on("SIGTERM", () => this.handleShutdown("SIGTERM"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error(chalk.red("\n❌ Uncaught exception:"), error);
      this.handleShutdown("uncaughtException");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason) => {
      console.error(chalk.red("\n❌ Unhandled rejection:"), reason);
      this.handleShutdown("unhandledRejection");
    });
  }

  private async handleShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    if (this.spinner) {
      this.spinner.stop();
    }

    console.log(
      chalk.yellow(`\n\n⏳ Received ${signal}, shutting down gracefully...`),
    );

    // Save current state
    this.saveState();
    console.log(chalk.gray("  ✓ State saved"));

    // Clean up temporary files
    await this.cleanupTempFiles();

    // Emit shutdown event
    this.emit("shutdown", signal);

    console.log(chalk.green("✓ Cleanup complete. Goodbye!"));
    process.exit(0);
  }

  private async cleanupTempFiles(): Promise<void> {
    const files = Array.from(this.tempFiles);

    if (files.length === 0) {
      console.log(chalk.gray("  ✓ No temporary files to clean"));
      return;
    }

    console.log(
      chalk.gray(`  🧹 Cleaning ${files.length} temporary file(s)...`),
    );

    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          const stat = fs.statSync(file);
          if (stat.isDirectory()) {
            fs.rmSync(file, { recursive: true, force: true });
          } else {
            fs.unlinkSync(file);
          }
        }
        this.tempFiles.delete(file);
      } catch (error) {
        console.log(chalk.yellow(`    ⚠️  Failed to clean: ${file}`));
      }
    }

    console.log(chalk.gray("  ✓ Temporary files cleaned"));
  }

  async cleanup(): Promise<void> {
    await this.cleanupTempFiles();
    this.clearState();
  }
}

export const gracefulShutdown = GracefulShutdown.getInstance();
