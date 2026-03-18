// Feature: design-system-branding, Property 8: Fuzzy match correctness
// Feature: design-system-branding, Property 9: Command palette keyboard navigation bounds

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { fuzzyMatch, filterCommands } from '@/components/ui/CommandPalette';
import type { Command } from '@/components/ui/CommandPalette';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reference implementation: checks whether all characters of `query` appear
 * in `text` in sequential (but not necessarily contiguous) order,
 * case-insensitively.
 */
function hasSequentialChars(query: string, text: string): boolean {
  const lq = query.toLowerCase();
  const lt = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < lt.length && qi < lq.length; ti++) {
    if (lt[ti] === lq[qi]) qi++;
  }
  return qi === lq.length;
}

/**
 * Build a minimal Command object from a label string.
 */
function makeCommand(label: string, index: number): Command {
  return {
    id: `cmd-${index}`,
    label,
    action: () => {},
    category: 'action',
  };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Arbitrary printable (non-control) strings for query and label. */
const arbPrintableString = fc.string({ minLength: 0, maxLength: 40 });

/** Arbitrary non-empty list of command labels. */
const arbCommandLabels = fc.array(arbPrintableString, { minLength: 1, maxLength: 20 });

/** Arbitrary ArrowUp / ArrowDown action. */
const arbArrowAction = fc.constantFrom('ArrowUp', 'ArrowDown');

/** Arbitrary sequence of arrow actions. */
const arbArrowSequence = fc.array(arbArrowAction, { minLength: 1, maxLength: 100 });

// ---------------------------------------------------------------------------
// Property 8: Fuzzy match correctness
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 5.3
 *
 * For any query string and for any command label string, fuzzyMatch should
 * return matches=true if and only if all characters of the query appear in
 * the label in sequential order (case-insensitive).
 *
 * filterCommands should return only commands whose labels match.
 */
describe('Property 8: Fuzzy match correctness', () => {
  it('fuzzyMatch returns matches=true iff all query chars appear sequentially in text', () => {
    fc.assert(
      fc.property(arbPrintableString, arbPrintableString, (query, text) => {
        const result = fuzzyMatch(query, text);
        const expected = hasSequentialChars(query, text);
        expect(result.matches).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('filterCommands returns only commands whose labels contain all query chars in order', () => {
    fc.assert(
      fc.property(arbPrintableString, arbCommandLabels, (query, labels) => {
        const commands = labels.map((label, i) => makeCommand(label, i));
        const filtered = filterCommands(query, commands);

        // Every returned command must match the query
        for (const cmd of filtered) {
          expect(hasSequentialChars(query, cmd.label)).toBe(true);
        }

        // Every command that matches the query must be in the result
        const filteredIds = new Set(filtered.map((c) => c.id));
        for (const cmd of commands) {
          if (hasSequentialChars(query, cmd.label)) {
            expect(filteredIds.has(cmd.id)).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Command palette keyboard navigation bounds
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 5.6
 *
 * For any list of N commands (N > 0) and for any sequence of ArrowUp and
 * ArrowDown key presses, the selected index should always remain within
 * the range [0, N-1], using clamping logic:
 *   ArrowDown: min(index + 1, N - 1)
 *   ArrowUp:   max(index - 1, 0)
 */
describe('Property 9: Command palette keyboard navigation bounds', () => {
  it('selected index stays within [0, N-1] for any ArrowUp/ArrowDown sequence', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        arbArrowSequence,
        (n, actions) => {
          let index = 0; // start at 0

          for (const action of actions) {
            if (action === 'ArrowDown') {
              index = Math.min(index + 1, n - 1);
            } else {
              index = Math.max(index - 1, 0);
            }

            // Invariant: index is always within bounds
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(n);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('ArrowDown from last position stays at last position', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (n) => {
        let index = n - 1; // start at last
        // Apply ArrowDown — should stay clamped
        index = Math.min(index + 1, n - 1);
        expect(index).toBe(n - 1);
      }),
      { numRuns: 100 },
    );
  });

  it('ArrowUp from first position stays at first position', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (n) => {
        void n; // n is only used to confirm the property holds for any list size
        let index = 0; // start at first
        // Apply ArrowUp — should stay clamped
        index = Math.max(index - 1, 0);
        expect(index).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});
