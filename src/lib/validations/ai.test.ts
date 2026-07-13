import { describe, expect, it } from "vitest";

import {
  autoTagSchema,
  explainCodeSchema,
  summarySchema,
} from "@/lib/validations/ai";

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

describe("explainCodeSchema", () => {
  it("accepts title + content and trims the title, defaults language", () => {
    const parsed = explainCodeSchema.parse({
      title: "  useDebounce  ",
      content: "const x = 1;",
    });
    expect(parsed).toEqual({
      title: "useDebounce",
      content: "const x = 1;",
      language: "",
    });
  });

  it("keeps a provided language", () => {
    const parsed = explainCodeSchema.parse({
      title: "cmd",
      content: "ls -la",
      language: "shell",
    });
    expect(parsed.language).toBe("shell");
  });

  it("requires non-empty content (unlike tag/summary)", () => {
    expect(
      explainCodeSchema.safeParse({ title: "ok", content: "" }).success,
    ).toBe(false);
    expect(
      explainCodeSchema.safeParse({ title: "ok", content: "   " }).success,
    ).toBe(false);
    expect(explainCodeSchema.safeParse({ title: "ok" }).success).toBe(false);
  });

  it("rejects a blank title", () => {
    expect(
      explainCodeSchema.safeParse({ title: "  ", content: "x" }).success,
    ).toBe(false);
  });

  it("rejects content over the max length", () => {
    expect(
      explainCodeSchema.safeParse({ title: "ok", content: "a".repeat(20001) })
        .success,
    ).toBe(false);
  });
});
