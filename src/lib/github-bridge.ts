import { getEnvConfig } from '@/lib/env';
import type { RunEntry } from '@/types';

export interface GitHubBridge {
  commitScript(actionId: string, scriptContent: string): Promise<void>;
  commitWorkflow(actionId: string, workflowYaml: string): Promise<void>;
  deleteScript(actionId: string): Promise<void>;
  deleteWorkflow(actionId: string): Promise<void>;
  enableWorkflow(actionId: string): Promise<void>;
  disableWorkflow(actionId: string): Promise<void>;
  triggerWorkflow(actionId: string): Promise<void>;
  getWorkflowRuns(actionId: string, page: number, status?: string): Promise<RunEntry[]>;
}

function getScriptPath(actionId: string): string {
  return `scripts/${actionId}.js`;
}

function getWorkflowPath(actionId: string): string {
  return `.github/workflows/${actionId}.yml`;
}

function githubHeaders(pat: string): Record<string, string> {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

async function getFileSha(
  owner: string,
  repo: string,
  path: string,
  pat: string
): Promise<string | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, { headers: githubHeaders(pat) });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API error fetching SHA for ${path}: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.sha as string;
}

async function commitFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  pat: string
): Promise<void> {
  const sha = await getFileSha(owner, repo, path, pat);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
  };
  if (sha) {
    body.sha = sha;
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers: githubHeaders(pat),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GitHub API error committing ${path}: ${res.status} ${res.statusText} - ${detail}`);
  }
}

async function deleteFile(
  owner: string,
  repo: string,
  path: string,
  message: string,
  pat: string
): Promise<void> {
  const sha = await getFileSha(owner, repo, path, pat);
  if (!sha) {
    // File doesn't exist, nothing to delete
    return;
  }
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: githubHeaders(pat),
    body: JSON.stringify({ message, sha }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GitHub API error deleting ${path}: ${res.status} ${res.statusText} - ${detail}`);
  }
}

export function createGitHubBridge(): GitHubBridge {
  const env = getEnvConfig();
  const { GITHUB_REPO_OWNER: owner, GITHUB_REPO_NAME: repo, GITHUB_PAT: pat } = env;

  return {
    async commitScript(actionId: string, scriptContent: string): Promise<void> {
      const path = getScriptPath(actionId);
      await commitFile(owner, repo, path, scriptContent, `Update script for action ${actionId}`, pat);
    },

    async commitWorkflow(actionId: string, workflowYaml: string): Promise<void> {
      const path = getWorkflowPath(actionId);
      await commitFile(owner, repo, path, workflowYaml, `Update workflow for action ${actionId}`, pat);
    },

    async deleteScript(actionId: string): Promise<void> {
      const path = getScriptPath(actionId);
      await deleteFile(owner, repo, path, `Delete script for action ${actionId}`, pat);
    },

    async deleteWorkflow(actionId: string): Promise<void> {
      const path = getWorkflowPath(actionId);
      await deleteFile(owner, repo, path, `Delete workflow for action ${actionId}`, pat);
    },

    async enableWorkflow(actionId: string): Promise<void> {
      const workflowFileName = `${actionId}.yml`;
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/enable`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: githubHeaders(pat),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`GitHub API error enabling workflow ${actionId}: ${res.status} ${res.statusText} - ${detail}`);
      }
    },

    async disableWorkflow(actionId: string): Promise<void> {
      const workflowFileName = `${actionId}.yml`;
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/disable`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: githubHeaders(pat),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`GitHub API error disabling workflow ${actionId}: ${res.status} ${res.statusText} - ${detail}`);
      }
    },

    async triggerWorkflow(actionId: string): Promise<void> {
      const workflowFileName = `${actionId}.yml`;
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`;
      const res = await fetch(url, {
        method: 'POST',
        headers: githubHeaders(pat),
        body: JSON.stringify({ ref: 'main' }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`GitHub API error triggering workflow ${actionId}: ${res.status} ${res.statusText} - ${detail}`);
      }
    },

    async getWorkflowRuns(actionId: string, page: number, status?: string): Promise<RunEntry[]> {
      const workflowFileName = `${actionId}.yml`;
      const params = new URLSearchParams({
        page: String(page),
        per_page: '100',
      });
      if (status) {
        params.set('status', status === 'success' ? 'completed' : status === 'failure' ? 'completed' : status);
      }
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/runs?${params}`;
      const res = await fetch(url, { headers: githubHeaders(pat) });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`GitHub API error fetching runs for ${actionId}: ${res.status} ${res.statusText} - ${detail}`);
      }
      const data = await res.json();
      const runs: RunEntry[] = (data.workflow_runs ?? []).map((run: Record<string, unknown>) => ({
        id: run.id as number,
        status: run.conclusion === 'success' ? 'success' : 'failure',
        timestamp: run.created_at as string,
        output: (run.name as string) ?? '',
        trigger: run.event === 'workflow_dispatch' ? 'workflow_dispatch' : 'schedule',
      }));

      // Apply client-side status filter if needed (GitHub API filters by workflow status, not conclusion)
      if (status === 'success') {
        return runs.filter((r) => r.status === 'success');
      }
      if (status === 'failure') {
        return runs.filter((r) => r.status === 'failure');
      }
      return runs;
    },
  };
}

export { getScriptPath, getWorkflowPath };
