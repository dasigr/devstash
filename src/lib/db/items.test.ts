import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma client so the query runs without a database. `vi.hoisted`
// lets the mock factory reference the spy (vi.mock is hoisted above imports).
const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { item: { findFirst } },
}));

import { getItemDetail } from "@/lib/db/items";

/** A raw item matching the shape `getItemDetail` selects from Prisma. */
function rawItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item_1",
    title: "useDebounce hook",
    description: "Debounce a fast-changing value",
    contentType: "TEXT",
    content: "export function useDebounce() {}",
    language: "typescript",
    url: null,
    fileName: null,
    fileSize: null,
    isFavorite: false,
    isPinned: true,
    createdAt: new Date("2026-06-28T12:00:00Z"),
    updatedAt: new Date("2026-06-28T12:00:00Z"),
    itemType: { id: "type_snippet", name: "snippet", color: "#3b82f6", icon: "Code" },
    tags: [{ name: "react" }, { name: "hooks" }],
    collections: [
      {
        collection: {
          id: "col_react",
          name: "React Patterns",
          defaultType: { color: "#3b82f6" },
        },
      },
    ],
    ...overrides,
  };
}

describe("getItemDetail", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("returns null when no item is found (missing or not owned)", async () => {
    findFirst.mockResolvedValue(null);
    expect(await getItemDetail("nope", "user_1")).toBeNull();
  });

  it("scopes the query to the item id and owner (IDOR guard)", async () => {
    findFirst.mockResolvedValue(rawItem());
    await getItemDetail("item_1", "user_1");

    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "item_1",
      userId: "user_1",
    });
  });

  it("maps the raw item into the drawer detail shape", async () => {
    findFirst.mockResolvedValue(rawItem());
    const detail = await getItemDetail("item_1", "user_1");

    expect(detail).toMatchObject({
      id: "item_1",
      title: "useDebounce hook",
      contentType: "TEXT",
      content: "export function useDebounce() {}",
      language: "typescript",
      isFavorite: false,
      isPinned: true,
      itemType: { id: "type_snippet", name: "snippet", color: "#3b82f6", icon: "Code" },
    });
    // Tags flatten from [{ name }] to string[].
    expect(detail?.tags).toEqual(["react", "hooks"]);
    // createdAt is a formatted date string (locale-dependent — check the year).
    expect(detail?.createdAt).toContain("2026");
  });

  it("maps collections and uses the default type color", async () => {
    findFirst.mockResolvedValue(rawItem());
    const detail = await getItemDetail("item_1", "user_1");

    expect(detail?.collections).toEqual([
      { id: "col_react", name: "React Patterns", color: "#3b82f6" },
    ]);
  });

  it("falls back to a gray color when a collection has no default type", async () => {
    findFirst.mockResolvedValue(
      rawItem({
        collections: [
          {
            collection: { id: "col_x", name: "Uncategorized", defaultType: null },
          },
        ],
      }),
    );
    const detail = await getItemDetail("item_1", "user_1");

    expect(detail?.collections[0].color).toBe("#6b7280");
  });
});
