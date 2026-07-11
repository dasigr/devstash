import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma client so the queries run without a database. `vi.hoisted`
// lets the mock factory reference the spies (vi.mock is hoisted above imports).
const {
  findMany,
  findFirst,
  findUniqueOrThrow,
  count,
  create,
  updateMany,
  deleteMany,
  queryRaw,
  linkCount,
  linkFindMany,
} = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  queryRaw: vi.fn(),
  // The collection detail page pages its items off the ItemCollection join table.
  linkCount: vi.fn(),
  linkFindMany: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      findMany,
      findFirst,
      findUniqueOrThrow,
      count,
      create,
      updateMany,
      deleteMany,
    },
    itemCollection: { count: linkCount, findMany: linkFindMany },
    $queryRaw: queryRaw,
  },
}));

// The real module pulls in the generated Prisma client; we only need `Prisma.join`
// for the raw tally query, which we never assert on here.
vi.mock("@/generated/prisma/client", () => ({
  Prisma: { join: (ids: string[]) => ids.join(",") },
}));

import {
  createCollection,
  deleteCollection,
  setCollectionFavorite,
  updateCollection,
  getAllCollections,
  getCollectionDetail,
  getCollectionOptions,
  getCollectionStats,
  getFavoriteCollections,
  getRecentCollections,
  getSidebarCollections,
} from "@/lib/db/collections";
import {
  COLLECTIONS_PER_PAGE,
  DASHBOARD_COLLECTIONS_LIMIT,
  ITEMS_PER_PAGE,
} from "@/lib/pagination";

describe("getCollectionOptions", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("returns the given user's collections alphabetically", async () => {
    const options = [
      { id: "col_a", name: "AI Workflows" },
      { id: "col_b", name: "React Patterns" },
    ];
    findMany.mockResolvedValue(options);

    expect(await getCollectionOptions("user_1")).toEqual(options);
    expect(findMany.mock.calls[0][0]).toMatchObject({
      where: { userId: "user_1" },
      orderBy: { name: "asc" },
    });
  });
});

// These queries back the dashboard grid, the stats tiles, and the sidebar. Each
// must filter by userId or a signed-in user sees other people's collections.
describe("owner-scoped collection queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([]);
  });

  it("getRecentCollections scopes to the owner and honors the limit", async () => {
    findMany.mockResolvedValue([
      { id: "col_1", name: "React Patterns", description: null, isFavorite: true },
    ]);

    const collections = await getRecentCollections("user_1", 3);

    expect(findMany.mock.calls[0][0].where).toEqual({ userId: "user_1" });
    expect(findMany.mock.calls[0][0].take).toBe(3);
    expect(collections[0]).toMatchObject({ id: "col_1", itemCount: 0 });
  });

  it("getRecentCollections caps the dashboard grid by default", async () => {
    findMany.mockResolvedValue([]);
    await getRecentCollections("user_1");
    expect(findMany.mock.calls[0][0].take).toBe(DASHBOARD_COLLECTIONS_LIMIT);
  });

  it("getRecentCollections derives counts and most-used-first types from the tally", async () => {
    findMany.mockResolvedValue([
      { id: "col_1", name: "DevOps", description: null, isFavorite: false },
    ]);
    // Rows arrive most-used first from the ORDER BY in the raw query.
    queryRaw.mockResolvedValue([
      { collectionId: "col_1", typeId: "t_link", typeName: "link", typeColor: "#10b981", typeIcon: "Link", count: 2 },
      { collectionId: "col_1", typeId: "t_cmd", typeName: "command", typeColor: "#f97316", typeIcon: "Terminal", count: 1 },
    ]);

    const [collection] = await getRecentCollections("user_1");

    expect(collection.itemCount).toBe(3);
    expect(collection.itemTypes.map((t) => t.name)).toEqual(["link", "command"]);
  });

  it("getCollectionStats counts only the owner's collections, total and favorites", async () => {
    count.mockResolvedValueOnce(5).mockResolvedValueOnce(3);

    expect(await getCollectionStats("user_1")).toEqual({
      total: 5,
      favorites: 3,
    });
    expect(count.mock.calls[0][0].where).toEqual({ userId: "user_1" });
    expect(count.mock.calls[1][0].where).toEqual({
      userId: "user_1",
      isFavorite: true,
    });
  });

  it("getSidebarCollections scopes to the owner, favorites first", async () => {
    findMany.mockResolvedValue([
      { id: "col_1", name: "React Patterns", isFavorite: true },
    ]);

    await getSidebarCollections("user_1", 4);

    const args = findMany.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user_1" });
    expect(args.take).toBe(4);
    expect(args.orderBy).toEqual([
      { isFavorite: "desc" },
      { updatedAt: "desc" },
    ]);
  });

  it("getSidebarCollections colors a collection by its most-used type, null when empty", async () => {
    findMany.mockResolvedValue([
      { id: "col_1", name: "DevOps", isFavorite: false },
      { id: "col_2", name: "Empty", isFavorite: false },
    ]);
    queryRaw.mockResolvedValue([
      { collectionId: "col_1", typeId: "t_link", typeName: "link", typeColor: "#10b981", typeIcon: "Link", count: 2 },
    ]);

    const collections = await getSidebarCollections("user_1");

    expect(collections[0].color).toBe("#10b981");
    expect(collections[1].color).toBeNull();
  });

  it("skips the tally query entirely when the user has no collections", async () => {
    findMany.mockResolvedValue([]);

    expect(await getRecentCollections("user_1")).toEqual([]);
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("getFavoriteCollections scopes to the owner alongside isFavorite, newest first", async () => {
    findMany.mockResolvedValue([
      { id: "col_1", name: "React Patterns", updatedAt: new Date() },
    ]);

    await getFavoriteCollections("user_1");

    const args = findMany.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user_1", isFavorite: true });
    expect(args.orderBy).toEqual({ updatedAt: "desc" });
  });

  it("getFavoriteCollections colors a collection by its most-used type and counts items, null when empty", async () => {
    findMany.mockResolvedValue([
      { id: "col_1", name: "DevOps", updatedAt: new Date() },
      { id: "col_2", name: "Empty", updatedAt: new Date() },
    ]);
    // Rows arrive most-used first from the ORDER BY in the raw query.
    queryRaw.mockResolvedValue([
      { collectionId: "col_1", typeId: "t_link", typeName: "link", typeColor: "#10b981", typeIcon: "Link", count: 2 },
      { collectionId: "col_1", typeId: "t_cmd", typeName: "command", typeColor: "#f97316", typeIcon: "Terminal", count: 1 },
    ]);

    const favorites = await getFavoriteCollections("user_1");

    expect(favorites[0]).toMatchObject({
      id: "col_1",
      color: "#10b981",
      itemCount: 3,
    });
    expect(favorites[1]).toMatchObject({
      id: "col_2",
      color: null,
      itemCount: 0,
    });
  });

  it("getAllCollections scopes to the owner, favorites first, one page at a time", async () => {
    count.mockResolvedValue(1);
    findMany.mockResolvedValue([
      { id: "col_1", name: "React Patterns", description: null, isFavorite: true },
    ]);

    await getAllCollections("user_1");

    expect(count.mock.calls[0][0].where).toEqual({ userId: "user_1" });

    const args = findMany.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user_1" });
    expect(args.orderBy).toEqual([
      { isFavorite: "desc" },
      { updatedAt: "desc" },
    ]);
    // Only this page's rows — never the whole table.
    expect(args.skip).toBe(0);
    expect(args.take).toBe(COLLECTIONS_PER_PAGE);
  });

  it("getAllCollections skips into the requested page", async () => {
    count.mockResolvedValue(45);
    findMany.mockResolvedValue([]);

    const { pagination } = await getAllCollections("user_1", 3);

    expect(findMany.mock.calls[0][0].skip).toBe(2 * COLLECTIONS_PER_PAGE);
    expect(pagination).toMatchObject({
      page: 3,
      totalCount: 45,
      totalPages: 3,
      hasPrev: true,
      hasNext: false,
    });
  });

  it("getAllCollections clamps a page past the end back to the last page", async () => {
    count.mockResolvedValue(25);
    findMany.mockResolvedValue([]);

    const { pagination } = await getAllCollections("user_1", 99);

    // Page 2 of 2, not an empty grid far past the end.
    expect(pagination.page).toBe(2);
    expect(findMany.mock.calls[0][0].skip).toBe(COLLECTIONS_PER_PAGE);
  });

  it("getAllCollections derives counts and most-used-first types from the tally", async () => {
    count.mockResolvedValue(1);
    findMany.mockResolvedValue([
      { id: "col_1", name: "DevOps", description: null, isFavorite: false },
    ]);
    queryRaw.mockResolvedValue([
      { collectionId: "col_1", typeId: "t_link", typeName: "link", typeColor: "#10b981", typeIcon: "Link", count: 2 },
      { collectionId: "col_1", typeId: "t_cmd", typeName: "command", typeColor: "#f97316", typeIcon: "Terminal", count: 1 },
    ]);

    const { collections } = await getAllCollections("user_1");

    expect(collections[0].itemCount).toBe(3);
    expect(collections[0].itemTypes.map((t) => t.name)).toEqual([
      "link",
      "command",
    ]);
  });
});

// The detail page must never render another user's collection, and must not
// reveal whether a collection it can't show actually exists.
describe("getCollectionDetail", () => {
  const rawItem = {
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
    itemType: { id: "t_snip", name: "snippet", color: "#3b82f6", icon: "Code" },
    tags: [{ name: "react" }, { name: "hooks" }],
  };

  const collectionRow = {
    id: "col_1",
    name: "React Patterns",
    description: "Hooks and helpers",
    isFavorite: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    linkCount.mockResolvedValue(0);
    linkFindMany.mockResolvedValue([]);
  });

  it("scopes the lookup to both the id and the owner", async () => {
    findFirst.mockResolvedValue(null);

    await getCollectionDetail("col_1", "user_1");

    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "col_1",
      userId: "user_1",
    });
  });

  it("returns null for a missing or foreign collection without touching items", async () => {
    findFirst.mockResolvedValue(null);

    expect(await getCollectionDetail("col_other", "user_1")).toBeNull();
    expect(linkCount).not.toHaveBeenCalled();
    expect(linkFindMany).not.toHaveBeenCalled();
  });

  it("maps the collection's items through the shared card mapper", async () => {
    findFirst.mockResolvedValue(collectionRow);
    linkCount.mockResolvedValue(1);
    linkFindMany.mockResolvedValue([{ item: rawItem }]);

    const collection = await getCollectionDetail("col_1", "user_1");

    expect(collection).toMatchObject(collectionRow);
    expect(collection?.items).toHaveLength(1);
    expect(collection?.items[0]).toMatchObject({
      id: "item_1",
      title: "useDebounce hook",
      // Preview is derived from the content type, and tags are flattened.
      preview: "export function useDebounce() {}",
      tags: ["react", "hooks"],
      updatedAt: "just now",
      itemType: { name: "snippet", color: "#3b82f6" },
    });
  });

  it("fetches only the requested page of items, most recently updated first", async () => {
    findFirst.mockResolvedValue(collectionRow);
    linkCount.mockResolvedValue(50);

    const collection = await getCollectionDetail("col_1", "user_1", 2);

    expect(linkCount.mock.calls[0][0].where).toEqual({ collectionId: "col_1" });

    const args = linkFindMany.mock.calls[0][0];
    expect(args.where).toEqual({ collectionId: "col_1" });
    expect(args.orderBy).toEqual({ item: { updatedAt: "desc" } });
    // A 50-item collection must not load all 50 to render 20.
    expect(args.skip).toBe(ITEMS_PER_PAGE);
    expect(args.take).toBe(ITEMS_PER_PAGE);
    expect(collection?.pagination).toMatchObject({
      page: 2,
      totalCount: 50,
      totalPages: 3,
      hasPrev: true,
      hasNext: true,
    });
  });

  it("clamps a page past the end back to the last page", async () => {
    findFirst.mockResolvedValue(collectionRow);
    linkCount.mockResolvedValue(25);

    const collection = await getCollectionDetail("col_1", "user_1", 99);

    expect(collection?.pagination.page).toBe(2);
    expect(linkFindMany.mock.calls[0][0].skip).toBe(ITEMS_PER_PAGE);
  });

  it("returns an empty item list for a collection with no items", async () => {
    findFirst.mockResolvedValue({ ...collectionRow, name: "Empty" });

    const collection = await getCollectionDetail("col_1", "user_1");

    expect(collection?.items).toEqual([]);
    expect(collection?.pagination).toMatchObject({
      page: 1,
      totalCount: 0,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    });
  });
});

describe("createCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("connects the collection to the owning user", async () => {
    create.mockResolvedValue({
      id: "col_1",
      name: "React Patterns",
      description: null,
      isFavorite: false,
    });

    await createCollection("user_1", { name: "React Patterns" });

    const args = create.mock.calls[0][0];
    expect(args.data.name).toBe("React Patterns");
    expect(args.data.user).toEqual({ connect: { id: "user_1" } });
  });

  it("stores a missing description as null", async () => {
    create.mockResolvedValue({
      id: "col_1",
      name: "React Patterns",
      description: null,
      isFavorite: false,
    });

    await createCollection("user_1", { name: "React Patterns" });

    expect(create.mock.calls[0][0].data.description).toBeNull();
  });

  it("returns a dashboard-shaped collection with no items", async () => {
    create.mockResolvedValue({
      id: "col_1",
      name: "React Patterns",
      description: "Hooks and helpers",
      isFavorite: false,
    });

    const collection = await createCollection("user_1", {
      name: "React Patterns",
      description: "Hooks and helpers",
    });

    expect(collection).toEqual({
      id: "col_1",
      name: "React Patterns",
      description: "Hooks and helpers",
      isFavorite: false,
      itemCount: 0,
      itemTypes: [],
    });
  });

  it("does not run the tally query for a brand-new collection", async () => {
    create.mockResolvedValue({
      id: "col_1",
      name: "React Patterns",
      description: null,
      isFavorite: false,
    });

    await createCollection("user_1", { name: "React Patterns" });

    expect(queryRaw).not.toHaveBeenCalled();
  });
});

describe("updateCollection", () => {
  beforeEach(() => {
    updateMany.mockReset();
    findUniqueOrThrow.mockReset();
    queryRaw.mockReset();
  });

  it("scopes the write to the id and the owner", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    findUniqueOrThrow.mockResolvedValue({
      id: "col_1",
      name: "Renamed",
      description: "New description",
      isFavorite: false,
    });
    queryRaw.mockResolvedValue([]);

    await updateCollection("col_1", "user_1", {
      name: "Renamed",
      description: "New description",
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "col_1", userId: "user_1" },
      data: { name: "Renamed", description: "New description" },
    });
  });

  it("returns null without re-reading when nothing matched", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const result = await updateCollection("col_other", "user_1", {
      name: "Renamed",
    });

    expect(result).toBeNull();
    expect(findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("clears the description when it is omitted or null", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    findUniqueOrThrow.mockResolvedValue({
      id: "col_1",
      name: "Renamed",
      description: null,
      isFavorite: false,
    });
    queryRaw.mockResolvedValue([]);

    await updateCollection("col_1", "user_1", { name: "Renamed" });

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: "Renamed", description: null } }),
    );
  });

  it("returns the refreshed card shape with its type tally", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    findUniqueOrThrow.mockResolvedValue({
      id: "col_1",
      name: "Renamed",
      description: null,
      isFavorite: true,
    });
    queryRaw.mockResolvedValue([
      {
        collectionId: "col_1",
        typeId: "t_snippet",
        typeName: "snippet",
        typeColor: "#3b82f6",
        typeIcon: "Code",
        count: 3,
      },
      {
        collectionId: "col_1",
        typeId: "t_note",
        typeName: "note",
        typeColor: "#fde047",
        typeIcon: "StickyNote",
        count: 1,
      },
    ]);

    const result = await updateCollection("col_1", "user_1", {
      name: "Renamed",
    });

    expect(result).toEqual({
      id: "col_1",
      name: "Renamed",
      description: null,
      isFavorite: true,
      itemCount: 4,
      itemTypes: [
        { id: "t_snippet", name: "snippet", color: "#3b82f6", icon: "Code" },
        { id: "t_note", name: "note", color: "#fde047", icon: "StickyNote" },
      ],
    });
  });
});

describe("deleteCollection", () => {
  beforeEach(() => {
    deleteMany.mockReset();
  });

  it("scopes the delete to the id and the owner", async () => {
    deleteMany.mockResolvedValue({ count: 1 });

    await deleteCollection("col_1", "user_1");

    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: "col_1", userId: "user_1" },
    });
  });

  it("reports true when a row was deleted", async () => {
    deleteMany.mockResolvedValue({ count: 1 });

    await expect(deleteCollection("col_1", "user_1")).resolves.toBe(true);
  });

  it("reports false for an unknown or foreign collection", async () => {
    deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteCollection("col_other", "user_1")).resolves.toBe(false);
  });
});

describe("setCollectionFavorite", () => {
  beforeEach(() => {
    updateMany.mockReset();
  });

  it("scopes the update to the id and the owner (IDOR guard)", async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await setCollectionFavorite("col_1", "user_1", true);

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "col_1", userId: "user_1" },
      data: { isFavorite: true },
    });
  });

  it("reports true when a row was updated", async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await expect(setCollectionFavorite("col_1", "user_1", false)).resolves.toBe(
      true,
    );
  });

  it("reports false for an unknown or foreign collection", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(
      setCollectionFavorite("col_other", "user_1", true),
    ).resolves.toBe(false);
  });
});
