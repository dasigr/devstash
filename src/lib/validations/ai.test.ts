import { describe, expect, it } from "vitest";

import { autoTagSchema, summarySchema } from "@/lib/validations/ai";

describe("autoTagSchema", () => {
  it("accepts a title with content and trims the title", () => {
    const parsed = autoTagSchema.parse({ title: "  My snippet  ", content: "x" });
    expect(parsed).toEqual({ title: "My snippet", content: "x" });
  });

  it("defaults content to an empty string when omitted", () => {
    const parsed = autoTagSchema.parse({ title: "My snippet" });
    expect(parsed.content).toBe("");
  });

  it("rejects a blank title", () => {
    expect(autoTagSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(autoTagSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects a title over the max length", () => {
    expect(autoTagSchema.safeParse({ title: "a".repeat(301) }).success).toBe(
      false,
    );
  });

  it("rejects content over the max length", () => {
    const result = autoTagSchema.safeParse({
      title: "ok",
      content: "a".repeat(20001),
    });
    expect(result.success).toBe(false);
  });
});

describe("summarySchema", () => {
  it("accepts a title with content and trims the title", () => {
    const parsed = summarySchema.parse({ title: "  My snippet  ", content: "x" });
    expect(parsed).toEqual({ title: "My snippet", content: "x" });
  });

  it("defaults content to an empty string when omitted", () => {
    const parsed = summarySchema.parse({ title: "My snippet" });
    expect(parsed.content).toBe("");
  });

  it("rejects a blank title", () => {
    expect(summarySchema.safeParse({ title: "   " }).success).toBe(false);
    expect(summarySchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects a title over the max length", () => {
    expect(summarySchema.safeParse({ title: "a".repeat(301) }).success).toBe(
      false,
    );
  });

  it("rejects content over the max length", () => {
    const result = summarySchema.safeParse({
      title: "ok",
      content: "a".repeat(20001),
    });
    expect(result.success).toBe(false);
  });
});
