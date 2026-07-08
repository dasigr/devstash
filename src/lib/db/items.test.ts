import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma client so the query runs without a database. `vi.hoisted`
// lets the mock factory reference the spy (vi.mock is hoisted above imports).
const { findFirst, update, deleteMany } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  deleteMany: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { item: { findFirst, update, deleteMany } },
}));

import { deleteItem, getItemDetail, updateItem } from "@/lib/db/items";

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

describe("updateItem", () => {
  beforeEach(() => {
    findFirst.mockReset();
    update.mockReset();
  });

  const validData = {
    title: "New title",
    description: "desc",
    content: "code",
    language: "typescript",
    url: undefined,
    tags: ["react", "hooks"],
  };

  it("returns null and skips the write when the item isn't owned", async () => {
    // First findFirst is the ownership check.
    findFirst.mockResolvedValueOnce(null);

    const result = await updateItem("item_1", "user_1", validData);

    expect(result).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  it("scopes the ownership check to the item id and owner", async () => {
    findFirst.mockResolvedValueOnce({ id: "item_1" }); // ownership
    update.mockResolvedValueOnce({});
    findFirst.mockResolvedValueOnce(rawItem()); // getItemDetail re-read

    await updateItem("item_1", "user_1", validData);

    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "item_1",
      userId: "user_1",
    });
  });

  it("replaces tags via set:[] + connectOrCreate and sets defined fields", async () => {
    findFirst.mockResolvedValueOnce({ id: "item_1" });
    update.mockResolvedValueOnce({});
    findFirst.mockResolvedValueOnce(rawItem());

    await updateItem("item_1", "user_1", validData);

    const data = update.mock.calls[0][0].data;
    expect(data.title).toBe("New title");
    expect(data.description).toBe("desc");
    expect(data.content).toBe("code");
    expect(data.language).toBe("typescript");
    // url was undefined, so it must not be written.
    expect("url" in data).toBe(false);
    expect(data.tags).toEqual({
      set: [],
      connectOrCreate: [
        { where: { name: "react" }, create: { name: "react" } },
        { where: { name: "hooks" }, create: { name: "hooks" } },
      ],
    });
  });

  it("writes null when a field is explicitly cleared", async () => {
    findFirst.mockResolvedValueOnce({ id: "item_1" });
    update.mockResolvedValueOnce({});
    findFirst.mockResolvedValueOnce(rawItem());

    await updateItem("item_1", "user_1", {
      title: "x",
      description: null,
      language: null,
      tags: [],
    });

    const data = update.mock.calls[0][0].data;
    expect(data.description).toBeNull();
    expect(data.language).toBeNull();
  });

  it("returns the refreshed ItemDetail after the update", async () => {
    findFirst.mockResolvedValueOnce({ id: "item_1" });
    update.mockResolvedValueOnce({});
    findFirst.mockResolvedValueOnce(rawItem());

    const result = await updateItem("item_1", "user_1", validData);

    expect(result).toMatchObject({ id: "item_1", title: "useDebounce hook" });
  });
});

describe("deleteItem", () => {
  beforeEach(() => {
    deleteMany.mockReset();
  });

  it("scopes the delete to the item id and owner (IDOR guard)", async () => {
    deleteMany.mockResolvedValue({ count: 1 });

    await deleteItem("item_1", "user_1");

    expect(deleteMany).toHaveBeenCalledTimes(1);
    expect(deleteMany.mock.calls[0][0].where).toEqual({
      id: "item_1",
      userId: "user_1",
    });
  });

  it("returns true when a row was deleted", async () => {
    deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteItem("item_1", "user_1")).toBe(true);
  });

  it("returns false when nothing matched (missing or not owned)", async () => {
    deleteMany.mockResolvedValue({ count: 0 });
    expect(await deleteItem("nope", "user_1")).toBe(false);
  });
});
