import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the session and the query layer so the action's own logic (auth guard,
// validation, error mapping) is exercised without a database.
const { auth, updateQuery } = vi.hoisted(() => ({
  auth: vi.fn(),
  updateQuery: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/db/editor-preferences", () => ({
  updateEditorPreferences: updateQuery,
}));

import { updateEditorPreferences } from "@/actions/editor-preferences";

const validInput = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
};

describe("updateEditorPreferences action", () => {
  beforeEach(() => {
    auth.mockReset();
    updateQuery.mockReset();
  });

  it("rejects an unauthenticated caller without touching the DB", async () => {
    auth.mockResolvedValue(null);

    const result = await updateEditorPreferences(validInput);

    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(updateQuery).not.toHaveBeenCalled();
  });

  it("returns validation issues for a bad payload", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });

    const result = await updateEditorPreferences({ ...validInput, theme: "bad" });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.issues?.theme).toBeDefined();
    expect(updateQuery).not.toHaveBeenCalled();
  });

  it("passes the session's user id and parsed data to the query", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    updateQuery.mockResolvedValue(validInput);

    const result = await updateEditorPreferences(validInput);

    expect(updateQuery).toHaveBeenCalledWith("user_1", validInput);
    expect(result).toEqual({ success: true, data: validInput });
  });

  it("maps a thrown error to a generic failure", async () => {
    auth.mockResolvedValue({ user: { id: "user_1" } });
    updateQuery.mockRejectedValue(new Error("db down"));

    const result = await updateEditorPreferences(validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
