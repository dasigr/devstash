import { afterEach, describe, expect, it } from "vitest";
import { isEmailVerificationEnabled } from "@/lib/features";

describe("isEmailVerificationEnabled", () => {
  const original = process.env.EMAIL_VERIFICATION_ENABLED;

  afterEach(() => {
    process.env.EMAIL_VERIFICATION_ENABLED = original;
  });

  it("defaults to false when unset", () => {
    delete process.env.EMAIL_VERIFICATION_ENABLED;
    expect(isEmailVerificationEnabled()).toBe(false);
  });

  it('returns true for "true"', () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "true";
    expect(isEmailVerificationEnabled()).toBe(true);
  });

  it("is case-insensitive and trims whitespace", () => {
    process.env.EMAIL_VERIFICATION_ENABLED = "  TRUE  ";
    expect(isEmailVerificationEnabled()).toBe(true);
  });

  it("returns false for any non-true value", () => {
    for (const value of ["false", "1", "yes", "", "on"]) {
      process.env.EMAIL_VERIFICATION_ENABLED = value;
      expect(isEmailVerificationEnabled()).toBe(false);
    }
  });
});
