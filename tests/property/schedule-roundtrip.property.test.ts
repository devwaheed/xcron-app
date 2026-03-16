// Feature: cron-job-builder, Property 15: Schedule-to-cron round-trip

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildCron, parseCron } from '@/lib/cron-builder';
import type { Schedule } from '@/types';

/**
 * Validates: Requirements 10.2, 13.2
 *
 * For any valid schedule (days, hour, minute, AM/PM, timezone),
 * converting the schedule to a cron expression and then parsing
 * that cron expression back (given the same timezone) should
 * produce a schedule equivalent to the original.
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

const arbitrarySchedule: fc.Arbitrary<Schedule> = fc
  .record({
    days: fc
      .subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 })
      .map((d) => [...d].sort((a, b) => a - b)),
    hour: fc.integer({ min: 1, max: 12 }),
    minute: fc.integer({ min: 0, max: 59 }),
    period: fc.constantFrom('AM' as const, 'PM' as const),
    timezone: fc.constantFrom(...IANA_TIMEZONES),
  });

describe('Property 15: Schedule-to-cron round-trip', () => {
  it('parseCron(buildCron(schedule), schedule.timezone) equals the original schedule', () => {
    fc.assert(
      fc.property(arbitrarySchedule, (schedule) => {
        const cron = buildCron(schedule);
        const roundTripped = parseCron(cron, schedule.timezone);

        expect(roundTripped.days).toEqual(schedule.days);
        expect(roundTripped.hour).toBe(schedule.hour);
        expect(roundTripped.minute).toBe(schedule.minute);
        expect(roundTripped.period).toBe(schedule.period);
        expect(roundTripped.timezone).toBe(schedule.timezone);
      }),
      { numRuns: 100 },
    );
  });
});
