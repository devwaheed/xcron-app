import type { RunEntry } from '@/types';
import { getEngine } from '@/lib/engine-factory';
import { getScriptPath, getWorkflowPath } from '@/lib/engines/github-actions';

/**
 * GitHubBridge — legacy interface kept for backward compatibility.
 * All methods delegate to the configured ExecutionEngine.
 *
 * New code should use getEngine() from engine-factory.ts directly.
 */
export interface GitHubBridge {
  commitScript(userId: string, actionId: string, scriptContent: string): Promise<void>;
  commitWorkflow(userId: string, actionId: string, workflowYaml: string): Promise<void>;
  deleteScript(userId: string, actionId: string): Promise<void>;
  deleteWorkflow(userId: string, actionId: string): Promise<void>;
  enableWorkflow(userId: string, actionId: string): Promise<void>;
  disableWorkflow(userId: string, actionId: string): Promise<void>;
  triggerWorkflow(userId: string, actionId: string): Promise<void>;
  getWorkflowRuns(userId: string, actionId: string, page: number, status?: string): Promise<RunEntry[]>;
}

/**
 * Creates a GitHubBridge that delegates to the active execution engine.
 * This is the compatibility layer — existing route code doesn't need to change.
 */
export function createGitHubBridge(): GitHubBridge {
  const engine = getEngine();

  return {
    async commitScript(userId, actionId, scriptContent) {
      if ('saveScript' in engine) {
        await (engine as { saveScript: (u: string, a: string, c: string) => Promise<void> }).saveScript(userId, actionId, scriptContent);
      }
    },

    async commitWorkflow() {
      // Workflow generation is handled inside engine.deploy() now.
      // This is a no-op for backward compat — callers that use
      // commitScript + commitWorkflow separately should migrate to engine.deploy().
    },

    async deleteScript(userId, actionId) {
      if ('deleteScript' in engine) {
        await (engine as { deleteScript: (u: string, a: string) => Promise<void> }).deleteScript(userId, actionId);
      }
    },

    async deleteWorkflow() {
      // Handled by engine.undeploy()
    },

    async enableWorkflow(userId, actionId) {
      await engine.resume(actionId, userId);
    },

    async disableWorkflow(userId, actionId) {
      await engine.pause(actionId, userId);
    },

    async triggerWorkflow(userId, actionId) {
      await engine.trigger(actionId, userId);
    },

    async getWorkflowRuns(userId, actionId, page, status) {
      return engine.getRuns(actionId, userId, page, status);
    },
  };
}

export { getScriptPath, getWorkflowPath };
