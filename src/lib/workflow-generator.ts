import YAML from 'yaml';
import type { Action } from '@/types';

/**
 * Generate a GitHub Actions workflow YAML string for the given action.
 *
 * Supports: timeout, retries, and environment variables.
 * Scheduling is handled by cron-job.org → workflow_dispatch.
 */
export function generate(action: Action, userId: string): string {
  const timeout = action.timeoutMinutes ?? 5;
  const maxRetries = action.maxRetries ?? 0;
  const retryDelay = action.retryDelaySeconds ?? 60;

  // Build env vars object for the run step
  const envVars: Record<string, string> = {};
  if (action.envVars && typeof action.envVars === 'object') {
    for (const [key, value] of Object.entries(action.envVars)) {
      envVars[key] = value;
    }
  }

  const runStep: Record<string, unknown> = {
    name: 'Run script',
    run: `node scripts/${userId}/${action.id}.js`,
  };

  if (Object.keys(envVars).length > 0) {
    runStep.env = envVars;
  }

  const steps = [
    { uses: 'actions/checkout@v4' },
    { uses: 'actions/setup-node@v4', with: { 'node-version': '20' } },
    { name: 'Install dependencies', run: 'npm install puppeteer' },
    runStep,
  ];

  // Build retry wrapper if retries > 0
  if (maxRetries > 0) {
    const retryScript = `node scripts/${userId}/${action.id}.js`;
    const retryRun = [
      `max_retries=${maxRetries}`,
      `retry_delay=${retryDelay}`,
      `attempt=0`,
      `until [ $attempt -ge $((max_retries + 1)) ]; do`,
      `  if ${retryScript}; then`,
      `    echo "✓ Script succeeded on attempt $((attempt + 1))"`,
      `    exit 0`,
      `  fi`,
      `  attempt=$((attempt + 1))`,
      `  if [ $attempt -lt $((max_retries + 1)) ]; then`,
      `    echo "⚠ Attempt $attempt failed, retrying in ${retryDelay}s..."`,
      `    sleep $retry_delay`,
      `  fi`,
      `done`,
      `echo "✗ All $((max_retries + 1)) attempts failed"`,
      `exit 1`,
    ].join('\n');

    // Replace the simple run step with retry wrapper
    steps[steps.length - 1] = {
      name: 'Run script (with retries)',
      run: retryRun,
      ...(Object.keys(envVars).length > 0 ? { env: envVars } : {}),
    } as Record<string, unknown>;
  }

  const workflow = {
    name: action.name,
    on: { workflow_dispatch: {} },
    jobs: {
      run: {
        'runs-on': 'ubuntu-latest',
        'timeout-minutes': timeout,
        steps,
      },
    },
  };

  return YAML.stringify(workflow);
}
