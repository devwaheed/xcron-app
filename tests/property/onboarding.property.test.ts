// Feature: design-system-branding, Property 11: Onboarding templates validity
// Feature: design-system-branding, Property 12: Onboarding completion persistence round-trip

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  ACTION_TEMPLATES,
  isOnboardingComplete,
  markOnboardingComplete,
} from '@/components/OnboardingFlow';

// ---------------------------------------------------------------------------
// Property 11: Onboarding templates validity
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 7.2
 *
 * For every template in ACTION_TEMPLATES, the template should have a
 * non-empty name, non-empty description, non-empty scriptContent, and a
 * schedule with at least one day selected, hour between 1-12, minute
 * between 0-59, and a valid period ("AM" or "PM").
 */
describe('Property 11: Onboarding templates validity', () => {
  /** Arbitrary index into the ACTION_TEMPLATES array. */
  const arbitraryTemplateIndex = fc.integer({
    min: 0,
    max: ACTION_TEMPLATES.length - 1,
  });

  it('every template has non-empty name, description, and scriptContent', () => {
    fc.assert(
      fc.property(arbitraryTemplateIndex, (index) => {
        const template = ACTION_TEMPLATES[index];
        expect(template.name.trim().length).toBeGreaterThan(0);
        expect(template.description.trim().length).toBeGreaterThan(0);
        expect(template.scriptContent.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('every template has a valid schedule', () => {
    fc.assert(
      fc.property(arbitraryTemplateIndex, (index) => {
        const { schedule } = ACTION_TEMPLATES[index];

        // At least one day selected
        expect(schedule.days.length).toBeGreaterThan(0);

        // Hour between 1 and 12
        expect(schedule.hour).toBeGreaterThanOrEqual(1);
        expect(schedule.hour).toBeLessThanOrEqual(12);

        // Minute between 0 and 59
        expect(schedule.minute).toBeGreaterThanOrEqual(0);
        expect(schedule.minute).toBeLessThanOrEqual(59);

        // Valid period
        expect(['AM', 'PM']).toContain(schedule.period);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: Onboarding completion persistence round-trip
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 7.4
 *
 * After calling markOnboardingComplete(), calling isOnboardingComplete()
 * should return true.
 */
describe('Property 12: Onboarding completion persistence round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('after markOnboardingComplete(), isOnboardingComplete() returns true', () => {
    fc.assert(
      fc.property(fc.boolean(), () => {
        // Start from a clean state each iteration
        localStorage.clear();

        // Before marking, should not be complete
        expect(isOnboardingComplete()).toBe(false);

        // Mark complete
        markOnboardingComplete();

        // After marking, should be complete
        expect(isOnboardingComplete()).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
