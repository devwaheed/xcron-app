// Feature: cron-job-builder, Property 2: Dashboard renders all actions with correct data

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import type { Action, Schedule } from '@/types';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    <a href={href}>{children}</a>,
}));

// ── Generators ──────────────────────────────────────────────────────────────

const IANA_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

const arbitrarySchedule: fc.Arbitrary<Schedule> = fc.record({
  days: fc
    .subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 })
    .map((d) => [...d].sort((a, b) => a - b)),
  hour: fc.integer({ min: 1, max: 12 }),
  minute: fc.integer({ min: 0, max: 59 }),
  period: fc.constantFrom('AM' as const, 'PM' as const),
  timezone: fc.constantFrom(...IANA_TIMEZONES),
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
});


// ── Tests ───────────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 3.1, 3.2
 *
 * For any set of actions stored in the database, the dashboard should render
 * exactly one action card per action, and each card should display the action's
 * name and the current status (active or paused).
 */
describe('Property 2: Dashboard renders all actions with correct data', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders one card per action with correct name and status', { timeout: 60000 }, async () => {
    const DashboardModule = await import('@/app/dashboard/page');
    const DashboardPage = DashboardModule.default;

    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryAction, { minLength: 1, maxLength: 5 }).filter(
          (actions) => {
            const names = actions.map((a) => a.name);
            return new Set(names).size === names.length;
          }
        ),
        async (actions) => {
          cleanup();

          // Mock fetch to return the generated actions
          vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
            const url = typeof input === 'string' ? input : (input as Request).url;
            if (url.includes('/api/usage')) {
              return new Response(JSON.stringify({
                planName: 'Starter', actions: { used: actions.length, limit: 5 },
                runs: { used: 10, limit: 100 },
                billingCycleReset: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                logRetentionDays: 30,
              }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (url.includes('/runs')) {
              return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify(actions), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          });

          render(<ThemeProvider><ToastProvider><DashboardPage /></ToastProvider></ThemeProvider>);

          // Wait for loading to finish
          await waitFor(() => {
            expect(screen.queryByText('Loading actions…')).not.toBeInTheDocument();
          });

          // Verify each action's name is rendered (use heading role for precision)
          for (const action of actions) {
            const headings = screen.getAllByRole('heading', { level: 3 });
            const matchingHeading = headings.find((h) => h.textContent === action.name);
            expect(matchingHeading).toBeTruthy();
          }

          // Verify the number of Active/Paused status badges matches
          // Filter to only badge <span> elements inside action cards (not stats bar)
          const activeCount = actions.filter((a) => a.status === 'active').length;
          const pausedCount = actions.filter((a) => a.status === 'paused').length;

          const activeBadges = screen
            .queryAllByText('Active')
            .filter((el) => el.tagName === 'SPAN' && el.className.includes('ring-'));
          const pausedBadges = screen
            .queryAllByText('Paused')
            .filter((el) => el.tagName === 'SPAN' && el.className.includes('ring-'));

          expect(activeBadges.length).toBe(activeCount);
          expect(pausedBadges.length).toBe(pausedCount);

          // Total rendered cards = total actions
          expect(activeBadges.length + pausedBadges.length).toBe(actions.length);
        }
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: cron-job-builder, Property 10: Paused action visual indication

/**
 * Validates: Requirements 7.6
 *
 * For any action with status "paused", the rendered action card should contain
 * a visual indicator distinguishing it from active actions (opacity-60 class,
 * "Paused" badge, no "Active" badge). Conversely, for any active action,
 * the card should show "Active" badge, no "Paused" badge, and no opacity-60.
 */
describe('Property 10: Paused action visual indication', () => {
  const noop = vi.fn();

  afterEach(() => {
    cleanup();
  });

  it('paused actions show "Paused" badge, opacity-60, and no "Active" badge', async () => {
    const ActionCard = (await import('@/components/ActionCard')).default;

    await fc.assert(
      fc.asyncProperty(
        arbitraryAction.filter((a) => a.status === 'paused'),
        async (action) => {
          cleanup();

          const { container } = render(
            <ActionCard action={action} onToggle={noop} onTrigger={noop} onDelete={noop} />
          );

          // Should show "Paused" text
          expect(screen.getByText('Paused')).toBeInTheDocument();

          // Should NOT show "Active" text
          expect(screen.queryByText('Active')).not.toBeInTheDocument();

          // The outermost wrapper (GlassCard div) should have opacity-60
          const card = container.firstElementChild;
          expect(card?.className).toContain('opacity-60');
        }
      ),
      { numRuns: 100 },
    );
  });

  it('active actions show "Active" badge, no opacity-60, and no "Paused" badge', async () => {
    const ActionCard = (await import('@/components/ActionCard')).default;

    await fc.assert(
      fc.asyncProperty(
        arbitraryAction.filter((a) => a.status === 'active'),
        async (action) => {
          cleanup();

          const { container } = render(
            <ActionCard action={action} onToggle={noop} onTrigger={noop} onDelete={noop} />
          );

          // Should show "Active" text
          expect(screen.getByText('Active')).toBeInTheDocument();

          // Should NOT show "Paused" text
          expect(screen.queryByText('Paused')).not.toBeInTheDocument();

          // The outermost wrapper should NOT have opacity-60
          const card = container.firstElementChild;
          expect(card?.className).not.toContain('opacity-60');
        }
      ),
      { numRuns: 100 },
    );
  });
});
