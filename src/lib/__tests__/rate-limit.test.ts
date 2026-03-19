import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("rate-limit", () => {
  const config = { limit: 3, windowSeconds: 60 };

  beforeEach(() => {
    // Use unique keys per test to avoid cross-contamination
  });

  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}-allow`;
    const r1 = checkRateLimit(key, config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it("blocks requests over the limit", () => {
    const key = `test-${Date.now()}-block`;
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);

    const r4 = checkRateLimit(key, config);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("uses separate limits for different keys", () => {
    const key1 = `test-${Date.now()}-a`;
    const key2 = `test-${Date.now()}-b`;

    checkRateLimit(key1, config);
    checkRateLimit(key1, config);
    checkRateLimit(key1, config);

    const r = checkRateLimit(key2, config);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
  });
});
