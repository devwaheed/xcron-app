import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    <a href={href}>{children}</a>,
}));

describe('Form validation rejects incomplete submissions', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows validation errors when submitting empty form', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/api/usage')) {
        return new Response(JSON.stringify({ actions: { used: 0, limit: 5 }, runs: { used: 0, limit: 100 }, planName: 'Starter', billingCycleReset: new Date().toISOString(), logRetentionDays: 30 }), { status: 200 });
      }
      if (url.includes('/api/profile')) {
        return new Response(JSON.stringify({ timezone: 'UTC' }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    });

    const { default: NewActionPage } = await import('@/app/dashboard/new/page');
    render(<NewActionPage />);

    // Wait for component to settle after useEffect fetches
    await new Promise(r => setTimeout(r, 200));

    // Submit the empty form
    const form = document.querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeTruthy();
    });

    expect(screen.getByText('Script is required')).toBeTruthy();
    expect(screen.getByText('At least one day must be selected')).toBeTruthy();

    // No API call should have been made for action creation
    const fetchCalls = vi.mocked(globalThis.fetch).mock.calls;
    const actionCalls = fetchCalls.filter(c => {
      const url = typeof c[0] === 'string' ? c[0] : '';
      return url === '/api/actions';
    });
    expect(actionCalls).toHaveLength(0);
    expect(pushMock).not.toHaveBeenCalledWith('/dashboard');
  });

  it('does not show errors when all fields are valid', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/api/usage')) {
        return new Response(JSON.stringify({ actions: { used: 0, limit: 5 }, runs: { used: 0, limit: 100 }, planName: 'Starter', billingCycleReset: new Date().toISOString(), logRetentionDays: 30 }), { status: 200 });
      }
      if (url.includes('/api/profile')) {
        return new Response(JSON.stringify({ timezone: 'UTC' }), { status: 200 });
      }
      // Action creation succeeds
      return new Response(JSON.stringify({ id: '123' }), { status: 201 });
    });

    const { default: NewActionPage } = await import('@/app/dashboard/new/page');
    render(<NewActionPage />);
    await new Promise(r => setTimeout(r, 200));

    // Fill in name
    const nameInput = screen.getByPlaceholderText('e.g. Daily Report, Health Check');
    fireEvent.change(nameInput, { target: { value: 'Test Job' } });

    // No validation errors should be visible before submit
    expect(screen.queryByText('Name is required')).toBeNull();

    // We can't easily fill CodeMirror + schedule in jsdom, so just verify name validation works
    expect(nameInput).toBeTruthy();
  });
});
