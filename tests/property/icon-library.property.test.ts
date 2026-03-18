// Feature: design-system-branding, Property 4: Icon rendering consistency
// Feature: design-system-branding, Property 5: Icon accessibility attributes

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import React from 'react';
import {
  ClockIcon,
  CalendarIcon,
  PlayIcon,
  PauseIcon,
  BoltIcon,
  CodeIcon,
  ShieldIcon,
  ChartIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CheckIcon,
  XCloseIcon,
  SearchIcon,
  CommandIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  UploadIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  type IconProps,
} from '@/components/icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type IconComponent = (props: IconProps) => React.ReactElement;

const allIcons: [string, IconComponent][] = [
  ['ClockIcon', ClockIcon],
  ['CalendarIcon', CalendarIcon],
  ['PlayIcon', PlayIcon],
  ['PauseIcon', PauseIcon],
  ['BoltIcon', BoltIcon],
  ['CodeIcon', CodeIcon],
  ['ShieldIcon', ShieldIcon],
  ['ChartIcon', ChartIcon],
  ['PlusIcon', PlusIcon],
  ['EditIcon', EditIcon],
  ['TrashIcon', TrashIcon],
  ['ChevronRightIcon', ChevronRightIcon],
  ['ChevronDownIcon', ChevronDownIcon],
  ['CheckIcon', CheckIcon],
  ['XCloseIcon', XCloseIcon],
  ['SearchIcon', SearchIcon],
  ['CommandIcon', CommandIcon],
  ['SettingsIcon', SettingsIcon],
  ['SunIcon', SunIcon],
  ['MoonIcon', MoonIcon],
  ['UploadIcon', UploadIcon],
  ['ExternalLinkIcon', ExternalLinkIcon],
  ['AlertTriangleIcon', AlertTriangleIcon],
];

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Arbitrary icon component picked from the full set. */
const arbIcon = fc.constantFrom(...allIcons);

/** Arbitrary positive size (1–200). */
const arbSize = fc.integer({ min: 1, max: 200 });

/** Arbitrary non-empty CSS color string. */
const arbColor = fc.oneof(
  fc.constant('currentColor'),
  fc.constant('red'),
  fc.constant('#ff0000'),
  fc.constant('rgb(0, 128, 255)'),
  fc.stringMatching(/^#[0-9a-f]{6}$/),
);

/** Arbitrary non-empty accessible label string. */
const arbLabel = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

// ---------------------------------------------------------------------------
// Property 4: Icon rendering consistency
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 2.2, 2.5
 *
 * For any icon, size, and color, the rendered SVG element should have
 * width and height equal to size, viewBox equal to "0 0 24 24", and
 * stroke equal to color.
 */
describe('Property 4: Icon rendering consistency', () => {
  it('SVG has correct width, height, viewBox, and stroke for any icon/size/color', () => {
    fc.assert(
      fc.property(arbIcon, arbSize, arbColor, ([name, Icon], size, color) => {
        const { container } = render(React.createElement(Icon, { size, color }));
        const svg = container.querySelector('svg')!;

        expect(svg, `${name} should render an SVG`).toBeTruthy();
        expect(svg.getAttribute('width')).toBe(String(size));
        expect(svg.getAttribute('height')).toBe(String(size));
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(svg.getAttribute('stroke')).toBe(color);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Icon accessibility attributes
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 2.3, 2.4
 *
 * Without accessibleLabel → aria-hidden="true".
 * With a non-empty accessibleLabel → role="img" + aria-label, no aria-hidden.
 */
describe('Property 5: Icon accessibility attributes', () => {
  it('without accessibleLabel, SVG has aria-hidden="true"', () => {
    fc.assert(
      fc.property(arbIcon, ([name, Icon]) => {
        const { container } = render(React.createElement(Icon, {}));
        const svg = container.querySelector('svg')!;

        expect(svg, `${name} should render an SVG`).toBeTruthy();
        expect(svg.getAttribute('aria-hidden')).toBe('true');
        expect(svg.getAttribute('role')).toBeNull();
        expect(svg.getAttribute('aria-label')).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it('with accessibleLabel, SVG has role="img" and aria-label, no aria-hidden', () => {
    fc.assert(
      fc.property(arbIcon, arbLabel, ([name, Icon], label) => {
        const { container } = render(
          React.createElement(Icon, { accessibleLabel: label }),
        );
        const svg = container.querySelector('svg')!;

        expect(svg, `${name} should render an SVG`).toBeTruthy();
        expect(svg.getAttribute('role')).toBe('img');
        expect(svg.getAttribute('aria-label')).toBe(label);
        expect(svg.getAttribute('aria-hidden')).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});
