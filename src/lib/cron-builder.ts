import type { Schedule } from '@/types';

/**
 * Get the UTC offset in minutes for a given IANA timezone.
 * Uses a reference date (2024-01-15) to get a consistent offset.
 * Returns the offset such that: UTC = local + offset
 * (e.g., EST is UTC-5, so offset = 300)
 */
function getTimezoneOffsetMinutes(timezone: string): number {
  // Use a fixed reference date to avoid DST ambiguity in the builder itself.
  // The admin picks a time in their timezone; we convert that to UTC using
  // the offset at a stable reference point.
  const refDate = new Date('2024-01-15T12:00:00Z');

  const utcStr = refDate.toLocaleString('en-US', { timeZone: 'UTC' });
  const localStr = refDate.toLocaleString('en-US', { timeZone: timezone });

  const utcTime = new Date(utcStr).getTime();
  const localTime = new Date(localStr).getTime();

  // offset in minutes: positive means local is behind UTC (e.g., America/New_York = +300)
  return (utcTime - localTime) / 60000;
}

/**
 * Convert 12-hour time to 24-hour time.
 */
function to24Hour(hour: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') {
    return hour === 12 ? 0 : hour;
  }
  return hour === 12 ? 12 : hour + 12;
}

/**
 * Convert 24-hour time to 12-hour time with AM/PM.
 */
function to12Hour(hour24: number): { hour: number; period: 'AM' | 'PM' } {
  if (hour24 === 0) return { hour: 12, period: 'AM' };
  if (hour24 < 12) return { hour: hour24, period: 'AM' };
  if (hour24 === 12) return { hour: 12, period: 'PM' };
  return { hour: hour24 - 12, period: 'PM' };
}

/**
 * Build a UTC cron expression from a local Schedule.
 *
 * Cron format: `minute hour * * days`
 * GitHub Actions cron uses UTC, so we convert local time + timezone to UTC.
 * If the conversion shifts the time across midnight, the days shift accordingly.
 */
export function buildCron(schedule: Schedule): string {
  const { days, hour, minute, period, timezone } = schedule;

  const hour24 = to24Hour(hour, period);
  const offsetMinutes = getTimezoneOffsetMinutes(timezone);

  // Convert local time to UTC
  let utcTotalMinutes = hour24 * 60 + minute + offsetMinutes;
  let dayShift = 0;

  if (utcTotalMinutes >= 1440) {
    utcTotalMinutes -= 1440;
    dayShift = 1; // moved to next day
  } else if (utcTotalMinutes < 0) {
    utcTotalMinutes += 1440;
    dayShift = -1; // moved to previous day
  }

  const utcHour = Math.floor(utcTotalMinutes / 60);
  const utcMinute = utcTotalMinutes % 60;

  // Shift days if needed (wrap around 0-6)
  const utcDays = days
    .map((d) => ((d + dayShift) % 7 + 7) % 7)
    .sort((a, b) => a - b);

  return `${utcMinute} ${utcHour} * * ${utcDays.join(',')}`;
}

/**
 * Parse a UTC cron expression back into a local Schedule for the given timezone.
 *
 * Expects format: `minute hour * * days`
 */
export function parseCron(cron: string, timezone: string): Schedule {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: expected 5 fields, got ${parts.length}`);
  }

  const [minuteStr, hourStr, , , daysStr] = parts;
  const utcMinute = parseInt(minuteStr, 10);
  const utcHour = parseInt(hourStr, 10);
  const utcDays = daysStr.split(',').map((d) => parseInt(d, 10));

  const offsetMinutes = getTimezoneOffsetMinutes(timezone);

  // Convert UTC time to local time
  let localTotalMinutes = utcHour * 60 + utcMinute - offsetMinutes;
  let dayShift = 0;

  if (localTotalMinutes >= 1440) {
    localTotalMinutes -= 1440;
    dayShift = 1;
  } else if (localTotalMinutes < 0) {
    localTotalMinutes += 1440;
    dayShift = -1;
  }

  const localHour24 = Math.floor(localTotalMinutes / 60);
  const localMinute = localTotalMinutes % 60;
  const { hour, period } = to12Hour(localHour24);

  const localDays = utcDays
    .map((d) => ((d + dayShift) % 7 + 7) % 7)
    .sort((a, b) => a - b);

  return {
    days: localDays,
    hour,
    minute: localMinute,
    period,
    timezone,
  };
}
