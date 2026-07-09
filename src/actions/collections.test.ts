import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the session and the query layer so the action's own logic (auth guard,
// validation, error mapping) is exercised without a database.
const { auth, createCollectionQuery } = vi.hoisted(() => ({
  auth: vi.fn(),
  createCollectionQuery: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/db/collections", () => ({
  createCollection: createCollectionQuery,
}));

import { createCollection } from "@/actions/collections";

const created = {
  id: "col_1",
  name: "React Patterns",
  description: null,
  isFavorite: false,
  itemCount: 0,
  itemTypes: [],
};

describe("createCollection action", () => {
  beforeEach(() => {
    auth.mockReset();
    createCollectionQuery.mockReset();
  });

  it("rejects an unauthenticated caller without touching the DB", async () => {
    auth.mockResolvedValue(null);

    const result = await createCollection({ name: "React Patterns" });

    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(createCollectionQuery).not.toHaveBeenCalled();
  });

  it("returns validation issues for a bad payload", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });

    const result = await createCollection({ name: "" });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.issues?.name).toBeDefined();
    expect(createCollectionQuery).not.toHaveBeenCalled();
  });

  it("passes the session's user id and the parsed data to the query", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    createCollectionQuery.mockResolvedValue(created);

    await createCollection({ name: "  React Patterns  ", description: "" });

    expect(createCollectionQuery).toHaveBeenCalledWith("user_1", {
      name: "React Patterns",
      description: null,
    });
  });

  it("ignores a userId supplied by the client", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    createCollectionQuery.mockResolvedValue(created);

    await createCollection({ name: "React Patterns", userId: "user_2" });

    expect(createCollectionQuery).toHaveBeenCalledWith(
      "user_1",
      expect.not.objectContaining({ userId: expect.anything() }),
    );
  });

  it("returns the created collection on success", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    createCollectionQuery.mockResolvedValue(created);

    const result = await createCollection({ name: "React Patterns" });

    expect(result).toEqual({ success: true, data: created });
  });

  it("maps a thrown query error to a generic message", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    createCollectionQuery.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createCollection({ name: "React Patterns" });

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
