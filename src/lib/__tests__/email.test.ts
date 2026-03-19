import { describe, it, expect } from "vitest";
import { isEmailEnabled } from "@/lib/email";

describe("email", () => {
  it("reports email as disabled when no API key is set", () => {
    // In test environment, RESEND_API_KEY is not set
    expect(isEmailEnabled()).toBe(false);
  });
});
