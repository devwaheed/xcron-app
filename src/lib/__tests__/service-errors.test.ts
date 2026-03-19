import { describe, it, expect } from "vitest";
import { friendlyServiceError } from "@/lib/service-errors";

describe("service-errors", () => {
  it("detects auth failures", () => {
    const msg = friendlyServiceError("GitHub", new Error("Bad credentials"));
    expect(msg).toContain("authentication failed");
  });

  it("detects rate limits", () => {
    const msg = friendlyServiceError("GitHub", new Error("rate limit exceeded"));
    expect(msg).toContain("rate limit");
  });

  it("detects connection failures", () => {
    const msg = friendlyServiceError("cron-job.org", new Error("fetch failed"));
    expect(msg).toContain("Cannot reach");
  });

  it("detects timeouts", () => {
    const msg = friendlyServiceError("Supabase", new Error("ETIMEDOUT"));
    expect(msg).toContain("timed out");
  });

  it("handles 404 errors", () => {
    const msg = friendlyServiceError("GitHub", new Error("404 Not Found"));
    expect(msg).toContain("not found");
  });

  it("truncates long error messages", () => {
    const longMsg = "x".repeat(300);
    const msg = friendlyServiceError("Service", new Error(longMsg));
    expect(msg.length).toBeLessThan(300);
    expect(msg).toContain("…");
  });

  it("handles non-Error objects", () => {
    const msg = friendlyServiceError("Service", "string error");
    expect(msg).toContain("string error");
  });
});
