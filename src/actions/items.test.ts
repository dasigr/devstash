import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the session and the query layer so the action's own logic (auth guard,
// validation, error mapping) is exercised without a database.
const { auth, createItemQuery, updateItemQuery, deleteItemQuery } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    createItemQuery: vi.fn(),
    updateItemQuery: vi.fn(),
    deleteItemQuery: vi.fn(),
  }),
);
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/db/items", () => ({
  createItem: createItemQuery,
  updateItem: updateItemQuery,
  deleteItem: deleteItemQuery,
}));

import { createItem, deleteItem, updateItem } from "@/actions/items";

const validInput = { title: "Updated", tags: ["react"] };

describe("createItem action", () => {
  const validCreate = { type: "snippet", title: "New", tags: ["react"] };

  beforeEach(() => {
    auth.mockReset();
    createItemQuery.mockReset();
  });

  it("rejects an unauthenticated caller without touching the DB", async () => {
    auth.mockResolvedValue(null);

    const result = await createItem(validCreate);

    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("returns validation issues for a bad payload", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });

    const result = await createItem({ type: "link", title: "x" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.url).toBeDefined();
    }
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("passes the parsed data and owner id to the query", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    createItemQuery.mockResolvedValue({ id: "item_new", title: "New" });

    await createItem({ type: "snippet", title: "  New  ", tags: [" react ", ""] });

    expect(createItemQuery).toHaveBeenCalledWith("user_1", {
      type: "snippet",
      title: "New",
      tags: ["react"],
    });
  });

  it("maps an unresolved type (null) to a generic error", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    createItemQuery.mockResolvedValue(null);

    const result = await createItem(validCreate);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("returns the created detail on success", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    const detail = { id: "item_new", title: "New" };
    createItemQuery.mockResolvedValue(detail);

    const result = await createItem(validCreate);

    expect(result).toEqual({ success: true, data: detail });
  });

  it("returns a generic error when the query throws", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    createItemQuery.mockRejectedValue(new Error("db down"));

    const result = await createItem(validCreate);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("updateItem action", () => {
  beforeEach(() => {
    auth.mockReset();
    updateItemQuery.mockReset();
  });

  it("rejects an unauthenticated caller without touching the DB", async () => {
    auth.mockResolvedValue(null);

    const result = await updateItem("item_1", validInput);

    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("returns validation issues for a bad payload", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });

    const result = await updateItem("item_1", { title: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues?.title).toBeDefined();
    }
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("passes the parsed data and owner id to the query", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    updateItemQuery.mockResolvedValue({ id: "item_1", title: "Updated" });

    await updateItem("item_1", { title: "  Updated  ", tags: [" react ", ""] });

    expect(updateItemQuery).toHaveBeenCalledWith("item_1", "user_1", {
      title: "Updated",
      tags: ["react"],
    });
  });

  it("maps a missing/foreign item to a not-found error", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    updateItemQuery.mockResolvedValue(null);

    const result = await updateItem("item_1", validInput);

    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns the updated detail on success", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    const detail = { id: "item_1", title: "Updated" };
    updateItemQuery.mockResolvedValue(detail);

    const result = await updateItem("item_1", validInput);

    expect(result).toEqual({ success: true, data: detail });
  });

  it("returns a generic error when the query throws", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    updateItemQuery.mockRejectedValue(new Error("db down"));

    const result = await updateItem("item_1", validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("deleteItem action", () => {
  beforeEach(() => {
    auth.mockReset();
    deleteItemQuery.mockReset();
  });

  it("rejects an unauthenticated caller without touching the DB", async () => {
    auth.mockResolvedValue(null);

    const result = await deleteItem("item_1");

    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(deleteItemQuery).not.toHaveBeenCalled();
  });

  it("passes the item id and owner id to the query", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    deleteItemQuery.mockResolvedValue(true);

    await deleteItem("item_1");

    expect(deleteItemQuery).toHaveBeenCalledWith("item_1", "user_1");
  });

  it("maps a missing/foreign item to a not-found error", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    deleteItemQuery.mockResolvedValue(false);

    const result = await deleteItem("item_1");

    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns the deleted item id on success", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    deleteItemQuery.mockResolvedValue(true);

    const result = await deleteItem("item_1");

    expect(result).toEqual({ success: true, data: { id: "item_1" } });
  });

  it("returns a generic error when the query throws", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    deleteItemQuery.mockRejectedValue(new Error("db down"));

    const result = await deleteItem("item_1");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
