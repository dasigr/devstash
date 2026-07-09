import { describe, expect, it } from "vitest";

import { createItemSchema, updateItemSchema } from "@/lib/validations/items";

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

describe("createItemSchema", () => {
  it("requires a valid creatable type", () => {
    expect(
      createItemSchema.safeParse({ type: "bogus", title: "x" }).success,
    ).toBe(false);
    expect(
      createItemSchema.safeParse({ title: "x" }).success,
    ).toBe(false);
    expect(
      createItemSchema.safeParse({ type: "snippet", title: "x" }).success,
    ).toBe(true);
  });

  it("requires file metadata for file/image items", () => {
    // A file/image type with no uploaded file fails.
    for (const type of ["file", "image"] as const) {
      const missing = createItemSchema.safeParse({ type, title: "x" });
      expect(missing.success).toBe(false);
      if (!missing.success) {
        const paths = missing.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("fileUrl");
        expect(paths).toContain("fileName");
        expect(paths).toContain("fileSize");
      }
    }

    // With all three file fields it parses and keeps them.
    const ok = createItemSchema.parse({
      type: "image",
      title: "Diagram",
      fileUrl: "https://pub.example.com/items/u/x.png",
      fileName: "x.png",
      fileSize: 2048,
    });
    expect(ok.fileUrl).toBe("https://pub.example.com/items/u/x.png");
    expect(ok.fileName).toBe("x.png");
    expect(ok.fileSize).toBe(2048);
  });

  it("requires a non-empty title and trims it", () => {
    expect(
      createItemSchema.safeParse({ type: "note", title: "   " }).success,
    ).toBe(false);

    const parsed = createItemSchema.parse({
      type: "note",
      title: "  My note  ",
    });
    expect(parsed.title).toBe("My note");
  });

  it("requires a URL for link items", () => {
    const missing = createItemSchema.safeParse({ type: "link", title: "x" });
    expect(missing.success).toBe(false);

    const blank = createItemSchema.safeParse({
      type: "link",
      title: "x",
      url: "   ",
    });
    expect(blank.success).toBe(false);

    const ok = createItemSchema.parse({
      type: "link",
      title: "x",
      url: "https://example.com",
    });
    expect(ok.url).toBe("https://example.com");
  });

  it("flags a missing link URL on the url field", () => {
    const result = createItemSchema.safeParse({ type: "link", title: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("url");
    }
  });

  it("does not require a URL for non-link types", () => {
    expect(
      createItemSchema.safeParse({ type: "snippet", title: "x" }).success,
    ).toBe(true);
  });

  it("preserves content whitespace and de-duplicates tags", () => {
    const parsed = createItemSchema.parse({
      type: "command",
      title: "x",
      content: "  ls -la\n  pwd",
      tags: [" git ", "git", ""],
    });
    expect(parsed.content).toBe("  ls -la\n  pwd");
    expect(parsed.tags).toEqual(["git"]);
  });
});

describe("collectionIds", () => {
  it("defaults to an empty array on create when omitted", () => {
    const parsed = createItemSchema.parse({ type: "note", title: "x" });
    expect(parsed.collectionIds).toEqual([]);
  });

  it("stays undefined on update when omitted, so membership is untouched", () => {
    const parsed = updateItemSchema.parse({ title: "x" });
    expect(parsed.collectionIds).toBeUndefined();
  });

  it("distinguishes an empty array (clear membership) from omission", () => {
    const parsed = updateItemSchema.parse({ title: "x", collectionIds: [] });
    expect(parsed.collectionIds).toEqual([]);
  });

  it("trims, drops empties, and de-duplicates ids", () => {
    const input = { title: "x", collectionIds: [" col_a ", "col_a", "", "col_b"] };
    expect(updateItemSchema.parse(input).collectionIds).toEqual([
      "col_a",
      "col_b",
    ]);
    expect(
      createItemSchema.parse({ type: "note", ...input }).collectionIds,
    ).toEqual(["col_a", "col_b"]);
  });

  it("rejects a non-array value", () => {
    expect(
      updateItemSchema.safeParse({ title: "x", collectionIds: "col_a" }).success,
    ).toBe(false);
  });
});
