// Feature: cron-job-builder, Property 17: Invalid schedule rejection

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateSchedule } from '@/lib/schedule-validator';
import type { Schedule } from '@/types';

/**
 * Validates: Requirements 13.3
 *
 * For any invalid schedule (empty days, day values outside 0–6,
 * hour outside 1–12, minute outside 0–59, invalid AM/PM, or
 * invalid timezone), validateSchedule should return errors.
 */

const VALID_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

/** Generates a schedule that is invalid in at least one way. */
const arbitraryInvalidSchedule: fc.Arbitrary<Schedule> = fc.oneof(
  // Empty days array
  fc.record({
    days: fc.constant([] as number[]),
    hour: fc.integer({ min: 1, max: 12 }),
    minute: fc.integer({ min: 0, max: 59 }),
    period: fc.constantFrom('AM' as const, 'PM' as const),
    timezone: fc.constantFrom(...VALID_TIMEZONES),
  }),

  // Day values outside 0–6
  fc.record({
    days: fc
      .array(
        fc.oneof(fc.integer({ min: 7, max: 100 }), fc.integer({ min: -100, max: -1 })),
        { minLength: 1, maxLength: 7 },
      ),
    hour: fc.integer({ min: 1, max: 12 }),
    minute: fc.integer({ min: 0, max: 59 }),
    period: fc.constantFrom('AM' as const, 'PM' as const),
    timezone: fc.constantFrom(...VALID_TIMEZONES),
  }),

  // Hour outside 1–12
  fc.record({
    days: fc.subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 }),
    hour: fc.oneof(fc.integer({ min: 13, max: 100 }), fc.integer({ min: -100, max: 0 })),
    minute: fc.integer({ min: 0, max: 59 }),
    period: fc.constantFrom('AM' as const, 'PM' as const),
    timezone: fc.constantFrom(...VALID_TIMEZONES),
  }),

  // Minute outside 0–59
  fc.record({
    days: fc.subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 }),
    hour: fc.integer({ min: 1, max: 12 }),
    minute: fc.oneof(fc.integer({ min: 60, max: 200 }), fc.integer({ min: -200, max: -1 })),
    period: fc.constantFrom('AM' as const, 'PM' as const),
    timezone: fc.constantFrom(...VALID_TIMEZONES),
  }),

  // Invalid AM/PM value
  fc.record({
    days: fc.subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 }),
    hour: fc.integer({ min: 1, max: 12 }),
    minute: fc.integer({ min: 0, max: 59 }),
    period: fc.constantFrom('am', 'pm', 'noon', '', 'XM') as fc.Arbitrary<'AM' | 'PM'>,
    timezone: fc.constantFrom(...VALID_TIMEZONES),
  }),

  // Invalid timezone string
  fc.record({
    days: fc.subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 }),
    hour: fc.integer({ min: 1, max: 12 }),
    minute: fc.integer({ min: 0, max: 59 }),
    period: fc.constantFrom('AM' as const, 'PM' as const),
    timezone: fc.constantFrom('Invalid/Zone', 'Fake/City', 'NotATimezone', '', 'GMT+99'),
  }),
);

describe('Property 17: Invalid schedule rejection', () => {
  it('validateSchedule returns errors for any invalid schedule', () => {
    fc.assert(
      fc.property(arbitraryInvalidSchedule, (schedule) => {
        const result = validateSchedule(schedule);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });
});
