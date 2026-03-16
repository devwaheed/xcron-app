// Feature: cron-job-builder, Property 12: Run history entries display required fields
// Feature: cron-job-builder, Property 13: Run history filter correctness

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import RunHistoryEntry from '@/components/RunHistoryEntry';
import type { RunEntry } from '@/types';

// ── Mocks for RunHistoryPage ────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({ id: 'test-action-id' }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    <a href={href}>{children}</a>,
}));

// ── Generators ──────────────────────────────────────────────────────────────

const arbitraryRunEntry: fc.Arbitrary<RunEntry> = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  status: fc.constantFrom('success' as const, 'failure' as const),
  timestamp: fc
    .integer({ min: 946684800000, max: 1893456000000 })
    .map((ms) => new Date(ms).toISOString()),
  output: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
  trigger: fc.constantFrom('schedule' as const, 'workflow_dispatch' as const),
});

// ── Tests ───────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 9.1, 9.2
 *
 * For any run history entry, the rendered display should include the execution
 * timestamp, status (success or failure), and execution output (after expanding).
 */
describe('Property 12: Run history entries display required fields', () => {
  afterEach(() => {
    cleanup();
  });

  it('status badge text matches the run status', () => {
    fc.assert(
      fc.property(arbitraryRunEntry, (run) => {
        cleanup();
        render(<RunHistoryEntry run={run} />);

        const expectedBadge = run.status === 'success' ? 'Success' : 'Failure';
        expect(screen.getByText(expectedBadge)).toBeInTheDocument();
      }),
      { numRuns: 100 },
    );
  });

  it('timestamp is displayed as a formatted date string', () => {
    fc.assert(
      fc.property(arbitraryRunEntry, (run) => {
        cleanup();
        render(<RunHistoryEntry run={run} />);

        // The component formats the ISO timestamp via toLocaleString.
        // Verify the formatted output is present by checking the date's year
        // appears somewhere in the rendered text.
        const date = new Date(run.timestamp);
        const year = date.getFullYear().toString();
        const container = screen.getByRole('button');
        expect(container.textContent).toContain(year);
      }),
      { numRuns: 100 },
    );
  });

  it('output is accessible after expanding the toggle button', () => {
    fc.assert(
      fc.property(arbitraryRunEntry, (run) => {
        cleanup();
        render(<RunHistoryEntry run={run} />);

        // Output should not be visible before expanding
        const toggle = screen.getByRole('button');
        expect(toggle).toHaveAttribute('aria-expanded', 'false');

        // Click to expand
        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');

        // Output text should now be visible in the expanded <pre> block
        const pre = document.querySelector('pre');
        expect(pre).not.toBeNull();
        expect(pre!.textContent).toBe(run.output);
      }),
      { numRuns: 100 },
    );
  });
});


// Feature: cron-job-builder, Property 13: Run history filter correctness

/**
 * Validates: Requirements 9.4
 *
 * For any set of run history entries and any selected filter (all, success,
 * failure), the displayed entries should be exactly those whose status matches
 * the filter (or all entries when filter is "all").
 */
describe('Property 13: Run history filter correctness', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('displayed entries match the selected status filter', async () => {
    const RunHistoryPage = (await import('@/app/dashboard/[id]/history/page')).default;

    type StatusFilter = 'all' | 'success' | 'failure';

    const arbitraryFilter: fc.Arbitrary<StatusFilter> = fc.constantFrom(
      'all' as const,
      'success' as const,
      'failure' as const,
    );

    const arbitraryRunEntries = fc
      .array(arbitraryRunEntry, { minLength: 1, maxLength: 8 })
      .filter((entries) => {
        const ids = entries.map((e) => e.id);
        return new Set(ids).size === ids.length;
      });

    await fc.assert(
      fc.asyncProperty(arbitraryRunEntries, arbitraryFilter, async (allRuns, filter) => {
        cleanup();

        // Compute the expected filtered subset
        const expectedRuns =
          filter === 'all'
            ? allRuns
            : allRuns.filter((r) => r.status === filter);

        // Mock fetch: inspect query params and return the appropriate subset
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: string | URL | Request) => {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          const parsed = new URL(url, 'http://localhost');
          const statusParam = parsed.searchParams.get('status');

          let filtered: RunEntry[];
          if (statusParam === 'success' || statusParam === 'failure') {
            filtered = allRuns.filter((r) => r.status === statusParam);
          } else {
            filtered = allRuns;
          }

          return new Response(JSON.stringify(filtered), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        });

        render(<RunHistoryPage />);

        // Wait for initial load to complete
        await waitFor(() => {
          expect(screen.queryByText('Loading run history…')).not.toBeInTheDocument();
        });

        // Change the filter dropdown if not "all" (default)
        if (filter !== 'all') {
          const select = screen.getByLabelText('Filter by status');
          fireEvent.change(select, { target: { value: filter } });

          // Wait for re-render after filter change
          await waitFor(() => {
            expect(screen.queryByText('Loading run history…')).not.toBeInTheDocument();
          });
        }

        // Count displayed Success and Failure badges (exclude <option> elements
        // in the filter dropdown which also contain "Success"/"Failure" text)
        const successBadges = screen
          .queryAllByText('Success')
          .filter((el) => el.tagName !== 'OPTION');
        const failureBadges = screen
          .queryAllByText('Failure')
          .filter((el) => el.tagName !== 'OPTION');
        const totalDisplayed = successBadges.length + failureBadges.length;

        const expectedSuccessCount = expectedRuns.filter((r) => r.status === 'success').length;
        const expectedFailureCount = expectedRuns.filter((r) => r.status === 'failure').length;

        expect(successBadges.length).toBe(expectedSuccessCount);
        expect(failureBadges.length).toBe(expectedFailureCount);
        expect(totalDisplayed).toBe(expectedRuns.length);
      }),
      { numRuns: 100 },
    );
  });
});
