import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma client so the queries run without a database. `vi.hoisted`
// lets the mock factory reference the spies (vi.mock is hoisted above imports).
const { findMany, findFirst, count, create, queryRaw } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  queryRaw: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: { findMany, findFirst, count, create },
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
  getAllCollections,
  getCollectionDetail,
  getCollectionOptions,
  getCollectionStats,
  getRecentCollections,
  getSidebarCollections,
} from "@/lib/db/collections";

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

  it("getAllCollections scopes to the owner, favorites first, with no limit", async () => {
    findMany.mockResolvedValue([
      { id: "col_1", name: "React Patterns", description: null, isFavorite: true },
    ]);

    await getAllCollections("user_1");

    const args = findMany.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user_1" });
    expect(args.orderBy).toEqual([
      { isFavorite: "desc" },
      { updatedAt: "desc" },
    ]);
    // The page lists every collection — a `take` here would silently truncate it.
    expect(args.take).toBeUndefined();
  });

  it("getAllCollections derives counts and most-used-first types from the tally", async () => {
    findMany.mockResolvedValue([
      { id: "col_1", name: "DevOps", description: null, isFavorite: false },
    ]);
    queryRaw.mockResolvedValue([
      { collectionId: "col_1", typeId: "t_link", typeName: "link", typeColor: "#10b981", typeIcon: "Link", count: 2 },
      { collectionId: "col_1", typeId: "t_cmd", typeName: "command", typeColor: "#f97316", typeIcon: "Terminal", count: 1 },
    ]);

    const [collection] = await getAllCollections("user_1");

    expect(collection.itemCount).toBe(3);
    expect(collection.itemTypes.map((t) => t.name)).toEqual(["link", "command"]);
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the lookup to both the id and the owner", async () => {
    findFirst.mockResolvedValue(null);

    await getCollectionDetail("col_1", "user_1");

    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "col_1",
      userId: "user_1",
    });
  });

  it("returns null for a missing or foreign collection", async () => {
    findFirst.mockResolvedValue(null);

    expect(await getCollectionDetail("col_other", "user_1")).toBeNull();
  });

  it("maps the collection's items through the shared card mapper", async () => {
    findFirst.mockResolvedValue({
      id: "col_1",
      name: "React Patterns",
      description: "Hooks and helpers",
      isFavorite: true,
      items: [{ item: rawItem }],
    });

    const collection = await getCollectionDetail("col_1", "user_1");

    expect(collection).toMatchObject({
      id: "col_1",
      name: "React Patterns",
      description: "Hooks and helpers",
      isFavorite: true,
    });
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

  it("orders items most recently updated first", async () => {
    findFirst.mockResolvedValue({
      id: "col_1",
      name: "React Patterns",
      description: null,
      isFavorite: false,
      items: [],
    });

    await getCollectionDetail("col_1", "user_1");

    expect(findFirst.mock.calls[0][0].select.items.orderBy).toEqual({
      item: { updatedAt: "desc" },
    });
  });

  it("returns an empty item list for a collection with no items", async () => {
    findFirst.mockResolvedValue({
      id: "col_1",
      name: "Empty",
      description: null,
      isFavorite: false,
      items: [],
    });

    const collection = await getCollectionDetail("col_1", "user_1");

    expect(collection?.items).toEqual([]);
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
