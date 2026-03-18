// Feature: cron-job-builder, Property 14: Generated workflow structure completeness

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import YAML from 'yaml';
import { generate } from '@/lib/workflow-generator';
import type { Action, Schedule } from '@/types';

/**
 * Validates: Requirements 10.1, 10.3, 10.4, 10.5, 13.1
 *
 * For any valid action configuration, the generated GitHub Actions workflow
 * YAML should be valid YAML and should contain:
 * (a) a workflow_dispatch trigger (scheduling is handled by cron-job.org)
 * (b) a Node.js setup step (actions/setup-node)
 * (c) a dependency installation step including Puppeteer
 * (d) a script execution step referencing scripts/{actionId}.js
 */

const IANA_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

const arbitrarySchedule: fc.Arbitrary<Schedule> = fc.record({
  days: fc
    .subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 })
    .map((d) => [...d].sort((a, b) => a - b)),
  hour: fc.integer({ min: 1, max: 12 }),
  minute: fc.integer({ min: 0, max: 59 }),
  period: fc.constantFrom('AM' as const, 'PM' as const),
  timezone: fc.constantFrom(...IANA_TIMEZONES),
});

const arbitraryAction: fc.Arbitrary<Action> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  scriptContent: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
  schedule: arbitrarySchedule,
  status: fc.constantFrom('active' as const, 'paused' as const),
  githubWorkflowId: fc.option(fc.integer({ min: 1, max: 999999 }), { nil: undefined }),
  createdAt: fc
    .integer({ min: 946684800000, max: 1893456000000 })
    .map((ms) => new Date(ms).toISOString()),
  updatedAt: fc
    .integer({ min: 946684800000, max: 1893456000000 })
    .map((ms) => new Date(ms).toISOString()),
});

describe('Property 14: Generated workflow structure completeness', () => {
  it('generate(action) produces valid YAML with all required sections', () => {
    fc.assert(
      fc.property(arbitraryAction, (action) => {
        const yamlStr = generate(action);

        // (f) The YAML is parseable
        const parsed = YAML.parse(yamlStr);
        expect(parsed).toBeDefined();
        expect(typeof parsed).toBe('object');

        // (a) workflow_dispatch trigger (cron-job.org handles scheduling)
        expect(parsed.on).toBeDefined();
        expect(parsed.on.workflow_dispatch).toBeDefined();
        // No schedule trigger — scheduling is delegated to cron-job.org
        expect(parsed.on.schedule).toBeUndefined();

        // Verify steps exist
        expect(parsed.jobs).toBeDefined();
        expect(parsed.jobs.run).toBeDefined();
        expect(Array.isArray(parsed.jobs.run.steps)).toBe(true);

        const steps = parsed.jobs.run.steps;

        // (b) Node.js setup step (actions/setup-node)
        const setupNodeStep = steps.find(
          (s: Record<string, unknown>) =>
            typeof s.uses === 'string' && s.uses.startsWith('actions/setup-node'),
        );
        expect(setupNodeStep).toBeDefined();

        // (c) dependency installation step including Puppeteer
        const installStep = steps.find(
          (s: Record<string, unknown>) =>
            typeof s.run === 'string' && s.run.includes('puppeteer'),
        );
        expect(installStep).toBeDefined();

        // (d) script execution step referencing scripts/{actionId}.js
        const scriptStep = steps.find(
          (s: Record<string, unknown>) =>
            typeof s.run === 'string' && s.run.includes(`scripts/${action.id}.js`),
        );
        expect(scriptStep).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });
});
