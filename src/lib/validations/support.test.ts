import { describe, it, expect } from "vitest";

import { supportSchema } from "./support";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Help with collections",
  message: "How do I add one item to multiple collections?",
};

describe("supportSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = supportSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("trims name, subject, and message", () => {
    const parsed = supportSchema.safeParse({
      name: "  Ada  ",
      email: "ada@example.com",
      subject: "  Hello there  ",
      message: "  A message.  ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Ada");
      expect(parsed.data.subject).toBe("Hello there");
      expect(parsed.data.message).toBe("A message.");
    }
  });

  it("normalizes the email (trim + lowercase)", () => {
    const parsed = supportSchema.safeParse({ ...valid, email: "  Ada@Example.COM  " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("ada@example.com");
  });

  it("rejects an invalid email", () => {
    expect(supportSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("rejects a blank name", () => {
    expect(supportSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });

  it("rejects a blank subject", () => {
    expect(supportSchema.safeParse({ ...valid, subject: "" }).success).toBe(false);
  });

  it("rejects a blank message", () => {
    expect(supportSchema.safeParse({ ...valid, message: "   " }).success).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    expect(supportSchema.safeParse({ ...valid, name: "a".repeat(101) }).success).toBe(
      false,
    );
  });

  it("rejects a subject over 200 characters", () => {
    expect(
      supportSchema.safeParse({ ...valid, subject: "a".repeat(201) }).success,
    ).toBe(false);
  });

  it("rejects a message over 5000 characters", () => {
    expect(
      supportSchema.safeParse({ ...valid, message: "a".repeat(5001) }).success,
    ).toBe(false);
  });
});
