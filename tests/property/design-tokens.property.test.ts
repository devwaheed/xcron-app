// Feature: design-system-branding, Property 1: Token name round-trip
// Feature: design-system-branding, Property 2: Token sets structural parity
// Feature: design-system-branding, Property 3: Token-to-CSS property generation

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseTokenName,
  formatTokenName,
  lightTokens,
  darkTokens,
  tokensToCssProperties,
  type TokenSet,
} from '@/lib/design-tokens';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all leaf key paths from a nested object. */
function getLeafPaths(obj: unknown, prefix: string[] = []): string[][] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj === 'string' || typeof obj === 'number') return [prefix];
  if (Array.isArray(obj)) {
    // Tuples like fontSizes entries are leaf values (they produce 2 CSS props each)
    return [prefix];
  }
  if (typeof obj === 'object') {
    const paths: string[][] = [];
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      paths.push(...getLeafPaths(value, [...prefix, key]));
    }
    return paths;
  }
  return [prefix];
}

/** Count the total number of CSS custom properties a TokenSet should produce. */
function countCssProperties(tokens: TokenSet): number {
  let count = 0;

  function walk(obj: unknown): void {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'string' || typeof obj === 'number') {
      count += 1;
      return;
    }
    if (Array.isArray(obj)) {
      // fontSize tuples produce 2 properties: the size and the line-height
      count += 2;
      return;
    }
    if (typeof obj === 'object') {
      for (const value of Object.values(obj as Record<string, unknown>)) {
        walk(value);
      }
    }
  }

  for (const value of Object.values(tokens)) {
    walk(value);
  }

  return count;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Known CSS prefixes that map to token categories. */
const validPrefixes = ['color', 'spacing', 'typography', 'radius', 'shadow'] as const;

/** Generate a valid token name string like "color-primary-500" or "spacing-4". */
const arbitraryTokenName: fc.Arbitrary<string> = fc
  .record({
    prefix: fc.constantFrom(...validPrefixes),
    pathSegments: fc.array(
      fc.stringMatching(/^[a-zA-Z0-9]+$/).filter((s) => s.length > 0 && s.length <= 12),
      { minLength: 0, maxLength: 4 },
    ),
  })
  .map(({ prefix, pathSegments }) =>
    pathSegments.length === 0 ? prefix : `${prefix}-${pathSegments.join('-')}`,
  );

// ---------------------------------------------------------------------------
// Property 1: Token name round-trip
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 1.5
 *
 * For any valid token name string, calling parseTokenName then formatTokenName
 * on the result should produce the original token name string.
 */
describe('Property 1: Token name round-trip', () => {
  it('parseTokenName then formatTokenName produces the original string', () => {
    fc.assert(
      fc.property(arbitraryTokenName, (name) => {
        const parsed = parseTokenName(name);
        const formatted = formatTokenName(parsed);
        expect(formatted).toBe(name);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Token sets structural parity
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 1.1, 1.4
 *
 * Every key path in lightTokens exists in darkTokens and vice versa.
 * Both token sets contain all required categories with all expected sub-keys.
 */
describe('Property 2: Token sets structural parity', () => {
  const lightPaths = getLeafPaths(lightTokens).map((p) => p.join('.'));
  const darkPaths = getLeafPaths(darkTokens).map((p) => p.join('.'));

  it('every key path in lightTokens exists in darkTokens', () => {
    fc.assert(
      fc.property(fc.constantFrom(...lightPaths), (path) => {
        expect(darkPaths).toContain(path);
      }),
      { numRuns: Math.min(lightPaths.length, 100) },
    );
  });

  it('every key path in darkTokens exists in lightTokens', () => {
    fc.assert(
      fc.property(fc.constantFrom(...darkPaths), (path) => {
        expect(lightPaths).toContain(path);
      }),
      { numRuns: Math.min(darkPaths.length, 100) },
    );
  });

  it('both token sets have identical key path sets', () => {
    const lightSet = new Set(lightPaths);
    const darkSet = new Set(darkPaths);
    expect(lightSet).toEqual(darkSet);
  });
});

// ---------------------------------------------------------------------------
// Property 3: Token-to-CSS property generation
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 1.2
 *
 * For any TokenSet, tokensToCssProperties output keys all start with "--",
 * values are non-empty, and count equals the number of leaf values.
 */
describe('Property 3: Token-to-CSS property generation', () => {
  const tokenSets: [string, TokenSet][] = [
    ['lightTokens', lightTokens],
    ['darkTokens', darkTokens],
  ];

  it('all generated CSS property keys start with "--"', () => {
    fc.assert(
      fc.property(fc.constantFrom(...tokenSets), ([_label, tokens]) => {
        const props = tokensToCssProperties(tokens);
        for (const key of Object.keys(props)) {
          expect(key.startsWith('--')).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('all generated CSS property values are non-empty strings', () => {
    fc.assert(
      fc.property(fc.constantFrom(...tokenSets), ([_label, tokens]) => {
        const props = tokensToCssProperties(tokens);
        for (const [key, value] of Object.entries(props)) {
          expect(typeof value).toBe('string');
          expect(value.length, `value for ${key} should be non-empty`).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('count of generated properties equals the number of leaf values', () => {
    fc.assert(
      fc.property(fc.constantFrom(...tokenSets), ([label, tokens]) => {
        const props = tokensToCssProperties(tokens);
        const expectedCount = countCssProperties(tokens);
        expect(Object.keys(props).length).toBe(expectedCount);
      }),
      { numRuns: 100 },
    );
  });
});
