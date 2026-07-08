"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";
import { updateItemSchema } from "@/lib/validations/items";

/** Standard server-action result — mirrors the API routes' `{ success }` shape. */
export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      issues?: Record<string, string[] | undefined>;
    };

/**
 * Update an item the signed-in user owns. Validates the payload with Zod (the
 * source of truth), resolves the session, and delegates the write to the
 * owner-scoped query — which returns null for a missing or foreign item, so a
 * user can only edit their own. Returns the refreshed ItemDetail on success.
 */
export async function updateItem(
  itemId: string,
  input: unknown,
): Promise<ActionResult<ItemDetail>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      issues: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const updated = await updateItemQuery(itemId, session.user.id, parsed.data);
    if (!updated) {
      return { success: false, error: "Item not found." };
    }
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update item:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Delete an item the signed-in user owns. Resolves the session, then delegates
 * to the owner-scoped query — which deletes nothing for a missing or foreign
 * item, so a user can only remove their own. Returns a not-found error in that
 * case, or `{ success: true }` when the item was deleted.
 */
export async function deleteItem(
  itemId: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  try {
    const deleted = await deleteItemQuery(itemId, session.user.id);
    if (!deleted) {
      return { success: false, error: "Item not found." };
    }
    return { success: true, data: { id: itemId } };
  } catch (error) {
    console.error("Failed to delete item:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
