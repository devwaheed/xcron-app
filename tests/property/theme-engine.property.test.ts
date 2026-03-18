// Feature: design-system-branding, Property 6: Theme persistence round-trip
// Feature: design-system-branding, Property 7: Theme mode round-trip

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  resolveTheme,
  persistTheme,
  getPersistedTheme,
  type ThemeMode,
} from '@/lib/theme';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Arbitrary valid ThemeMode value. */
const arbitraryThemeMode: fc.Arbitrary<ThemeMode> = fc.constantFrom(
  'light' as const,
  'dark' as const,
  'system' as const,
);

/** Arbitrary boolean representing system dark-mode preference. */
const arbitrarySystemPrefersDark: fc.Arbitrary<boolean> = fc.boolean();

// ---------------------------------------------------------------------------
// Property 6: Theme persistence round-trip
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 4.2
 *
 * For any valid ThemeMode value ("light", "dark", or "system"),
 * calling persistTheme(mode) then getPersistedTheme() should return
 * the original mode value.
 */
describe('Property 6: Theme persistence round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persistTheme(mode) then getPersistedTheme() returns the original mode', () => {
    fc.assert(
      fc.property(arbitraryThemeMode, (mode) => {
        persistTheme(mode);
        expect(getPersistedTheme()).toBe(mode);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Theme mode round-trip (light → dark → light)
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 4.7
 *
 * For any systemPrefersDark boolean, resolving "light" then "dark" then
 * "light" again should produce a result identical to the initial light
 * resolution.
 */
describe('Property 7: Theme mode round-trip', () => {
  it('resolveTheme("light", x) → resolveTheme("dark", x) → resolveTheme("light", x) equals initial', () => {
    fc.assert(
      fc.property(arbitrarySystemPrefersDark, (systemPrefersDark) => {
        const initial = resolveTheme('light', systemPrefersDark);
        resolveTheme('dark', systemPrefersDark); // intermediate step
        const final_ = resolveTheme('light', systemPrefersDark);
        expect(final_).toBe(initial);
      }),
      { numRuns: 100 },
    );
  });
});
