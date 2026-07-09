import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma client so the queries run without a database. `vi.hoisted`
// lets the mock factory reference the spies (vi.mock is hoisted above imports).
const { findMany, count, queryRaw } = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  queryRaw: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: { findMany, count },
    $queryRaw: queryRaw,
  },
}));

// The real module pulls in the generated Prisma client; we only need `Prisma.join`
// for the raw tally query, which we never assert on here.
vi.mock("@/generated/prisma/client", () => ({
  Prisma: { join: (ids: string[]) => ids.join(",") },
}));

import {
  getCollectionStats,
  getRecentCollections,
  getSidebarCollections,
} from "@/lib/db/collections";

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
});
