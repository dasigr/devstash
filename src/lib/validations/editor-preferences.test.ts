import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  EDITOR_THEMES,
  FONT_SIZES,
  TAB_SIZES,
  editorPreferencesSchema,
} from "@/lib/validations/editor-preferences";

const valid = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
};

describe("editorPreferencesSchema", () => {
  it("parses a fully-valid preferences object", () => {
    const result = editorPreferencesSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(valid);
  });

  it("rejects a font size outside the allowed set", () => {
    expect(
      editorPreferencesSchema.safeParse({ ...valid, fontSize: 15 }).success,
    ).toBe(false);
  });

  it("rejects a tab size outside the allowed set", () => {
    expect(
      editorPreferencesSchema.safeParse({ ...valid, tabSize: 3 }).success,
    ).toBe(false);
  });

  it("rejects an unknown theme", () => {
    expect(
      editorPreferencesSchema.safeParse({ ...valid, theme: "solarized" })
        .success,
    ).toBe(false);
  });

  it("rejects non-boolean toggles", () => {
    expect(
      editorPreferencesSchema.safeParse({ ...valid, wordWrap: "yes" }).success,
    ).toBe(false);
    expect(
      editorPreferencesSchema.safeParse({ ...valid, minimap: 1 }).success,
    ).toBe(false);
  });

  it("requires every field (rejects a partial object)", () => {
    expect(
      editorPreferencesSchema.safeParse({ theme: "vs-dark" }).success,
    ).toBe(false);
  });

  it("strips unknown keys", () => {
    const result = editorPreferencesSchema.safeParse({
      ...valid,
      extra: "nope",
    });
    expect(result.success).toBe(true);
    if (result.success) expect("extra" in result.data).toBe(false);
  });
});

describe("editor preference constants", () => {
  it("exposes the documented option sets", () => {
    expect(FONT_SIZES).toEqual([11, 12, 13, 14, 16, 18]);
    expect(TAB_SIZES).toEqual([2, 4, 8]);
    expect(EDITOR_THEMES).toEqual(["vs-dark", "monokai", "github-dark"]);
  });

  it("has defaults that are valid and match the spec", () => {
    expect(editorPreferencesSchema.safeParse(DEFAULT_EDITOR_PREFERENCES).success).toBe(
      true,
    );
    expect(DEFAULT_EDITOR_PREFERENCES).toEqual({
      fontSize: 12,
      tabSize: 2,
      wordWrap: true,
      minimap: false,
      theme: "vs-dark",
    });
  });
});
