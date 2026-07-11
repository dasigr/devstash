import { cache } from "react";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_EDITOR_PREFERENCES,
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/validations/editor-preferences";

/**
 * Load the user's Monaco editor preferences, merged over the defaults. The
 * stored JSON is parsed with the schema so an absent column, a partial object,
 * or an invalid/legacy value all degrade gracefully to the defaults (per field
 * for missing keys; wholesale for invalid ones). Wrapped in `cache()` so a page
 * that reads prefs alongside `generateMetadata` shares one query per request.
 */
export const getEditorPreferences = cache(
  async (userId: string): Promise<EditorPreferences> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { editorPreferences: true },
    });

    const stored = user?.editorPreferences;
    // Fill missing keys from defaults; unknown keys are stripped by the schema.
    const merged = { ...DEFAULT_EDITOR_PREFERENCES, ...(stored as object) };
    const parsed = editorPreferencesSchema.safeParse(merged);
    return parsed.success ? parsed.data : DEFAULT_EDITOR_PREFERENCES;
  },
);

/**
 * Persist the user's editor preferences (owner-scoped by the caller's session).
 * Expects an already-validated `EditorPreferences`; returns what was saved.
 */
export async function updateEditorPreferences(
  userId: string,
  prefs: EditorPreferences,
): Promise<EditorPreferences> {
  await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: prefs },
  });
  return prefs;
}
