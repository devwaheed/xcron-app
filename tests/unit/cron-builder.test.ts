import { describe, it, expect } from 'vitest';
import { buildCron, parseCron } from '@/lib/cron-builder';
import type { Schedule } from '@/types';

describe('buildCron', () => {
  it('converts a simple UTC schedule (no offset)', () => {
    const schedule: Schedule = {
      days: [1, 3, 5], // Mon, Wed, Fri
      hour: 9,
      minute: 30,
      period: 'AM',
      timezone: 'UTC',
    };
    expect(buildCron(schedule)).toBe('30 9 * * 1,3,5');
  });

  it('converts EST (UTC-5) morning time to UTC', () => {
    const schedule: Schedule = {
      days: [1], // Monday
      hour: 9,
      minute: 0,
      period: 'AM',
      timezone: 'America/New_York',
    };
    // 9 AM EST = 2 PM UTC (in January, EST = UTC-5)
    expect(buildCron(schedule)).toBe('0 14 * * 1');
  });

  it('handles day shift forward when converting late night to UTC', () => {
    const schedule: Schedule = {
      days: [1], // Monday
      hour: 11,
      minute: 0,
      period: 'PM',
      timezone: 'America/New_York',
    };
    // 11 PM EST = 4 AM UTC next day (Tuesday)
    expect(buildCron(schedule)).toBe('0 4 * * 2');
  });

  it('handles day wrap from Saturday to Sunday', () => {
    const schedule: Schedule = {
      days: [6], // Saturday
      hour: 11,
      minute: 30,
      period: 'PM',
      timezone: 'America/New_York',
    };
    // 11:30 PM EST Saturday = 4:30 AM UTC Sunday
    expect(buildCron(schedule)).toBe('30 4 * * 0');
  });

  it('handles noon correctly', () => {
    const schedule: Schedule = {
      days: [0, 6], // Sun, Sat
      hour: 12,
      minute: 0,
      period: 'PM',
      timezone: 'UTC',
    };
    expect(buildCron(schedule)).toBe('0 12 * * 0,6');
  });

  it('handles midnight correctly', () => {
    const schedule: Schedule = {
      days: [2], // Tuesday
      hour: 12,
      minute: 0,
      period: 'AM',
      timezone: 'UTC',
    };
    // 12 AM = 0:00
    expect(buildCron(schedule)).toBe('0 0 * * 2');
  });

  it('handles positive UTC offset (Asia/Tokyo UTC+9)', () => {
    const schedule: Schedule = {
      days: [1], // Monday
      hour: 3,
      minute: 0,
      period: 'AM',
      timezone: 'Asia/Tokyo',
    };
    // 3 AM JST Monday = 6 PM UTC Sunday (JST = UTC+9)
    expect(buildCron(schedule)).toBe('0 18 * * 0');
  });

  it('handles all days selected', () => {
    const schedule: Schedule = {
      days: [0, 1, 2, 3, 4, 5, 6],
      hour: 8,
      minute: 15,
      period: 'AM',
      timezone: 'UTC',
    };
    expect(buildCron(schedule)).toBe('15 8 * * 0,1,2,3,4,5,6');
  });
});

describe('parseCron', () => {
  it('parses a simple UTC cron back to schedule', () => {
    const schedule = parseCron('30 9 * * 1,3,5', 'UTC');
    expect(schedule).toEqual({
      days: [1, 3, 5],
      hour: 9,
      minute: 30,
      period: 'AM',
      timezone: 'UTC',
    });
  });

  it('parses UTC cron back to EST schedule', () => {
    // 0 14 * * 1 in UTC = 9 AM EST Monday
    const schedule = parseCron('0 14 * * 1', 'America/New_York');
    expect(schedule).toEqual({
      days: [1],
      hour: 9,
      minute: 0,
      period: 'AM',
      timezone: 'America/New_York',
    });
  });

  it('handles day shift backward when parsing', () => {
    // 0 4 * * 2 in UTC = 11 PM EST Monday
    const schedule = parseCron('0 4 * * 2', 'America/New_York');
    expect(schedule).toEqual({
      days: [1],
      hour: 11,
      minute: 0,
      period: 'PM',
      timezone: 'America/New_York',
    });
  });

  it('parses midnight UTC correctly', () => {
    const schedule = parseCron('0 0 * * 2', 'UTC');
    expect(schedule).toEqual({
      days: [2],
      hour: 12,
      minute: 0,
      period: 'AM',
      timezone: 'UTC',
    });
  });

  it('parses noon UTC correctly', () => {
    const schedule = parseCron('0 12 * * 0,6', 'UTC');
    expect(schedule).toEqual({
      days: [0, 6],
      hour: 12,
      minute: 0,
      period: 'PM',
      timezone: 'UTC',
    });
  });

  it('throws on invalid cron format', () => {
    expect(() => parseCron('invalid', 'UTC')).toThrow('Invalid cron expression');
  });
});

describe('buildCron + parseCron round-trip', () => {
  it('round-trips a UTC schedule', () => {
    const original: Schedule = {
      days: [1, 3, 5],
      hour: 9,
      minute: 30,
      period: 'AM',
      timezone: 'UTC',
    };
    const cron = buildCron(original);
    const parsed = parseCron(cron, 'UTC');
    expect(parsed).toEqual(original);
  });

  it('round-trips an EST schedule', () => {
    const original: Schedule = {
      days: [1],
      hour: 9,
      minute: 0,
      period: 'AM',
      timezone: 'America/New_York',
    };
    const cron = buildCron(original);
    const parsed = parseCron(cron, 'America/New_York');
    expect(parsed).toEqual(original);
  });

  it('round-trips a schedule with day boundary crossing', () => {
    const original: Schedule = {
      days: [6],
      hour: 11,
      minute: 30,
      period: 'PM',
      timezone: 'America/New_York',
    };
    const cron = buildCron(original);
    const parsed = parseCron(cron, 'America/New_York');
    expect(parsed).toEqual(original);
  });
});
