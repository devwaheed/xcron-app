// Feature: cron-job-builder, Property 4: Form validation rejects incomplete submissions

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks ───────────────────────────────────────────────────────────────────

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({}),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    <a href={href}>{children}</a>,
}));

// ── Types for incomplete form data ──────────────────────────────────────────

interface IncompleteFormData {
  name: string;
  script: string;
  daysSelected: number[]; // which day indices to toggle on (0-6)
  hour: number;
  minute: number;
}

// ── Generator: at least one field is invalid ────────────────────────────────

/**
 * Generates form data where at least one required field is invalid:
 * - empty/whitespace name
 * - empty/whitespace script
 * - no days selected
 *
 * We keep hour/minute in valid range (1-12, 0-59) and focus on the three
 * fields the user directly controls via text input and day toggles.
 */
const arbitraryIncompleteFormData: fc.Arbitrary<IncompleteFormData> = fc
  .record({
    name: fc.constantFrom('', '   ', '\t', '\n'),
    script: fc.constantFrom('', '   ', '\t', '\n'),
    daysSelected: fc.constantFrom([] as number[]),
    invalidField: fc.constantFrom('name', 'script', 'days') as fc.Arbitrary<'name' | 'script' | 'days'>,
    validName: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{1,19}$/),
    validScript: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    validDays: fc.subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 }),
  })
  .map(({ invalidField, name, script, daysSelected, validName, validScript, validDays }) => {
    // Make at least one field invalid based on the chosen invalidField
    switch (invalidField) {
      case 'name':
        return { name, script: validScript, daysSelected: validDays, hour: 9, minute: 0 };
      case 'script':
        return { name: validName, script, daysSelected: validDays, hour: 9, minute: 0 };
      case 'days':
        return { name: validName, script: validScript, daysSelected, hour: 9, minute: 0 };
    }
  });

// ── Tests ───────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 4.8
 *
 * For any form submission with missing required fields, validation errors
 * should appear and fetch should NOT be called.
 */
describe('Property 4: Form validation rejects incomplete submissions', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows validation errors and does not call fetch for incomplete form data', { timeout: 30000 }, async () => {
    const NewActionPage = (await import('@/app/dashboard/new/page')).default;

    await fc.assert(
      fc.asyncProperty(arbitraryIncompleteFormData, async (formData) => {
        cleanup();
        pushMock.mockClear();

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          new Response(JSON.stringify({}), { status: 200 })
        );

        render(<NewActionPage />);

        // Fill in the name field
        const nameInput = screen.getByPlaceholderText('e.g. Daily Report, Cleanup Script');
        fireEvent.change(nameInput, { target: { value: formData.name } });

        // Fill in the script field
        const scriptTextarea = screen.getByPlaceholderText('Paste your JavaScript code here…');
        fireEvent.change(scriptTextarea, { target: { value: formData.script } });

        // Toggle days: the SchedulePicker renders 7 day buttons with aria-labels
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (const dayIndex of formData.daysSelected) {
          const dayButton = screen.getByRole('button', { name: dayNames[dayIndex] });
          fireEvent.click(dayButton);
        }

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /create action/i });
        fireEvent.click(submitButton);

        // Wait a tick for React state updates
        await waitFor(() => {
          // At least one validation error should be visible
          const nameError = screen.queryByText('Name is required');
          const scriptError = screen.queryByText('Script is required');
          const daysError = screen.queryByText('At least one day must be selected');
          const timeError = screen.queryByText(/Hour must be 1/);

          const hasError = nameError || scriptError || daysError || timeError;
          expect(hasError).toBeTruthy();
        });

        // fetch should NOT have been called for form submission (profile fetch is expected)
        const actionCalls = fetchSpy.mock.calls.filter(
          (call) => call[0] !== '/api/profile'
        );
        expect(actionCalls).toHaveLength(0);

        // Router push should NOT have been called (no navigation to dashboard)
        expect(pushMock).not.toHaveBeenCalledWith('/dashboard');

        fetchSpy.mockRestore();
      }),
      { numRuns: 100 },
    );
  });
});
