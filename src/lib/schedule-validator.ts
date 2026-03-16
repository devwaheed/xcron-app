import type { Schedule } from '@/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Check whether a string is a valid IANA timezone.
 */
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a Schedule object, returning a list of errors if invalid.
 *
 * Rules:
 * - days must be a non-empty array of integers 0–6
 * - hour must be 1–12
 * - minute must be 0–59
 * - period must be 'AM' or 'PM'
 * - timezone must be a valid IANA timezone
 */
export function validateSchedule(schedule: Schedule): ValidationResult {
  const errors: string[] = [];

  // Days validation
  if (!Array.isArray(schedule.days) || schedule.days.length === 0) {
    errors.push('At least one day must be selected');
  } else {
    const invalidDays = schedule.days.filter(
      (d) => !Number.isInteger(d) || d < 0 || d > 6
    );
    if (invalidDays.length > 0) {
      errors.push('Each day must be an integer between 0 (Sunday) and 6 (Saturday)');
    }
  }

  // Hour validation
  if (!Number.isInteger(schedule.hour) || schedule.hour < 1 || schedule.hour > 12) {
    errors.push('Hour must be between 1 and 12');
  }

  // Minute validation
  if (!Number.isInteger(schedule.minute) || schedule.minute < 0 || schedule.minute > 59) {
    errors.push('Minute must be between 0 and 59');
  }

  // Period validation
  if (schedule.period !== 'AM' && schedule.period !== 'PM') {
    errors.push('Period must be AM or PM');
  }

  // Timezone validation
  if (typeof schedule.timezone !== 'string' || !isValidTimezone(schedule.timezone)) {
    errors.push('Timezone must be a valid IANA timezone');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
