import { describe, it, expect } from 'vitest';
import YAML from 'yaml';
import { generate } from '@/lib/workflow-generator';
import { buildCron } from '@/lib/cron-builder';
import type { Action } from '@/types';

function makeAction(overrides: Partial<Action> = {}): Action {
  return {
    id: 'test-action-123',
    name: 'My Test Action',
    scriptContent: 'console.log("hello");',
    schedule: {
      days: [1, 3, 5],
      hour: 9,
      minute: 30,
      period: 'AM',
      timezone: 'UTC',
    },
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    userId: 'test-user-id-1234',
    ...overrides,
  };
}

const TEST_USER_ID = 'test-user-id-1234';

describe('WorkflowGenerator.generate', () => {
  it('produces valid YAML', () => {
    const action = makeAction();
    const yamlStr = generate(action, TEST_USER_ID);
    const parsed = YAML.parse(yamlStr);
    expect(parsed).toBeDefined();
  });

  it('sets the workflow name to the action name', () => {
    const action = makeAction({ name: 'Daily Scraper' });
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    expect(parsed.name).toBe('Daily Scraper');
  });

  it('does not include a schedule trigger (cron-job.org handles scheduling)', () => {
    const action = makeAction();
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    expect(parsed.on.schedule).toBeUndefined();
  });

  it('includes a workflow_dispatch trigger', () => {
    const action = makeAction();
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    expect(parsed.on.workflow_dispatch).toBeDefined();
  });

  it('includes actions/checkout step', () => {
    const action = makeAction();
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    const steps = parsed.jobs.run.steps;
    expect(steps[0].uses).toBe('actions/checkout@v4');
  });

  it('includes Node.js setup step with version 20', () => {
    const action = makeAction();
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    const steps = parsed.jobs.run.steps;
    const nodeStep = steps.find((s: Record<string, unknown>) => typeof s.uses === 'string' && s.uses.startsWith('actions/setup-node'));
    expect(nodeStep).toBeDefined();
    expect(nodeStep.with['node-version']).toBe('20');
  });

  it('includes dependency install step with Puppeteer', () => {
    const action = makeAction();
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    const steps = parsed.jobs.run.steps;
    const installStep = steps.find((s: Record<string, unknown>) => s.name === 'Install dependencies');
    expect(installStep).toBeDefined();
    expect(installStep.run).toContain('puppeteer');
  });

  it('includes script execution step referencing the correct path', () => {
    const action = makeAction({ id: 'abc-def-456' });
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    const steps = parsed.jobs.run.steps;
    const runStep = steps.find((s: Record<string, unknown>) => s.name === 'Run script');
    expect(runStep).toBeDefined();
    expect(runStep.run).toBe(`node scripts/${TEST_USER_ID}/abc-def-456.js`);
  });

  it('runs on ubuntu-latest', () => {
    const action = makeAction();
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    expect(parsed.jobs.run['runs-on']).toBe('ubuntu-latest');
  });

  it('does not include a cron expression (scheduling delegated to cron-job.org)', () => {
    const action = makeAction({
      schedule: {
        days: [0, 6],
        hour: 3,
        minute: 0,
        period: 'PM',
        timezone: 'UTC',
      },
    });
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    expect(parsed.on.schedule).toBeUndefined();
    expect(parsed.on.workflow_dispatch).toBeDefined();
  });

  it('step ordering is checkout → setup-node → install deps → run script', () => {
    const action = makeAction();
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    const steps = parsed.jobs.run.steps;

    expect(steps).toHaveLength(4);
    expect(steps[0].uses).toBe('actions/checkout@v4');
    expect(steps[1].uses).toMatch(/^actions\/setup-node/);
    expect(steps[2].name).toBe('Install dependencies');
    expect(steps[3].name).toBe('Run script');
  });

  it('does not embed buildCron output (cron-job.org handles scheduling)', () => {
    const action = makeAction({
      schedule: {
        days: [1, 3, 5],
        hour: 9,
        minute: 30,
        period: 'AM',
        timezone: 'UTC',
      },
    });
    const parsed = YAML.parse(generate(action, TEST_USER_ID));
    expect(parsed.on.schedule).toBeUndefined();
  });
});
