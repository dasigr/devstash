"use server";

import { z } from "zod";

import { auth } from "@/auth";
import type { ActionResult } from "@/actions/items";
import { updateEditorPreferences as updateEditorPreferencesQuery } from "@/lib/db/editor-preferences";
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/validations/editor-preferences";

/**
 * Save the signed-in user's Monaco editor preferences. Validates with Zod (the
 * source of truth), resolves the session, and writes for that user — a client
 * can't set preferences on someone else's account since the owner comes from
 * the session, not the payload.
 */
export async function updateEditorPreferences(
  input: unknown,
): Promise<ActionResult<EditorPreferences>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = editorPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      issues: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const saved = await updateEditorPreferencesQuery(
      session.user.id,
      parsed.data,
    );
    return { success: true, data: saved };
  } catch (error) {
    console.error("Failed to update editor preferences:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
