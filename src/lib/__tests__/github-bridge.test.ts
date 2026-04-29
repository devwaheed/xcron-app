import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getScriptPath, getWorkflowPath } from '@/lib/github-bridge';
import { GitHubActionsEngine } from '@/lib/engines/github-actions';

// Mock env config
vi.mock('@/lib/env', () => ({
  getEnvConfig: () => ({
    GITHUB_REPO_OWNER: 'test-owner',
    GITHUB_REPO_NAME: 'test-repo',
    GITHUB_PAT: 'ghp_test_token',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    CRONJOB_API_KEY: 'test',
    CRON_SECRET: 'test',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  }),
}));

vi.mock('@/lib/workflow-generator', () => ({
  generate: () => 'name: mock-workflow\n',
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('getScriptPath', () => {
  it('returns correct script path', () => {
    expect(getScriptPath('user-1', 'action-1')).toBe('scripts/user-1/action-1.js');
  });
});

describe('getWorkflowPath', () => {
  it('returns correct workflow path', () => {
    expect(getWorkflowPath('user-1', 'action-1')).toBe('.github/workflows/user-1_action-1.yml');
  });
});

describe('GitHubActionsEngine', () => {
  let engine: GitHubActionsEngine;

  beforeEach(() => {
    mockFetch.mockReset();
    engine = new GitHubActionsEngine();
  });

  afterEach(() => { vi.restoreAllMocks(); });

  describe('saveScript', () => {
    it('creates a new script file when it does not exist', async () => {
      mockFetch.mockResolvedValueOnce({ status: 404, ok: false });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201 });

      await engine.saveScript('user-1', 'action-1', 'console.log("hello")');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const putCall = mockFetch.mock.calls[1];
      expect(putCall[0]).toContain('scripts/user-1/action-1.js');
      expect(putCall[1].method).toBe('PUT');
      const body = JSON.parse(putCall[1].body);
      expect(body.content).toBe(Buffer.from('console.log("hello")').toString('base64'));
    });

    it('updates an existing script with sha', async () => {
      mockFetch.mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ sha: 'sha-123' }) });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await engine.saveScript('user-1', 'action-1', 'updated');

      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.sha).toBe('sha-123');
    });
  });

  describe('deleteScript', () => {
    it('deletes an existing script', async () => {
      mockFetch.mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ sha: 'sha-del' }) });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await engine.deleteScript('user-1', 'action-1');

      expect(mockFetch.mock.calls[1][1].method).toBe('DELETE');
    });

    it('does nothing when file does not exist', async () => {
      mockFetch.mockResolvedValueOnce({ status: 404, ok: false });

      await engine.deleteScript('user-1', 'nonexistent');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('trigger', () => {
    it('dispatches workflow with ref main', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await engine.trigger('action-1', 'user-1');

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('user-1_action-1.yml/dispatches');
      expect(JSON.parse(call[1].body)).toEqual({ ref: 'main' });
    });

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 422, statusText: 'Err', text: async () => 'error' });

      await expect(engine.trigger('action-1', 'user-1')).rejects.toThrow('Trigger failed');
    });
  });

  describe('pause', () => {
    it('calls the disable endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await engine.pause('action-1', 'user-1');

      expect(mockFetch.mock.calls[0][0]).toContain('user-1_action-1.yml/disable');
    });
  });

  describe('resume', () => {
    it('calls the enable endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await engine.resume('action-1', 'user-1');

      expect(mockFetch.mock.calls[0][0]).toContain('user-1_action-1.yml/enable');
    });

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', text: async () => 'nf' });

      await expect(engine.resume('action-1', 'user-1')).rejects.toThrow('Resume failed');
    });
  });

  describe('getRuns', () => {
    it('maps GitHub API response to RunEntry array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          workflow_runs: [
            { id: 1001, conclusion: 'success', created_at: '2024-01-15T10:00:00Z', name: 'Run', event: 'schedule' },
            { id: 1002, conclusion: 'failure', created_at: '2024-01-14T10:00:00Z', name: 'Run', event: 'workflow_dispatch' },
          ],
        }),
      });

      const runs = await engine.getRuns('action-1', 'user-1', 1);

      expect(runs).toHaveLength(2);
      expect(runs[0].status).toBe('success');
      expect(runs[1].trigger).toBe('workflow_dispatch');
    });

    it('filters by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          workflow_runs: [
            { id: 1, conclusion: 'success', created_at: '2024-01-15T10:00:00Z', name: 'r', event: 'schedule' },
            { id: 2, conclusion: 'failure', created_at: '2024-01-14T10:00:00Z', name: 'r', event: 'schedule' },
          ],
        }),
      });

      const runs = await engine.getRuns('action-1', 'user-1', 1, 'failure');
      expect(runs).toHaveLength(1);
      expect(runs[0].status).toBe('failure');
    });

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403, statusText: 'Forbidden', text: async () => 'rate limited' });

      await expect(engine.getRuns('action-1', 'user-1', 1)).rejects.toThrow('Fetch runs failed');
    });
  });
});
