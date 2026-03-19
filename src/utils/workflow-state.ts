import fs from "fs";
import path from "path";
import { z } from "zod";
import { randomBytes } from "crypto";

export function generateRunId(): string {
  return randomBytes(8).toString("hex");
}

export const WorkflowStepStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
]);

export type WorkflowStepStatus = z.infer<typeof WorkflowStepStatusSchema>;

export const WorkflowStepStateSchema = z.object({
  stepId: z.string(),
  status: WorkflowStepStatusSchema,
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  error: z.string().optional(),
  retryCount: z.number().default(0),
  output: z.record(z.string(), z.unknown()).optional(),
});

export const WorkflowStateSchema = z.object({
  runId: z.string(),
  workflowId: z.string(),
  status: z.enum(["pending", "running", "suspended", "completed", "failed"]),
  currentStep: z.string().optional(),
  steps: z.array(WorkflowStepStateSchema),
  input: z.record(z.string(), z.unknown()).optional(),
  output: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type WorkflowStepState = z.infer<typeof WorkflowStepStateSchema>;
export type WorkflowState = z.infer<typeof WorkflowStateSchema>;

const STATE_DIR = ".video-script";
const STATE_FILE = "workflow-state.json";

export class WorkflowStateManager {
  private stateDir: string;
  private stateFile: string;
  private state: WorkflowState | null = null;

  constructor(workDir: string = process.cwd()) {
    this.stateDir = path.join(workDir, STATE_DIR);
    this.stateFile = path.join(this.stateDir, STATE_FILE);
  }

  initialize(
    workflowId: string,
    runId: string,
    steps: string[],
    input?: Record<string, unknown>,
  ): WorkflowState {
    this.ensureStateDir();

    this.state = {
      runId,
      workflowId,
      status: "pending",
      steps: steps.map((stepId) => ({
        stepId,
        status: "pending" as const,
        retryCount: 0,
      })),
      input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.save();
    return this.state;
  }

  load(): WorkflowState | null {
    try {
      if (fs.existsSync(this.stateFile)) {
        const content = fs.readFileSync(this.stateFile, "utf-8");
        this.state = WorkflowStateSchema.parse(JSON.parse(content));
        return this.state;
      }
    } catch (error) {
      // State file corrupted or invalid
    }
    return null;
  }

  save(): void {
    if (!this.state) return;

    this.ensureStateDir();
    this.state.updatedAt = new Date().toISOString();

    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  clear(): void {
    try {
      if (fs.existsSync(this.stateFile)) {
        fs.unlinkSync(this.stateFile);
      }
      this.state = null;
    } catch {
      // Ignore errors
    }
  }

  getState(): WorkflowState | null {
    return this.state;
  }

  startWorkflow(): void {
    if (!this.state) return;
    this.state.status = "running";
    this.state.updatedAt = new Date().toISOString();
    this.save();
  }

  completeWorkflow(output?: Record<string, unknown>): void {
    if (!this.state) return;
    this.state.status = "completed";
    this.state.output = output;
    this.state.updatedAt = new Date().toISOString();
    this.save();
  }

  failWorkflow(error: string): void {
    if (!this.state) return;
    this.state.status = "failed";
    this.state.error = error;
    this.state.updatedAt = new Date().toISOString();
    this.save();
  }

  suspendWorkflow(): void {
    if (!this.state) return;
    this.state.status = "suspended";
    this.state.updatedAt = new Date().toISOString();
    this.save();
  }

  startStep(stepId: string): void {
    if (!this.state) return;

    const step = this.state.steps.find((s) => s.stepId === stepId);
    if (step) {
      step.status = "running";
      step.startedAt = new Date().toISOString();
    }
    this.state.currentStep = stepId;
    this.state.status = "running";
    this.save();
  }

  completeStep(stepId: string, output?: Record<string, unknown>): void {
    if (!this.state) return;

    const step = this.state.steps.find((s) => s.stepId === stepId);
    if (step) {
      step.status = "completed";
      step.completedAt = new Date().toISOString();
      if (output) {
        step.output = output;
      }
    }
    this.save();
  }

  failStep(stepId: string, error: string): void {
    if (!this.state) return;

    const step = this.state.steps.find((s) => s.stepId === stepId);
    if (step) {
      step.status = "failed";
      step.error = error;
      step.completedAt = new Date().toISOString();
    }
    this.save();
  }

  skipStep(stepId: string): void {
    if (!this.state) return;

    const step = this.state.steps.find((s) => s.stepId === stepId);
    if (step) {
      step.status = "skipped";
      step.completedAt = new Date().toISOString();
    }
    this.save();
  }

  retryStep(stepId: string): boolean {
    if (!this.state) return false;

    const step = this.state.steps.find((s) => s.stepId === stepId);
    if (step && step.retryCount < 3) {
      step.retryCount++;
      step.status = "pending";
      step.error = undefined;
      step.startedAt = undefined;
      step.completedAt = undefined;
      this.save();
      return true;
    }
    return false;
  }

  getNextPendingStep(): string | null {
    if (!this.state) return null;

    const pendingStep = this.state.steps.find((s) => s.status === "pending");
    return pendingStep?.stepId ?? null;
  }

  getStepState(stepId: string): WorkflowStepState | undefined {
    return this.state?.steps.find((s) => s.stepId === stepId);
  }

  canRecover(): boolean {
    if (!this.state) return false;
    return this.state.status === "failed" || this.state.status === "suspended";
  }

  getRecoveryPoint(): { stepId: string; canRetry: boolean } | null {
    if (!this.state) return null;

    const failedStep = this.state.steps.find((s) => s.status === "failed");
    if (failedStep) {
      return {
        stepId: failedStep.stepId,
        canRetry: failedStep.retryCount < 3,
      };
    }

    const pendingStep = this.state.steps.find((s) => s.status === "pending");
    if (pendingStep) {
      return {
        stepId: pendingStep.stepId,
        canRetry: true,
      };
    }

    return null;
  }

  getProgress(): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    percentage: number;
  } {
    if (!this.state) {
      return { total: 0, completed: 0, failed: 0, pending: 0, percentage: 0 };
    }

    const total = this.state.steps.length;
    const completed = this.state.steps.filter(
      (s) => s.status === "completed" || s.status === "skipped",
    ).length;
    const failed = this.state.steps.filter((s) => s.status === "failed").length;
    const pending = this.state.steps.filter(
      (s) => s.status === "pending",
    ).length;

    return {
      total,
      completed,
      failed,
      pending,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  createCheckpoint(): string {
    if (!this.state) {
      throw new Error("No workflow state to checkpoint");
    }

    const checkpointFile = path.join(
      this.stateDir,
      `checkpoint-${this.state.runId}-${Date.now()}.json`,
    );

    fs.writeFileSync(checkpointFile, JSON.stringify(this.state, null, 2));
    return checkpointFile;
  }

  restoreFromCheckpoint(checkpointPath: string): WorkflowState | null {
    try {
      const content = fs.readFileSync(checkpointPath, "utf-8");
      this.state = WorkflowStateSchema.parse(JSON.parse(content));
      this.save();
      return this.state;
    } catch {
      return null;
    }
  }

  listCheckpoints(): string[] {
    try {
      if (!fs.existsSync(this.stateDir)) return [];

      return fs
        .readdirSync(this.stateDir)
        .filter((f) => f.startsWith("checkpoint-") && f.endsWith(".json"))
        .map((f) => path.join(this.stateDir, f))
        .sort((a, b) => b.localeCompare(a));
    } catch {
      return [];
    }
  }

  private ensureStateDir(): void {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }
}

export const workflowStateManager = new WorkflowStateManager();
