// Feature: design-system-branding, Property 10: Editable element shortcut suppression

import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { isEditableElement } from '@/lib/shortcuts';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Tag names that isEditableElement should recognise as editable. */
const EDITABLE_TAG_NAMES = ['input', 'textarea', 'select'] as const;

/** Tag names that are NOT editable (no contenteditable, no CodeMirror). */
const NON_EDITABLE_TAG_NAMES = [
  'div', 'span', 'button', 'p', 'h1', 'h2', 'h3', 'a',
  'section', 'article', 'nav', 'footer', 'header', 'main', 'li', 'ul',
] as const;

/**
 * Generates an arbitrary editable element — one of:
 * - input / textarea / select (by tag name)
 * - a div with contenteditable="true" or contenteditable=""
 * - a div with class .cm-editor (CodeMirror root)
 * - a child element nested inside a .cm-editor parent
 */
const arbitraryEditableElement: fc.Arbitrary<Element> = fc.oneof(
  // 1. Editable by tag name
  fc.constantFrom(...EDITABLE_TAG_NAMES).map((tag) => document.createElement(tag)),

  // 2. contenteditable="true"
  fc.constantFrom(...NON_EDITABLE_TAG_NAMES).map((tag) => {
    const el = document.createElement(tag);
    el.setAttribute('contenteditable', 'true');
    return el;
  }),

  // 3. contenteditable="" (empty string — also means editable)
  fc.constantFrom(...NON_EDITABLE_TAG_NAMES).map((tag) => {
    const el = document.createElement(tag);
    el.setAttribute('contenteditable', '');
    return el;
  }),

  // 4. Element with .cm-editor class
  fc.constant(null).map(() => {
    const el = document.createElement('div');
    el.classList.add('cm-editor');
    return el;
  }),

  // 5. Child element inside a .cm-editor parent
  fc.constantFrom(...NON_EDITABLE_TAG_NAMES).map((tag) => {
    const parent = document.createElement('div');
    parent.classList.add('cm-editor');
    const child = document.createElement(tag);
    parent.appendChild(child);
    document.body.appendChild(parent);
    return child;
  }),
);

/**
 * Generates an arbitrary non-editable element — a plain element with
 * no contenteditable attribute and no CodeMirror ancestry.
 */
const arbitraryNonEditableElement: fc.Arbitrary<Element> = fc.constantFrom(
  ...NON_EDITABLE_TAG_NAMES,
).map((tag) => document.createElement(tag));

// ---------------------------------------------------------------------------
// Cleanup: remove any elements appended to document.body during tests
// ---------------------------------------------------------------------------

afterEach(() => {
  document.body.querySelectorAll('.cm-editor').forEach((el) => el.remove());
});

// ---------------------------------------------------------------------------
// Property 10: Editable element shortcut suppression
// ---------------------------------------------------------------------------

/**
 * Validates: Requirements 5.7, 6.2
 *
 * For any element that is an <input>, <textarea>, <select>,
 * [contenteditable], or a CodeMirror editor (.cm-editor),
 * isEditableElement should return true.
 *
 * For any element that is none of these types, isEditableElement
 * should return false.
 *
 * isEditableElement(null) should also return false.
 */
describe('Property 10: Editable element shortcut suppression', () => {
  it('returns true for any editable element (input/textarea/select/contenteditable/CodeMirror)', () => {
    fc.assert(
      fc.property(arbitraryEditableElement, (el) => {
        expect(isEditableElement(el)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('returns false for any non-editable element (div, span, button, p, h1, etc.)', () => {
    fc.assert(
      fc.property(arbitraryNonEditableElement, (el) => {
        expect(isEditableElement(el)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('returns false for null', () => {
    expect(isEditableElement(null)).toBe(false);
  });
});
