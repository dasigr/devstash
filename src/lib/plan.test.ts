import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma client so the quota checks run without a database. `vi.hoisted`
// lets the mock factory reference the spies (vi.mock is hoisted above imports).
const { itemCount, collectionCount } = vi.hoisted(() => ({
  itemCount: vi.fn(),
  collectionCount: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { count: itemCount },
    collection: { count: collectionCount },
  },
}));

import {
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  PRO_ITEM_TYPES,
  canCreateCollection,
  canCreateItem,
} from "@/lib/plan";

beforeEach(() => {
  itemCount.mockReset();
  collectionCount.mockReset();
});

describe("constants", () => {
  it("uses the documented free-tier caps", () => {
    expect(FREE_ITEM_LIMIT).toBe(50);
    expect(FREE_COLLECTION_LIMIT).toBe(3);
  });

  it("marks file and image as Pro-only types", () => {
    expect(PRO_ITEM_TYPES.has("file")).toBe(true);
    expect(PRO_ITEM_TYPES.has("image")).toBe(true);
    expect(PRO_ITEM_TYPES.has("snippet")).toBe(false);
  });
});

describe("canCreateItem", () => {
  it("allows a free user just under the limit (49)", async () => {
    itemCount.mockResolvedValue(49);
    const result = await canCreateItem("user_1", false);
    expect(result).toEqual({ allowed: true, used: 49, limit: 50 });
    expect(itemCount).toHaveBeenCalledWith({ where: { userId: "user_1" } });
  });

  it("blocks a free user at the limit (50)", async () => {
    itemCount.mockResolvedValue(50);
    const result = await canCreateItem("user_1", false);
    expect(result).toEqual({ allowed: false, used: 50, limit: 50 });
  });

  it("blocks a free user over the limit (51)", async () => {
    itemCount.mockResolvedValue(51);
    const result = await canCreateItem("user_1", false);
    expect(result).toEqual({ allowed: false, used: 51, limit: 50 });
  });

  it("gives Pro users unlimited without querying the count", async () => {
    const result = await canCreateItem("user_1", true);
    expect(result).toEqual({ allowed: true, used: 0, limit: Infinity });
    expect(itemCount).not.toHaveBeenCalled();
  });
});

describe("canCreateCollection", () => {
  it("allows a free user just under the limit (2)", async () => {
    collectionCount.mockResolvedValue(2);
    const result = await canCreateCollection("user_1", false);
    expect(result).toEqual({ allowed: true, used: 2, limit: 3 });
    expect(collectionCount).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
  });

  it("blocks a free user at the limit (3)", async () => {
    collectionCount.mockResolvedValue(3);
    const result = await canCreateCollection("user_1", false);
    expect(result).toEqual({ allowed: false, used: 3, limit: 3 });
  });

  it("blocks a free user over the limit (4)", async () => {
    collectionCount.mockResolvedValue(4);
    const result = await canCreateCollection("user_1", false);
    expect(result).toEqual({ allowed: false, used: 4, limit: 3 });
  });

  it("gives Pro users unlimited without querying the count", async () => {
    const result = await canCreateCollection("user_1", true);
    expect(result).toEqual({ allowed: true, used: 0, limit: Infinity });
    expect(collectionCount).not.toHaveBeenCalled();
  });
});
