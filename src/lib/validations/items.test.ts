import { describe, expect, it } from "vitest";

import { updateItemSchema } from "@/lib/validations/items";

describe("updateItemSchema", () => {
  it("requires a non-empty title and trims it", () => {
    expect(updateItemSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(updateItemSchema.safeParse({ title: "" }).success).toBe(false);

    const parsed = updateItemSchema.parse({ title: "  My item  " });
    expect(parsed.title).toBe("My item");
  });

  it("defaults tags to an empty array when omitted", () => {
    const parsed = updateItemSchema.parse({ title: "x" });
    expect(parsed.tags).toEqual([]);
  });

  it("trims, drops empties, and de-duplicates tags", () => {
    const parsed = updateItemSchema.parse({
      title: "x",
      tags: [" react ", "react", "", "  ", "hooks"],
    });
    expect(parsed.tags).toEqual(["react", "hooks"]);
  });

  it("coerces blank optional text fields to null", () => {
    const parsed = updateItemSchema.parse({
      title: "x",
      description: "   ",
      language: "",
    });
    expect(parsed.description).toBeNull();
    expect(parsed.language).toBeNull();
  });

  it("leaves optional fields undefined when absent", () => {
    const parsed = updateItemSchema.parse({ title: "x" });
    expect(parsed.description).toBeUndefined();
    expect(parsed.content).toBeUndefined();
    expect(parsed.language).toBeUndefined();
    expect(parsed.url).toBeUndefined();
  });

  it("preserves content whitespace (not trimmed)", () => {
    const parsed = updateItemSchema.parse({
      title: "x",
      content: "  const a = 1;\n  return a;",
    });
    expect(parsed.content).toBe("  const a = 1;\n  return a;");
  });

  it("rejects an invalid URL but accepts a valid one", () => {
    expect(
      updateItemSchema.safeParse({ title: "x", url: "not-a-url" }).success,
    ).toBe(false);

    const parsed = updateItemSchema.parse({
      title: "x",
      url: "https://example.com",
    });
    expect(parsed.url).toBe("https://example.com");
  });

  it("coerces a blank URL to null", () => {
    const parsed = updateItemSchema.parse({ title: "x", url: "  " });
    expect(parsed.url).toBeNull();
  });
});
