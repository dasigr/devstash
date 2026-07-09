import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma client so the query runs without a database. `vi.hoisted`
// lets the mock factory reference the spy (vi.mock is hoisted above imports).
const {
  findFirst,
  update,
  deleteMany,
  create,
  findMany,
  count,
  typeFindFirst,
  typeFindMany,
  collectionFindMany,
} = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  deleteMany: vi.fn(),
  create: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  typeFindFirst: vi.fn(),
  typeFindMany: vi.fn(),
  collectionFindMany: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findFirst, update, deleteMany, create, findMany, count },
    itemType: { findFirst: typeFindFirst, findMany: typeFindMany },
    collection: { findMany: collectionFindMany },
  },
}));

// Mock R2 so deleteItem's storage cleanup runs without AWS. r2KeyFromUrl returns
// a stub key for any non-empty url so we can assert deleteFromR2 is called.
const { deleteFromR2, r2KeyFromUrl } = vi.hoisted(() => ({
  deleteFromR2: vi.fn(),
  r2KeyFromUrl: vi.fn((url: string) => (url ? "items/u/obj" : null)),
}));
vi.mock("@/lib/r2", () => ({ deleteFromR2, r2KeyFromUrl }));

import {
  createItem,
  deleteItem,
  getItemDetail,
  getItemFile,
  getItemStats,
  getItemsByType,
  getPinnedItems,
  getRecentItems,
  getSidebarItemTypes,
  updateItem,
} from "@/lib/db/items";

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
    fileUrl: null,
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
    collectionFindMany.mockReset();
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

  it("leaves collection membership untouched when collectionIds is omitted", async () => {
    findFirst.mockResolvedValueOnce({ id: "item_1" });
    update.mockResolvedValueOnce({});
    findFirst.mockResolvedValueOnce(rawItem());

    await updateItem("item_1", "user_1", validData);

    expect("collections" in update.mock.calls[0][0].data).toBe(false);
    expect(collectionFindMany).not.toHaveBeenCalled();
  });

  it("replaces membership, scoping the collection lookup to the owner", async () => {
    findFirst.mockResolvedValueOnce({ id: "item_1" });
    collectionFindMany.mockResolvedValueOnce([{ id: "col_a" }, { id: "col_b" }]);
    update.mockResolvedValueOnce({});
    findFirst.mockResolvedValueOnce(rawItem());

    await updateItem("item_1", "user_1", {
      ...validData,
      collectionIds: ["col_a", "col_b"],
    });

    expect(collectionFindMany.mock.calls[0][0].where).toEqual({
      id: { in: ["col_a", "col_b"] },
      userId: "user_1",
    });
    expect(update.mock.calls[0][0].data.collections).toEqual({
      deleteMany: {},
      create: [
        { collection: { connect: { id: "col_a" } } },
        { collection: { connect: { id: "col_b" } } },
      ],
    });
  });

  it("drops collection ids the user doesn't own", async () => {
    findFirst.mockResolvedValueOnce({ id: "item_1" });
    // Only col_mine survives the owner-scoped lookup.
    collectionFindMany.mockResolvedValueOnce([{ id: "col_mine" }]);
    update.mockResolvedValueOnce({});
    findFirst.mockResolvedValueOnce(rawItem());

    await updateItem("item_1", "user_1", {
      ...validData,
      collectionIds: ["col_mine", "col_someone_elses"],
    });

    expect(update.mock.calls[0][0].data.collections.create).toEqual([
      { collection: { connect: { id: "col_mine" } } },
    ]);
  });

  it("clears membership when given an empty collectionIds, without a lookup", async () => {
    findFirst.mockResolvedValueOnce({ id: "item_1" });
    update.mockResolvedValueOnce({});
    findFirst.mockResolvedValueOnce(rawItem());

    await updateItem("item_1", "user_1", { ...validData, collectionIds: [] });

    expect(collectionFindMany).not.toHaveBeenCalled();
    expect(update.mock.calls[0][0].data.collections).toEqual({
      deleteMany: {},
      create: [],
    });
  });
});

describe("createItem", () => {
  beforeEach(() => {
    typeFindFirst.mockReset();
    create.mockReset();
    findFirst.mockReset();
    collectionFindMany.mockReset();
  });

  const snippetData = {
    type: "snippet" as const,
    title: "New snippet",
    description: "desc",
    content: "code here",
    language: "typescript",
    url: null,
    tags: ["react", "hooks"],
    collectionIds: [],
  };

  it("returns null when the system type can't be resolved", async () => {
    typeFindFirst.mockResolvedValue(null);

    const result = await createItem("user_1", snippetData);

    expect(result).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("resolves the chosen system type by name", async () => {
    typeFindFirst.mockResolvedValue({ id: "type_snippet" });
    create.mockResolvedValue({ id: "item_new" });
    findFirst.mockResolvedValue(rawItem({ id: "item_new" }));

    await createItem("user_1", snippetData);

    expect(typeFindFirst.mock.calls[0][0].where).toEqual({
      isSystem: true,
      name: "snippet",
    });
  });

  it("creates a TEXT item connecting owner, type, and tags", async () => {
    typeFindFirst.mockResolvedValue({ id: "type_snippet" });
    create.mockResolvedValue({ id: "item_new" });
    findFirst.mockResolvedValue(rawItem({ id: "item_new" }));

    await createItem("user_1", snippetData);

    const data = create.mock.calls[0][0].data;
    expect(data.title).toBe("New snippet");
    expect(data.contentType).toBe("TEXT");
    expect(data.content).toBe("code here");
    expect(data.language).toBe("typescript");
    expect(data.url).toBeNull();
    expect(data.user).toEqual({ connect: { id: "user_1" } });
    expect(data.itemType).toEqual({ connect: { id: "type_snippet" } });
    expect(data.tags).toEqual({
      connectOrCreate: [
        { where: { name: "react" }, create: { name: "react" } },
        { where: { name: "hooks" }, create: { name: "hooks" } },
      ],
    });
  });

  it("stores a file item as a FILE-content-type item with file metadata", async () => {
    typeFindFirst.mockResolvedValue({ id: "type_file" });
    create.mockResolvedValue({ id: "item_file" });
    findFirst.mockResolvedValue(rawItem({ id: "item_file" }));

    await createItem("user_1", {
      type: "file",
      title: "Report",
      description: null,
      content: null,
      language: null,
      url: null,
      fileUrl: "https://pub.example.com/items/u/report.pdf",
      fileName: "report.pdf",
      fileSize: 12345,
      tags: [],
      collectionIds: [],
    });

    const data = create.mock.calls[0][0].data;
    expect(data.contentType).toBe("FILE");
    expect(data.fileUrl).toBe("https://pub.example.com/items/u/report.pdf");
    expect(data.fileName).toBe("report.pdf");
    expect(data.fileSize).toBe(12345);
  });

  it("stores a link as a URL-content-type item", async () => {
    typeFindFirst.mockResolvedValue({ id: "type_link" });
    create.mockResolvedValue({ id: "item_link" });
    findFirst.mockResolvedValue(rawItem({ id: "item_link" }));

    await createItem("user_1", {
      type: "link",
      title: "Docs",
      description: null,
      content: null,
      language: null,
      url: "https://example.com",
      tags: [],
      collectionIds: [],
    });

    const data = create.mock.calls[0][0].data;
    expect(data.contentType).toBe("URL");
    expect(data.url).toBe("https://example.com");
  });

  it("returns the created item's detail", async () => {
    typeFindFirst.mockResolvedValue({ id: "type_snippet" });
    create.mockResolvedValue({ id: "item_new" });
    findFirst.mockResolvedValue(rawItem({ id: "item_new" }));

    const result = await createItem("user_1", snippetData);

    expect(result).toMatchObject({ id: "item_new" });
    // Detail is re-read scoped to the new id and the owner.
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "item_new",
      userId: "user_1",
    });
  });

  it("links only the collections the user owns", async () => {
    typeFindFirst.mockResolvedValue({ id: "type_snippet" });
    // col_theirs belongs to another user, so the lookup doesn't return it.
    collectionFindMany.mockResolvedValue([{ id: "col_mine" }]);
    create.mockResolvedValue({ id: "item_new" });
    findFirst.mockResolvedValue(rawItem({ id: "item_new" }));

    await createItem("user_1", {
      ...snippetData,
      collectionIds: ["col_mine", "col_theirs"],
    });

    expect(collectionFindMany.mock.calls[0][0].where).toEqual({
      id: { in: ["col_mine", "col_theirs"] },
      userId: "user_1",
    });
    expect(create.mock.calls[0][0].data.collections).toEqual({
      create: [{ collection: { connect: { id: "col_mine" } } }],
    });
  });

  it("creates no collection links (and runs no lookup) when none are chosen", async () => {
    typeFindFirst.mockResolvedValue({ id: "type_snippet" });
    create.mockResolvedValue({ id: "item_new" });
    findFirst.mockResolvedValue(rawItem({ id: "item_new" }));

    await createItem("user_1", snippetData);

    expect(collectionFindMany).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].data.collections).toEqual({ create: [] });
  });
});

describe("deleteItem", () => {
  beforeEach(() => {
    findFirst.mockReset();
    deleteMany.mockReset();
    deleteFromR2.mockReset();
    r2KeyFromUrl.mockClear();
  });

  it("returns false and skips the delete when the item isn't owned", async () => {
    findFirst.mockResolvedValue(null);

    expect(await deleteItem("nope", "user_1")).toBe(false);
    expect(deleteMany).not.toHaveBeenCalled();
    expect(deleteFromR2).not.toHaveBeenCalled();
  });

  it("scopes both the lookup and delete to the item id and owner (IDOR guard)", async () => {
    findFirst.mockResolvedValue({ fileUrl: null });
    deleteMany.mockResolvedValue({ count: 1 });

    await deleteItem("item_1", "user_1");

    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "item_1",
      userId: "user_1",
    });
    expect(deleteMany.mock.calls[0][0].where).toEqual({
      id: "item_1",
      userId: "user_1",
    });
  });

  it("returns true and skips R2 for a text item (no fileUrl)", async () => {
    findFirst.mockResolvedValue({ fileUrl: null });
    deleteMany.mockResolvedValue({ count: 1 });

    expect(await deleteItem("item_1", "user_1")).toBe(true);
    expect(deleteFromR2).not.toHaveBeenCalled();
  });

  it("deletes the backing R2 object for a file item", async () => {
    findFirst.mockResolvedValue({
      fileUrl: "https://pub.example.com/items/u/report.pdf",
    });
    deleteMany.mockResolvedValue({ count: 1 });

    expect(await deleteItem("item_1", "user_1")).toBe(true);
    expect(deleteFromR2).toHaveBeenCalledWith("items/u/obj");
  });

  it("still succeeds when R2 cleanup throws (best-effort)", async () => {
    findFirst.mockResolvedValue({
      fileUrl: "https://pub.example.com/items/u/report.pdf",
    });
    deleteMany.mockResolvedValue({ count: 1 });
    deleteFromR2.mockRejectedValue(new Error("R2 down"));

    expect(await deleteItem("item_1", "user_1")).toBe(true);
  });
});

describe("getItemFile", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("scopes the lookup to the item id and owner (IDOR guard)", async () => {
    findFirst.mockResolvedValue({ fileUrl: "https://x/y.pdf", fileName: "y.pdf" });
    await getItemFile("item_1", "user_1");

    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "item_1",
      userId: "user_1",
    });
  });

  it("returns the file when present", async () => {
    findFirst.mockResolvedValue({ fileUrl: "https://x/y.pdf", fileName: "y.pdf" });
    expect(await getItemFile("item_1", "user_1")).toEqual({
      fileUrl: "https://x/y.pdf",
      fileName: "y.pdf",
    });
  });

  it("returns null when the item is missing or has no file", async () => {
    findFirst.mockResolvedValue(null);
    expect(await getItemFile("nope", "user_1")).toBeNull();

    findFirst.mockResolvedValue({ fileUrl: null, fileName: null });
    expect(await getItemFile("item_1", "user_1")).toBeNull();
  });

  it("defaults the filename when the stored name is null", async () => {
    findFirst.mockResolvedValue({ fileUrl: "https://x/y", fileName: null });
    expect(await getItemFile("item_1", "user_1")).toEqual({
      fileUrl: "https://x/y",
      fileName: "download",
    });
  });
});

/** A raw item matching the shape the list queries (`itemSelect`) return. */
function rawListItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item_1",
    title: "useDebounce hook",
    contentType: "TEXT",
    content: "export function useDebounce() {}",
    url: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    description: null,
    isPinned: true,
    isFavorite: false,
    updatedAt: new Date(),
    itemType: {
      id: "type_snippet",
      name: "snippet",
      color: "#3b82f6",
      icon: "Code",
    },
    tags: [{ name: "react" }],
    ...overrides,
  };
}

// These queries back the dashboard, sidebar, and /items/[type] listing. Each one
// must filter by userId or a signed-in user sees other people's stash.
describe("owner-scoped read queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPinnedItems scopes to the owner alongside isPinned", async () => {
    findMany.mockResolvedValue([rawListItem()]);
    await getPinnedItems("user_1");
    expect(findMany.mock.calls[0][0].where).toEqual({
      userId: "user_1",
      isPinned: true,
    });
  });

  it("getRecentItems scopes to the owner and honors the limit", async () => {
    findMany.mockResolvedValue([]);
    await getRecentItems("user_1", 5);
    expect(findMany.mock.calls[0][0].where).toEqual({ userId: "user_1" });
    expect(findMany.mock.calls[0][0].take).toBe(5);
  });

  it("getItemStats counts only the owner's items, total and favorites", async () => {
    count.mockResolvedValueOnce(7).mockResolvedValueOnce(2);
    expect(await getItemStats("user_1")).toEqual({ total: 7, favorites: 2 });
    expect(count.mock.calls[0][0].where).toEqual({ userId: "user_1" });
    expect(count.mock.calls[1][0].where).toEqual({
      userId: "user_1",
      isFavorite: true,
    });
  });

  it("getSidebarItemTypes filters the relation count by owner, not the types", async () => {
    typeFindMany.mockResolvedValue([
      {
        id: "type_snippet",
        name: "snippet",
        color: "#3b82f6",
        icon: "Code",
        _count: { items: 3 },
      },
    ]);
    const types = await getSidebarItemTypes("user_1");

    const args = typeFindMany.mock.calls[0][0];
    // System types are global — the type rows themselves aren't owner-filtered.
    expect(args.where).toEqual({ isSystem: true });
    expect(args.select._count.select.items).toEqual({
      where: { userId: "user_1" },
    });
    expect(types[0].count).toBe(3);
  });

  it("getItemsByType scopes items to the owner and the resolved type", async () => {
    typeFindFirst.mockResolvedValue({
      id: "type_snippet",
      name: "snippet",
      color: "#3b82f6",
      icon: "Code",
    });
    findMany.mockResolvedValue([rawListItem()]);

    const listing = await getItemsByType("snippets", "user_1");

    expect(findMany.mock.calls[0][0].where).toEqual({
      userId: "user_1",
      itemTypeId: "type_snippet",
    });
    expect(listing?.type.slug).toBe("snippets");
    expect(listing?.items).toHaveLength(1);
  });

  it("getItemsByType returns null for an unknown slug without querying items", async () => {
    typeFindFirst.mockResolvedValue(null);
    expect(await getItemsByType("bogus", "user_1")).toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("getItemsByType returns an empty listing (not null) when the user owns none", async () => {
    typeFindFirst.mockResolvedValue({
      id: "type_note",
      name: "note",
      color: "#fde047",
      icon: "StickyNote",
    });
    findMany.mockResolvedValue([]);

    const listing = await getItemsByType("notes", "user_1");
    expect(listing?.items).toEqual([]);
    expect(listing?.type.name).toBe("Notes");
  });
});
