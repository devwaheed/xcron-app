import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UsageDisplay from '@/components/UsageDisplay';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UsageDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    mockFetch.mockResolvedValue({ ok: false });
    render(<UsageDisplay />);
    // Should show skeleton (animate-pulse elements)
    const container = document.querySelector('.animate-pulse');
    expect(container).toBeTruthy();
  });

  it('renders usage stats after successful fetch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        planName: 'Starter',
        actions: { used: 3, limit: 5 },
        runs: { used: 42, limit: 100 },
        billingCycleReset: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        logRetentionDays: 30,
      }),
    });

    render(<UsageDisplay />);

    await waitFor(() => {
      expect(screen.getByText('Starter Plan')).toBeTruthy();
      expect(screen.getByText('3 / 5')).toBeTruthy();
      expect(screen.getByText('42 / 100')).toBeTruthy();
      expect(screen.getByText('Actions')).toBeTruthy();
      expect(screen.getByText('Runs this month')).toBeTruthy();
    });
  });

  it('renders nothing when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { container } = render(<UsageDisplay />);

    await waitFor(() => {
      // After loading, should render nothing (null)
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBe(0);
    });
  });

  it('shows warning color when usage >= 80%', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        planName: 'Starter',
        actions: { used: 4, limit: 5 }, // 80%
        runs: { used: 90, limit: 100 }, // 90%
        billingCycleReset: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        logRetentionDays: 30,
      }),
    });

    render(<UsageDisplay />);

    await waitFor(() => {
      // Check that amber warning colors are applied
      const amberElements = document.querySelectorAll('.text-amber-600');
      expect(amberElements.length).toBeGreaterThan(0);
    });
  });
});
