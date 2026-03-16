import { describe, it, expect } from 'vitest';
import { validateSchedule } from '@/lib/schedule-validator';
import type { Schedule } from '@/types';

function validSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    days: [1, 3, 5],
    hour: 9,
    minute: 30,
    period: 'AM',
    timezone: 'America/New_York',
    ...overrides,
  };
}

describe('validateSchedule', () => {
  it('accepts a valid schedule', () => {
    const result = validateSchedule(validSchedule());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts boundary values (hour=1, minute=0)', () => {
    const result = validateSchedule(validSchedule({ hour: 1, minute: 0 }));
    expect(result.valid).toBe(true);
  });

  it('accepts boundary values (hour=12, minute=59)', () => {
    const result = validateSchedule(validSchedule({ hour: 12, minute: 59 }));
    expect(result.valid).toBe(true);
  });

  it('accepts a single day', () => {
    const result = validateSchedule(validSchedule({ days: [0] }));
    expect(result.valid).toBe(true);
  });

  it('accepts all seven days', () => {
    const result = validateSchedule(validSchedule({ days: [0, 1, 2, 3, 4, 5, 6] }));
    expect(result.valid).toBe(true);
  });

  // --- Days validation ---

  it('rejects empty days array', () => {
    const result = validateSchedule(validSchedule({ days: [] }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one day must be selected');
  });

  it('rejects day value below 0', () => {
    const result = validateSchedule(validSchedule({ days: [-1] }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Each day must be an integer between 0 (Sunday) and 6 (Saturday)');
  });

  it('rejects day value above 6', () => {
    const result = validateSchedule(validSchedule({ days: [7] }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Each day must be an integer between 0 (Sunday) and 6 (Saturday)');
  });

  it('rejects non-integer day values', () => {
    const result = validateSchedule(validSchedule({ days: [1.5] }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Each day must be an integer between 0 (Sunday) and 6 (Saturday)');
  });

  // --- Hour validation ---

  it('rejects hour below 1', () => {
    const result = validateSchedule(validSchedule({ hour: 0 }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Hour must be between 1 and 12');
  });

  it('rejects hour above 12', () => {
    const result = validateSchedule(validSchedule({ hour: 13 }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Hour must be between 1 and 12');
  });

  // --- Minute validation ---

  it('rejects minute below 0', () => {
    const result = validateSchedule(validSchedule({ minute: -1 }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Minute must be between 0 and 59');
  });

  it('rejects minute above 59', () => {
    const result = validateSchedule(validSchedule({ minute: 60 }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Minute must be between 0 and 59');
  });

  // --- Period validation ---

  it('rejects invalid period', () => {
    const result = validateSchedule(validSchedule({ period: 'XM' as 'AM' | 'PM' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Period must be AM or PM');
  });

  // --- Timezone validation ---

  it('rejects invalid timezone string', () => {
    const result = validateSchedule(validSchedule({ timezone: 'Not/A_Timezone' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Timezone must be a valid IANA timezone');
  });

  it('rejects empty timezone string', () => {
    const result = validateSchedule(validSchedule({ timezone: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Timezone must be a valid IANA timezone');
  });

  // --- Multiple errors ---

  it('collects multiple errors at once', () => {
    const result = validateSchedule({
      days: [],
      hour: 0,
      minute: 60,
      period: 'XM' as 'AM' | 'PM',
      timezone: 'Invalid',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});
