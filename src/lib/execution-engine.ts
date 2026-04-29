import type { Action, RunEntry } from '@/types';

/**
 * ExecutionEngine — pluggable interface for running user scripts.
 *
 * The app ships with GitHubActionsEngine (default).
 * To scale beyond GitHub Actions limits, implement this interface
 * for your preferred compute backend and set EXECUTION_ENGINE env var.
 *
 * Implementations:
 *   - "github"  → GitHub Actions via workflow dispatch (default)
 *   - "lambda"  → AWS Lambda (future)
 *   - "modal"   → Modal.com serverless (future)
 *   - "docker"  → Self-hosted Docker runner (future)
 */
export interface ExecutionEngine {
  /** Deploy a job's script so it's ready to execute */
  deploy(action: Action, userId: string, workflowYaml?: string): Promise<void>;

  /** Remove a job's deployed artifacts */
  undeploy(actionId: string, userId: string): Promise<void>;

  /** Trigger immediate execution of a job */
  trigger(actionId: string, userId: string): Promise<void>;

  /** Pause a job (prevent scheduled execution) */
  pause(actionId: string, userId: string): Promise<void>;

  /** Resume a paused job */
  resume(actionId: string, userId: string): Promise<void>;

  /** Get execution history for a job */
  getRuns(actionId: string, userId: string, page: number, status?: string): Promise<RunEntry[]>;
}

/**
 * ScriptStore — where script files are persisted.
 * Separate from execution because you might store scripts in GitHub
 * but execute them on Lambda.
 */
export interface ScriptStore {
  /** Save/update a script file */
  saveScript(userId: string, actionId: string, content: string): Promise<void>;

  /** Delete a script file */
  deleteScript(userId: string, actionId: string): Promise<void>;
}
