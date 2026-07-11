import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma client so the queries run without a database.
const { findUnique, update } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique, update } },
}));

import {
  getEditorPreferences,
  updateEditorPreferences,
} from "@/lib/db/editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/validations/editor-preferences";

describe("getEditorPreferences", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("returns the defaults when the column is null", async () => {
    findUnique.mockResolvedValue({ editorPreferences: null });
    // Distinct userIds per test avoid React cache() memo collisions.
    await expect(getEditorPreferences("u-null")).resolves.toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
  });

  it("returns the defaults when the user row is missing", async () => {
    findUnique.mockResolvedValue(null);
    await expect(getEditorPreferences("u-missing")).resolves.toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
  });

  it("returns a stored full preferences object as-is", async () => {
    const stored = {
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "github-dark",
    };
    findUnique.mockResolvedValue({ editorPreferences: stored });
    await expect(getEditorPreferences("u-full")).resolves.toEqual(stored);
  });

  it("merges a partial stored object over the defaults", async () => {
    findUnique.mockResolvedValue({ editorPreferences: { theme: "monokai" } });
    await expect(getEditorPreferences("u-partial")).resolves.toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      theme: "monokai",
    });
  });

  it("falls back to the defaults when a stored value is invalid", async () => {
    findUnique.mockResolvedValue({ editorPreferences: { fontSize: 999 } });
    await expect(getEditorPreferences("u-invalid")).resolves.toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
  });

  it("scopes the read to the given user id", async () => {
    findUnique.mockResolvedValue({ editorPreferences: null });
    await getEditorPreferences("u-scope");
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "u-scope" },
      select: { editorPreferences: true },
    });
  });
});

describe("updateEditorPreferences", () => {
  beforeEach(() => {
    update.mockReset();
  });

  it("writes the preferences for the given user and returns them", async () => {
    update.mockResolvedValue({});
    const prefs = {
      fontSize: 13,
      tabSize: 8,
      wordWrap: true,
      minimap: false,
      theme: "vs-dark" as const,
    };

    const result = await updateEditorPreferences("u-1", prefs);

    expect(update).toHaveBeenCalledWith({
      where: { id: "u-1" },
      data: { editorPreferences: prefs },
    });
    expect(result).toEqual(prefs);
  });
});
