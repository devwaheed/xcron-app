import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PricingPage from '@/app/pricing/page';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock Logo
vi.mock('@/components/Logo', () => ({
  Logo: ({ showWordmark }: { showWordmark?: boolean }) => (
    <span data-testid="logo">{showWordmark ? 'xCron' : 'X'}</span>
  ),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: unauthenticated
    mockFetch.mockResolvedValue({ ok: false });
  });

  it('renders three plan tiers', async () => {
    render(<PricingPage />);

    // Plan names appear in cards and table headers
    expect(screen.getAllByText('Starter').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pro').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Business').length).toBeGreaterThan(0);
  });

  it('displays correct prices', async () => {
    render(<PricingPage />);

    expect(screen.getAllByText('$49').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$99').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$199').length).toBeGreaterThan(0);
  });

  it('displays correct action limits', async () => {
    render(<PricingPage />);

    expect(screen.getAllByText('5 scheduled actions').length).toBeGreaterThan(0);
    expect(screen.getAllByText('15 scheduled actions').length).toBeGreaterThan(0);
    expect(screen.getAllByText('50 scheduled actions').length).toBeGreaterThan(0);
  });

  it('shows "Most Popular" badge on Pro tier', () => {
    render(<PricingPage />);
    expect(screen.getByText('Most Popular')).toBeTruthy();
  });

  it('shows Sign In link when unauthenticated', () => {
    render(<PricingPage />);
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('shows Dashboard link when authenticated', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        planName: 'Starter',
        actions: { used: 1, limit: 5 },
        runs: { used: 10, limit: 100 },
        billingCycleReset: new Date().toISOString(),
        logRetentionDays: 30,
      }),
    });

    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeTruthy();
    });
  });

  it('highlights current plan for authenticated user', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        planName: 'Starter',
        actions: { used: 1, limit: 5 },
        runs: { used: 10, limit: 100 },
        billingCycleReset: new Date().toISOString(),
        logRetentionDays: 30,
      }),
    });

    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeTruthy();
    });
  });

  it('renders features comparison table', () => {
    render(<PricingPage />);

    expect(screen.getByText('Feature')).toBeTruthy();
    expect(screen.getAllByText('Scheduled actions').length).toBeGreaterThan(0);
    expect(screen.getByText('Runs per month')).toBeTruthy();
    expect(screen.getByText('Log retention')).toBeTruthy();
  });
});
