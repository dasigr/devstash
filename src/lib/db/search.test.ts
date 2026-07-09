import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma client so the queries run without a database. `vi.hoisted`
// lets the mock factory reference the spies (vi.mock is hoisted above imports).
const { itemFindMany, collectionFindMany } = vi.hoisted(() => ({
  itemFindMany: vi.fn(),
  collectionFindMany: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findMany: itemFindMany },
    collection: { findMany: collectionFindMany },
  },
}));

import {
  getSearchData,
  SEARCH_PREVIEW_LENGTH,
  truncatePreview,
} from "@/lib/db/search";

const snippetType = { name: "snippet", color: "#3b82f6", icon: "Code" };

function rawItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item_1",
    title: "useDebounce hook",
    contentType: "TEXT",
    content: "export function useDebounce() {}",
    url: null,
    fileName: null,
    description: null,
    tags: [{ name: "react" }, { name: "hooks" }],
    itemType: snippetType,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  itemFindMany.mockResolvedValue([]);
  collectionFindMany.mockResolvedValue([]);
});

describe("truncatePreview", () => {
  it("collapses runs of whitespace and newlines into single spaces", () => {
    expect(truncatePreview("a\n\n  b\tc")).toBe("a b c");
  });

  it("trims leading and trailing whitespace", () => {
    expect(truncatePreview("  padded  ")).toBe("padded");
  });

  it("leaves text at or under the cap untouched", () => {
    const text = "x".repeat(SEARCH_PREVIEW_LENGTH);
    expect(truncatePreview(text)).toBe(text);
  });

  it("caps longer text and marks the elision", () => {
    const result = truncatePreview("x".repeat(SEARCH_PREVIEW_LENGTH + 50));
    expect(result).toBe(`${"x".repeat(SEARCH_PREVIEW_LENGTH)}…`);
  });

  it("returns an empty string for blank input", () => {
    expect(truncatePreview("   ")).toBe("");
  });
});

describe("getSearchData", () => {
  it("scopes both queries to the given user", async () => {
    await getSearchData("user_1");

    expect(itemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
    expect(collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
  });

  it("returns empty lists when the user owns nothing", async () => {
    await expect(getSearchData("user_1")).resolves.toEqual({
      items: [],
      collections: [],
    });
  });

  it("flattens tags and the item type onto each item", async () => {
    itemFindMany.mockResolvedValue([rawItem()]);

    const { items } = await getSearchData("user_1");

    expect(items).toEqual([
      {
        id: "item_1",
        title: "useDebounce hook",
        preview: "export function useDebounce() {}",
        tags: ["react", "hooks"],
        typeName: "snippet",
        typeColor: "#3b82f6",
        typeIcon: "Code",
      },
    ]);
  });

  it("derives the preview from the content type", async () => {
    itemFindMany.mockResolvedValue([
      rawItem({ id: "a", contentType: "URL", url: "https://example.com" }),
      rawItem({ id: "b", contentType: "FILE", fileName: "notes.pdf" }),
      rawItem({ id: "c", contentType: "TEXT", content: "plain text" }),
    ]);

    const { items } = await getSearchData("user_1");

    expect(items.map((item) => item.preview)).toEqual([
      "https://example.com",
      "notes.pdf",
      "plain text",
    ]);
  });

  it("falls back to the description when the type's own field is empty", async () => {
    itemFindMany.mockResolvedValue([
      rawItem({ content: null, description: "a described item" }),
    ]);

    const { items } = await getSearchData("user_1");

    expect(items[0].preview).toBe("a described item");
  });

  it("truncates long content so the payload stays small", async () => {
    itemFindMany.mockResolvedValue([
      rawItem({ content: "y".repeat(SEARCH_PREVIEW_LENGTH + 100) }),
    ]);

    const { items } = await getSearchData("user_1");

    expect(items[0].preview).toHaveLength(SEARCH_PREVIEW_LENGTH + 1); // + the ellipsis
    expect(items[0].preview.endsWith("…")).toBe(true);
  });

  it("exposes each collection's item count from the relation aggregate", async () => {
    collectionFindMany.mockResolvedValue([
      { id: "col_1", name: "React Patterns", _count: { items: 3 } },
      { id: "col_2", name: "Empty", _count: { items: 0 } },
    ]);

    const { collections } = await getSearchData("user_1");

    expect(collections).toEqual([
      { id: "col_1", name: "React Patterns", itemCount: 3 },
      { id: "col_2", name: "Empty", itemCount: 0 },
    ]);
  });

  it("orders both lists most recently updated first", async () => {
    await getSearchData("user_1");

    expect(itemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { updatedAt: "desc" } }),
    );
    expect(collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { updatedAt: "desc" } }),
    );
  });

  it("never selects item content beyond what the preview needs", async () => {
    await getSearchData("user_1");

    const { select } = itemFindMany.mock.calls[0][0];
    expect(select).not.toHaveProperty("fileUrl");
    expect(select).not.toHaveProperty("fileSize");
  });
});
