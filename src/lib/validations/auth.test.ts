import { describe, expect, it } from "vitest";
import {
  credentialsSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

describe("credentialsSchema", () => {
  it("normalizes the email (trim + lowercase)", () => {
    const parsed = credentialsSchema.parse({
      email: "  User@Example.COM ",
      password: "password123",
    });
    expect(parsed.email).toBe("user@example.com");
  });

  it("rejects an invalid email", () => {
    const result = credentialsSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts matching passwords", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("flags mismatched passwords on confirmPassword", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("requires a non-empty name", () => {
    const result = registerSchema.safeParse({ ...valid, name: "   " });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires a token", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });
});
