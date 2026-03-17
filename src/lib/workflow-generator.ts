import YAML from 'yaml';
import type { Action } from '@/types';

/**
 * Generate a GitHub Actions workflow YAML string for the given action.
 *
 * Scheduling is handled entirely by cron-job.org, which calls our
 * /api/actions/[id]/trigger endpoint → workflow_dispatch.
 * No cron schedule in the workflow to avoid double runs.
 */
export function generate(action: Action): string {
  const workflow = {
    name: action.name,
    on: {
      workflow_dispatch: {},
    },
    jobs: {
      run: {
        'runs-on': 'ubuntu-latest',
        steps: [
          { uses: 'actions/checkout@v4' },
          {
            uses: 'actions/setup-node@v4',
            with: { 'node-version': '20' },
          },
          {
            name: 'Install dependencies',
            run: 'npm install puppeteer',
          },
          {
            name: 'Run script',
            run: `node scripts/${action.id}.js`,
          },
        ],
      },
    },
  };

  return YAML.stringify(workflow);
}
