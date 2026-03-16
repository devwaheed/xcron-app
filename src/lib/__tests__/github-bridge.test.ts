import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGitHubBridge, getScriptPath, getWorkflowPath } from '@/lib/github-bridge';
import type { GitHubBridge } from '@/lib/github-bridge';

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
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('getScriptPath', () => {
  it('returns correct script path for an action ID', () => {
    expect(getScriptPath('abc-123')).toBe('scripts/abc-123.js');
  });
});

describe('getWorkflowPath', () => {
  it('returns correct workflow path for an action ID', () => {
    expect(getWorkflowPath('abc-123')).toBe('.github/workflows/abc-123.yml');
  });
});

describe('GitHubBridge', () => {
  let bridge: GitHubBridge;

  beforeEach(() => {
    mockFetch.mockReset();
    bridge = createGitHubBridge();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('commitScript', () => {
    it('creates a new script file when it does not exist', async () => {
      // First call: getFileSha returns 404
      mockFetch.mockResolvedValueOnce({ status: 404, ok: false });
      // Second call: PUT succeeds
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201 });

      await bridge.commitScript('action-1', 'console.log("hello")');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const putCall = mockFetch.mock.calls[1];
      expect(putCall[0]).toBe('https://api.github.com/repos/test-owner/test-repo/contents/scripts/action-1.js');
      expect(putCall[1].method).toBe('PUT');
      const body = JSON.parse(putCall[1].body);
      expect(body.content).toBe(Buffer.from('console.log("hello")').toString('base64'));
      expect(body.sha).toBeUndefined();
    });

    it('updates an existing script file with sha', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200, ok: true,
        json: async () => ({ sha: 'existing-sha-123' }),
      });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await bridge.commitScript('action-1', 'console.log("updated")');

      const putCall = mockFetch.mock.calls[1];
      const body = JSON.parse(putCall[1].body);
      expect(body.sha).toBe('existing-sha-123');
    });

    it('throws on GitHub API error', async () => {
      mockFetch.mockResolvedValueOnce({ status: 404, ok: false });
      mockFetch.mockResolvedValueOnce({
        ok: false, status: 500, statusText: 'Internal Server Error',
        text: async () => 'server error',
      });

      await expect(bridge.commitScript('action-1', 'code')).rejects.toThrow('GitHub API error committing');
    });
  });

  describe('commitWorkflow', () => {
    it('commits workflow YAML to the correct path', async () => {
      mockFetch.mockResolvedValueOnce({ status: 404, ok: false });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201 });

      await bridge.commitWorkflow('action-1', 'name: test');

      const putCall = mockFetch.mock.calls[1];
      expect(putCall[0]).toBe('https://api.github.com/repos/test-owner/test-repo/contents/.github/workflows/action-1.yml');
    });
  });

  describe('deleteScript', () => {
    it('deletes an existing script file', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200, ok: true,
        json: async () => ({ sha: 'sha-to-delete' }),
      });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await bridge.deleteScript('action-1');

      const deleteCall = mockFetch.mock.calls[1];
      expect(deleteCall[0]).toBe('https://api.github.com/repos/test-owner/test-repo/contents/scripts/action-1.js');
      expect(deleteCall[1].method).toBe('DELETE');
      const body = JSON.parse(deleteCall[1].body);
      expect(body.sha).toBe('sha-to-delete');
    });

    it('does nothing when file does not exist', async () => {
      mockFetch.mockResolvedValueOnce({ status: 404, ok: false });

      await bridge.deleteScript('nonexistent');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteWorkflow', () => {
    it('deletes an existing workflow file', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200, ok: true,
        json: async () => ({ sha: 'wf-sha' }),
      });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await bridge.deleteWorkflow('action-1');

      const deleteCall = mockFetch.mock.calls[1];
      expect(deleteCall[0]).toBe('https://api.github.com/repos/test-owner/test-repo/contents/.github/workflows/action-1.yml');
    });
  });

  describe('enableWorkflow', () => {
    it('calls the enable endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await bridge.enableWorkflow('action-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/test-owner/test-repo/actions/workflows/action-1.yml/enable',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false, status: 404, statusText: 'Not Found',
        text: async () => 'not found',
      });

      await expect(bridge.enableWorkflow('bad-id')).rejects.toThrow('GitHub API error enabling workflow');
    });
  });

  describe('disableWorkflow', () => {
    it('calls the disable endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await bridge.disableWorkflow('action-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/test-owner/test-repo/actions/workflows/action-1.yml/disable',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('triggerWorkflow', () => {
    it('dispatches workflow with ref main', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await bridge.triggerWorkflow('action-1');

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe(
        'https://api.github.com/repos/test-owner/test-repo/actions/workflows/action-1.yml/dispatches'
      );
      expect(call[1].method).toBe('POST');
      expect(JSON.parse(call[1].body)).toEqual({ ref: 'main' });
    });

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false, status: 422, statusText: 'Unprocessable',
        text: async () => 'error',
      });

      await expect(bridge.triggerWorkflow('action-1')).rejects.toThrow('GitHub API error triggering workflow');
    });
  });

  describe('getWorkflowRuns', () => {
    it('maps GitHub API response to RunEntry array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          workflow_runs: [
            {
              id: 1001,
              conclusion: 'success',
              created_at: '2024-01-15T10:00:00Z',
              name: 'Run action-1',
              event: 'schedule',
            },
            {
              id: 1002,
              conclusion: 'failure',
              created_at: '2024-01-14T10:00:00Z',
              name: 'Run action-1',
              event: 'workflow_dispatch',
            },
          ],
        }),
      });

      const runs = await bridge.getWorkflowRuns('action-1', 1);

      expect(runs).toHaveLength(2);
      expect(runs[0]).toEqual({
        id: 1001,
        status: 'success',
        timestamp: '2024-01-15T10:00:00Z',
        output: 'Run action-1',
        trigger: 'schedule',
      });
      expect(runs[1]).toEqual({
        id: 1002,
        status: 'failure',
        timestamp: '2024-01-14T10:00:00Z',
        output: 'Run action-1',
        trigger: 'workflow_dispatch',
      });
    });

    it('filters by success status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          workflow_runs: [
            { id: 1, conclusion: 'success', created_at: '2024-01-15T10:00:00Z', name: 'r', event: 'schedule' },
            { id: 2, conclusion: 'failure', created_at: '2024-01-14T10:00:00Z', name: 'r', event: 'schedule' },
          ],
        }),
      });

      const runs = await bridge.getWorkflowRuns('action-1', 1, 'success');
      expect(runs).toHaveLength(1);
      expect(runs[0].status).toBe('success');
    });

    it('filters by failure status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          workflow_runs: [
            { id: 1, conclusion: 'success', created_at: '2024-01-15T10:00:00Z', name: 'r', event: 'schedule' },
            { id: 2, conclusion: 'failure', created_at: '2024-01-14T10:00:00Z', name: 'r', event: 'schedule' },
          ],
        }),
      });

      const runs = await bridge.getWorkflowRuns('action-1', 1, 'failure');
      expect(runs).toHaveLength(1);
      expect(runs[0].status).toBe('failure');
    });

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false, status: 403, statusText: 'Forbidden',
        text: async () => 'rate limited',
      });

      await expect(bridge.getWorkflowRuns('action-1', 1)).rejects.toThrow('GitHub API error fetching runs');
    });
  });
});
