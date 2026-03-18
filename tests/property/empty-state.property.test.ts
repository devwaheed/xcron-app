// Feature: design-system-branding, Property 13: Empty state rendering completeness

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import React from 'react';
import EmptyState from '@/components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Property 13: Empty state rendering completeness
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 8.3, 8.5
 *
 * For any valid EmptyStateProps (any illustration type, any non-empty heading
 * and description strings, and any optional action), the rendered output should
 * contain the heading text, the description text, and the illustration SVG
 * should have role="img" and a non-empty aria-label.
 */
describe('Property 13: Empty state rendering completeness', () => {
  const arbitraryIllustration = fc.constantFrom<'no-actions' | 'no-runs'>(
    'no-actions',
    'no-runs',
  );

  /** Non-empty, printable heading string. */
  const arbitraryHeading = fc
    .string({ minLength: 1, maxLength: 80 })
    .filter((s) => s.trim().length > 0);

  /** Non-empty, printable description string. */
  const arbitraryDescription = fc
    .string({ minLength: 1, maxLength: 200 })
    .filter((s) => s.trim().length > 0);

  /** Optional action with a non-empty label. */
  const arbitraryAction = fc.option(
    fc.record({
      label: fc
        .string({ minLength: 1, maxLength: 40 })
        .filter((s) => s.trim().length > 0),
      onClick: fc.constant(() => {}),
    }),
    { nil: undefined },
  );

  it('rendered output contains heading text, description text, and an accessible SVG illustration', () => {
    fc.assert(
      fc.property(
        arbitraryIllustration,
        arbitraryHeading,
        arbitraryDescription,
        arbitraryAction,
        (illustration, heading, description, action) => {
          const { container, unmount } = render(
            React.createElement(EmptyState, {
              illustration,
              heading,
              description,
              action,
            }),
          );

          // Heading text is present
          expect(container.textContent).toContain(heading);

          // Description text is present
          expect(container.textContent).toContain(description);

          // Illustration SVG has role="img"
          const svg = container.querySelector('svg[role="img"]');
          expect(svg).not.toBeNull();

          // Illustration SVG has a non-empty aria-label
          const ariaLabel = svg!.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel!.trim().length).toBeGreaterThan(0);

          // Clean up to avoid DOM leaks across iterations
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
