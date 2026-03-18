// Feature: design-system-branding, Property 14: Button variant and size rendering
// Feature: design-system-branding, Property 15: Input error display
// Feature: design-system-branding, Property 16: Component rendering idempotence

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import React from 'react';
import { Button, Input, Select, Badge, Card } from '@/components/ui';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const arbVariant = fc.constantFrom('primary' as const, 'secondary' as const, 'ghost' as const, 'danger' as const);
const arbSize = fc.constantFrom('sm' as const, 'md' as const, 'lg' as const);
const arbBoolean = fc.boolean();

/** Non-empty trimmed string for error messages. */
const arbNonEmptyError = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/** Empty or undefined error values. */
const arbEmptyError = fc.constantFrom(undefined, '', '   ');

// ---------------------------------------------------------------------------
// Property 14: Button variant and size rendering
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 10.3
 *
 * For any combination of Button variant, size, loading, and disabled,
 * the Button component should render without error and produce a <button>
 * element with the correct disabled attribute.
 */
describe('Property 14: Button variant and size rendering', () => {
  it('all variant/size/loading/disabled combos render without error and have correct disabled attribute', () => {
    fc.assert(
      fc.property(arbVariant, arbSize, arbBoolean, arbBoolean, (variant, size, loading, disabled) => {
        const { container } = render(
          React.createElement(Button, { variant, size, loading, disabled }, 'Test'),
        );
        const button = container.querySelector('button');
        expect(button).not.toBeNull();

        const shouldBeDisabled = disabled || loading;
        if (shouldBeDisabled) {
          expect(button!.disabled).toBe(true);
        } else {
          expect(button!.disabled).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15: Input error display
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 10.5
 *
 * For any non-empty error string, the Input component should render the error
 * text visible in its output. For any empty or undefined error, no error
 * message element should be present.
 */
describe('Property 15: Input error display', () => {
  it('non-empty error string renders error text with role="alert"', () => {
    fc.assert(
      fc.property(arbNonEmptyError, (error) => {
        const { container } = render(
          React.createElement(Input, { error, label: 'Field' }),
        );
        const alertEl = container.querySelector('[role="alert"]');
        expect(alertEl).not.toBeNull();
        expect(alertEl!.textContent).toBe(error.trim());
      }),
      { numRuns: 100 },
    );
  });

  it('empty or undefined error renders no error element', () => {
    fc.assert(
      fc.property(arbEmptyError, (error) => {
        const { container } = render(
          React.createElement(Input, { error, label: 'Field' }),
        );
        const alertEl = container.querySelector('[role="alert"]');
        expect(alertEl).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: Component rendering idempotence
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 10.6
 *
 * For any component in the library (Button, Input, Select, Badge, Card) and
 * any valid set of props, rendering the component twice with the same props
 * should produce identical DOM output.
 */
describe('Property 16: Component rendering idempotence', () => {
  it('Button produces identical DOM on re-render with same props', () => {
    fc.assert(
      fc.property(arbVariant, arbSize, arbBoolean, arbBoolean, (variant, size, loading, disabled) => {
        const props = { variant, size, loading, disabled, children: 'Click' };
        const first = render(React.createElement(Button, props));
        const firstHTML = first.container.innerHTML;
        first.unmount();

        const second = render(React.createElement(Button, props));
        const secondHTML = second.container.innerHTML;
        second.unmount();

        expect(firstHTML).toBe(secondHTML);
      }),
      { numRuns: 100 },
    );
  });

  it('Input produces identical DOM on re-render with same props', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(undefined, 'Email', 'Name'),
        fc.constantFrom(undefined, '', 'Required'),
        (label, error) => {
          const props = { label, error, placeholder: 'Enter value' };
          const first = render(React.createElement(Input, props));
          const firstHTML = first.container.innerHTML;
          first.unmount();

          const second = render(React.createElement(Input, props));
          const secondHTML = second.container.innerHTML;
          second.unmount();

          expect(firstHTML).toBe(secondHTML);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Select produces identical DOM on re-render with same props', () => {
    const fixedOptions = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ];
    fc.assert(
      fc.property(
        fc.constantFrom(undefined, 'Pick one'),
        fc.constantFrom(undefined, '', 'Required'),
        (label, error) => {
          const props = { options: fixedOptions, label, error };
          const first = render(React.createElement(Select, props));
          const firstHTML = first.container.innerHTML;
          first.unmount();

          const second = render(React.createElement(Select, props));
          const secondHTML = second.container.innerHTML;
          second.unmount();

          expect(firstHTML).toBe(secondHTML);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Badge produces identical DOM on re-render with same props', () => {
    const arbBadgeVariant = fc.constantFrom(
      'success' as const,
      'warning' as const,
      'error' as const,
      'neutral' as const,
    );
    fc.assert(
      fc.property(arbBadgeVariant, (variant) => {
        const props = { variant, children: 'Status' };
        const first = render(React.createElement(Badge, props));
        const firstHTML = first.container.innerHTML;
        first.unmount();

        const second = render(React.createElement(Badge, props));
        const secondHTML = second.container.innerHTML;
        second.unmount();

        expect(firstHTML).toBe(secondHTML);
      }),
      { numRuns: 100 },
    );
  });

  it('Card produces identical DOM on re-render with same props', () => {
    const arbPadding = fc.constantFrom('sm' as const, 'md' as const, 'lg' as const);
    fc.assert(
      fc.property(arbPadding, (padding) => {
        const props = { padding, children: 'Content' };
        const first = render(React.createElement(Card, props));
        const firstHTML = first.container.innerHTML;
        first.unmount();

        const second = render(React.createElement(Card, props));
        const secondHTML = second.container.innerHTML;
        second.unmount();

        expect(firstHTML).toBe(secondHTML);
      }),
      { numRuns: 100 },
    );
  });
});
