import { z } from "zod";

// Validation for the Monaco editor preferences (Zod). The
// `updateEditorPreferences` server action parses with this before writing, and
// the DB reader parses the stored JSON with it, so it's the source of truth —
// the settings form's controls are UX only.

/** Selectable font sizes (px). */
export const FONT_SIZES = [11, 12, 13, 14, 16, 18] as const;

/** Selectable tab sizes (spaces). */
export const TAB_SIZES = [2, 4, 8] as const;

/** Selectable Monaco themes. `vs-dark` is built-in; the others are registered. */
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

export type EditorTheme = (typeof EDITOR_THEMES)[number];

/** A `z.number()` restricted to the given set of allowed values. */
const numberIn = <const T extends readonly number[]>(values: T) =>
  z.number().refine((n) => (values as readonly number[]).includes(n), {
    message: "Unsupported value",
  });

export const editorPreferencesSchema = z.object({
  fontSize: numberIn(FONT_SIZES),
  tabSize: numberIn(TAB_SIZES),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
});

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>;

/** Applied when a user has never saved preferences (null column). */
export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};
