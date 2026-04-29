import type { Action, RunEntry } from '@/types';
import type { ExecutionEngine, ScriptStore } from '@/lib/execution-engine';
import { getEnvConfig } from '@/lib/env';
import { generate } from '@/lib/workflow-generator';

/**
 * GitHub App installation token cache.
 */
let cachedAppToken: { token: string; expiresAt: number } | null = null;

async function getGitHubAppToken(appId: string, privateKey: string, installationId: string): Promise<string> {
  if (cachedAppToken && Date.now() < cachedAppToken.expiresAt) {
    return cachedAppToken.token;
  }
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 600, iss: appId })).toString("base64url");
  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(privateKey.replace(/\\n/g, "\n"), "base64url");
  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (!res.ok) throw new Error(`GitHub App token exchange failed: ${res.status}`);
  const data = await res.json();
  cachedAppToken = { token: data.token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return data.token;
}

function headers(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" };
}

async function getToken(): Promise<string> {
  const env = getEnvConfig();
  if (env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && env.GITHUB_APP_INSTALLATION_ID) {
    return getGitHubAppToken(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY, env.GITHUB_APP_INSTALLATION_ID);
  }
  return env.GITHUB_PAT;
}

function getOwnerRepo() {
  const env = getEnvConfig();
  return { owner: env.GITHUB_REPO_OWNER, repo: env.GITHUB_REPO_NAME };
}

async function getFileSha(owner: string, repo: string, path: string, token: string): Promise<string | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers: headers(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub SHA fetch failed for ${path}: ${res.status}`);
  return (await res.json()).sha;
}

async function commitFile(owner: string, repo: string, path: string, content: string, message: string, token: string) {
  const sha = await getFileSha(owner, repo, path, token);
  const body: Record<string, string> = { message, content: Buffer.from(content).toString("base64") };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT", headers: headers(token), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub commit failed for ${path}: ${res.status} — ${await res.text()}`);
}

async function deleteFileGH(owner: string, repo: string, path: string, message: string, token: string) {
  const sha = await getFileSha(owner, repo, path, token);
  if (!sha) return;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: "DELETE", headers: headers(token), body: JSON.stringify({ message, sha }),
  });
  if (!res.ok) throw new Error(`GitHub delete failed for ${path}: ${res.status} — ${await res.text()}`);
}

export function getScriptPath(userId: string, actionId: string): string {
  return `scripts/${userId}/${actionId}.js`;
}

export function getWorkflowPath(userId: string, actionId: string): string {
  return `.github/workflows/${userId}_${actionId}.yml`;
}

/**
 * GitHub Actions execution engine.
 * Scripts are stored as files in a GitHub repo and executed via workflow dispatch.
 */
export class GitHubActionsEngine implements ExecutionEngine, ScriptStore {
  async deploy(action: Action, userId: string): Promise<void> {
    const token = await getToken();
    const { owner, repo } = getOwnerRepo();
    const workflowYaml = generate(action, userId);
    await commitFile(owner, repo, getScriptPath(userId, action.id), action.scriptContent, `Deploy script ${action.id}`, token);
    await commitFile(owner, repo, getWorkflowPath(userId, action.id), workflowYaml, `Deploy workflow ${action.id}`, token);
  }

  async undeploy(actionId: string, userId: string): Promise<void> {
    const token = await getToken();
    const { owner, repo } = getOwnerRepo();
    await deleteFileGH(owner, repo, getScriptPath(userId, actionId), `Remove script ${actionId}`, token);
    await deleteFileGH(owner, repo, getWorkflowPath(userId, actionId), `Remove workflow ${actionId}`, token);
  }

  async trigger(actionId: string, userId: string): Promise<void> {
    const token = await getToken();
    const { owner, repo } = getOwnerRepo();
    const file = `${userId}_${actionId}.yml`;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${file}/dispatches`, {
      method: "POST", headers: headers(token), body: JSON.stringify({ ref: "main" }),
    });
    if (!res.ok) throw new Error(`Trigger failed for ${actionId}: ${res.status} — ${await res.text()}`);
  }

  async pause(actionId: string, userId: string): Promise<void> {
    const token = await getToken();
    const { owner, repo } = getOwnerRepo();
    const file = `${userId}_${actionId}.yml`;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${file}/disable`, {
      method: "PUT", headers: headers(token),
    });
    if (!res.ok) throw new Error(`Pause failed for ${actionId}: ${res.status}`);
  }

  async resume(actionId: string, userId: string): Promise<void> {
    const token = await getToken();
    const { owner, repo } = getOwnerRepo();
    const file = `${userId}_${actionId}.yml`;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${file}/enable`, {
      method: "PUT", headers: headers(token),
    });
    if (!res.ok) throw new Error(`Resume failed for ${actionId}: ${res.status}`);
  }

  async getRuns(actionId: string, userId: string, page: number, status?: string): Promise<RunEntry[]> {
    const token = await getToken();
    const { owner, repo } = getOwnerRepo();
    const file = `${userId}_${actionId}.yml`;
    const params = new URLSearchParams({ page: String(page), per_page: "100" });
    if (status) params.set("status", "completed");
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${file}/runs?${params}`, {
      headers: headers(token),
    });
    if (!res.ok) throw new Error(`Fetch runs failed for ${actionId}: ${res.status}`);
    const data = await res.json();
    const runs: RunEntry[] = (data.workflow_runs ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as number,
      status: r.conclusion === "success" ? "success" : "failure",
      timestamp: r.created_at as string,
      output: (r.name as string) ?? "",
      trigger: r.event === "workflow_dispatch" ? "workflow_dispatch" : "schedule",
    }));
    if (status === "success") return runs.filter((r) => r.status === "success");
    if (status === "failure") return runs.filter((r) => r.status === "failure");
    return runs;
  }

  // ScriptStore implementation
  async saveScript(userId: string, actionId: string, content: string): Promise<void> {
    const token = await getToken();
    const { owner, repo } = getOwnerRepo();
    await commitFile(owner, repo, getScriptPath(userId, actionId), content, `Update script ${actionId}`, token);
  }

  async deleteScript(userId: string, actionId: string): Promise<void> {
    const token = await getToken();
    const { owner, repo } = getOwnerRepo();
    await deleteFileGH(owner, repo, getScriptPath(userId, actionId), `Delete script ${actionId}`, token);
  }
}
