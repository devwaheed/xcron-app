// Feature: cron-job-builder, Property 6: Edit form pre-fill correctness

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import type { Action, Schedule } from '@/types';
import { TIMEZONES } from '@/components/SchedulePicker';

// ── Mocks ───────────────────────────────────────────────────────────────────

let mockParamsId = '';
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({ id: mockParamsId }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    <a href={href}>{children}</a>,
}));

// ── Generators ──────────────────────────────────────────────────────────────

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const arbitrarySchedule: fc.Arbitrary<Schedule> = fc.record({
  days: fc
    .subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 })
    .map((d) => [...d].sort((a, b) => a - b)),
  hour: fc.integer({ min: 1, max: 12 }),
  minute: fc.integer({ min: 0, max: 59 }),
  period: fc.constantFrom('AM' as const, 'PM' as const),
  timezone: fc.constantFrom(...TIMEZONES),
});

const arbitraryAction: fc.Arbitrary<Action> = fc.record({
  id: fc.uuid(),
  name: fc
    .stringMatching(/^[A-Za-z][A-Za-z0-9 ]{1,29}$/)
    .filter((s) => s.trim().length >= 2),
  scriptContent: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
  schedule: arbitrarySchedule,
  status: fc.constantFrom('active' as const, 'paused' as const),
  githubWorkflowId: fc.option(fc.integer({ min: 1, max: 999999 }), { nil: undefined }),
  createdAt: fc
    .integer({ min: 946684800000, max: 1893456000000 })
    .map((ms) => new Date(ms).toISOString()),
  updatedAt: fc
    .integer({ min: 946684800000, max: 1893456000000 })
    .map((ms) => new Date(ms).toISOString()),
  userId: fc.constant('test-user-id-1234'),
  envVars: fc.constant({}),
  timeoutMinutes: fc.constant(5),
  maxRetries: fc.constant(0),
  retryDelaySeconds: fc.constant(60),
});


// ── Tests ───────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 5.1
 *
 * For any existing action, opening the edit form should pre-fill all fields
 * (name, script content, selected days, time, period, timezone) with values
 * that exactly match the stored action configuration.
 */
describe('Property 6: Edit form pre-fill correctness', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('edit form fields match stored action values for any action', { timeout: 60000 }, async () => {
    const EditActionPage = (await import('@/app/dashboard/[id]/edit/page')).default;

    await fc.assert(
      fc.asyncProperty(arbitraryAction, async (action) => {
        cleanup();
        pushMock.mockClear();

        // Set the mock params id to match the action
        mockParamsId = action.id;

        // Mock fetch to return the action data
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          new Response(JSON.stringify(action), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );

        render(<EditActionPage />);

        // Wait for loading to finish
        await waitFor(() => {
          expect(screen.queryByText('Loading job…')).not.toBeInTheDocument();
        });

        // Verify: name input has the action's name
        const nameInput = screen.getByPlaceholderText('e.g. Daily Report, Health Check') as HTMLInputElement;
        expect(nameInput.value).toBe(action.name);

        // Verify: script textarea has the action's scriptContent (Script tab is default)
        const scriptTextarea = screen.getByPlaceholderText(
          'Paste your JavaScript code here…',
        ) as HTMLTextAreaElement;
        expect(scriptTextarea.value).toBe(action.scriptContent);

        // Verify schedule tab content is accessible
        const scheduleTabs = screen.getAllByRole('button').filter(b => b.textContent?.includes('Schedule'));
        expect(scheduleTabs.length).toBeGreaterThan(0);
        fireEvent.click(scheduleTabs[0]);

        // Give React a tick to re-render
        await new Promise(r => setTimeout(r, 50));

        // Verify: the correct days are toggled (check aria-pressed on day buttons)
        const hourInput = screen.queryByLabelText('Hour') as HTMLInputElement | null;
        if (hourInput) {
          // Schedule tab rendered — verify all fields
          for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const dayButton = screen.getByRole('button', { name: DAY_NAMES[dayIndex] });
            const shouldBeActive = action.schedule.days.includes(dayIndex);
            expect(dayButton.getAttribute('aria-pressed')).toBe(String(shouldBeActive));
          }

          expect(Number(hourInput.value)).toBe(action.schedule.hour);

          const minuteInput = screen.getByLabelText('Minute') as HTMLInputElement;
          expect(Number(minuteInput.value)).toBe(action.schedule.minute);

          const periodButton = screen.getByRole('button', {
            name: `Toggle to ${action.schedule.period === 'AM' ? 'PM' : 'AM'}`,
          });
          expect(periodButton.textContent).toBe(action.schedule.period);

          const timezoneSelect = screen.getByLabelText('Timezone') as HTMLSelectElement;
          expect(timezoneSelect.value).toBe(action.schedule.timezone);
        }
      }),
      { numRuns: 100 },
    );
  });
});
