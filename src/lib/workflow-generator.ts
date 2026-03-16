import YAML from 'yaml';
import { buildCron } from '@/lib/cron-builder';
import type { Action } from '@/types';

/**
 * Generate a GitHub Actions workflow YAML string for the given action.
 *
 * The workflow includes:
 * - A cron schedule trigger derived from the action's schedule
 * - A workflow_dispatch trigger for manual "Run Now"
 * - Node.js 20 setup, Puppeteer install, and script execution steps
 */
export function generate(action: Action): string {
  const cronExpression = buildCron(action.schedule);

  const workflow = {
    name: action.name,
    on: {
      schedule: [{ cron: cronExpression }],
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
