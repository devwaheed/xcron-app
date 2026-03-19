import { describe, it, expect } from 'vitest';
import { getBillingCycleRange } from '../usage-tracker';

describe('getBillingCycleRange', () => {
  it('returns a 30-day range starting from the billing cycle start', () => {
    const start = '2026-01-01T00:00:00.000Z';
    const result = getBillingCycleRange(start);
    const msPerCycle = 30 * 24 * 60 * 60 * 1000;

    expect(result.end.getTime() - result.start.getTime()).toBe(msPerCycle);
  });

  it('advances past expired cycles', () => {
    // Set a start date far in the past
    const start = '2025-01-01T00:00:00.000Z';
    const result = getBillingCycleRange(start);
    const now = new Date();

    // The cycle start should be before now
    expect(result.start.getTime()).toBeLessThanOrEqual(now.getTime());
    // The cycle end should be after now
    expect(result.end.getTime()).toBeGreaterThan(now.getTime());
  });

  it('returns the original start if still within first cycle', () => {
    const now = new Date();
    const start = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const result = getBillingCycleRange(start.toISOString());

    expect(result.start.getTime()).toBe(start.getTime());
  });

  it('handles exactly 30 days elapsed (starts new cycle)', () => {
    const now = new Date();
    const msPerCycle = 30 * 24 * 60 * 60 * 1000;
    const start = new Date(now.getTime() - msPerCycle); // exactly 30 days ago
    const result = getBillingCycleRange(start.toISOString());

    // Should have advanced to a new cycle
    expect(result.start.getTime()).toBe(start.getTime() + msPerCycle);
  });

  it('handles multiple cycles elapsed', () => {
    const now = new Date();
    const msPerCycle = 30 * 24 * 60 * 60 * 1000;
    const start = new Date(now.getTime() - 3.5 * msPerCycle); // 105 days ago
    const result = getBillingCycleRange(start.toISOString());

    // Should be in the 4th cycle (index 3)
    const expectedStart = new Date(start.getTime() + 3 * msPerCycle);
    expect(result.start.getTime()).toBe(expectedStart.getTime());
  });
});
