import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the session and the query layer so the action's own logic (auth guard,
// validation, error mapping) is exercised without a database.
const { auth, updateItemQuery } = vi.hoisted(() => ({
  auth: vi.fn(),
  updateItemQuery: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/db/items", () => ({ updateItem: updateItemQuery }));

import { updateItem } from "@/actions/items";

const validInput = { title: "Updated", tags: ["react"] };

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
