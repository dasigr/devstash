"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getCardItemsPage,
  setItemFavorite as setItemFavoriteQuery,
  setItemPin as setItemPinQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import type { DashboardItem, ItemDetail } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { canCreateItem } from "@/lib/plan";
import { parsePageParam } from "@/lib/pagination";
import { createItemSchema, updateItemSchema } from "@/lib/validations/items";

/** Standard server-action result — mirrors the API routes' `{ success }` shape. */
export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      issues?: Record<string, string[] | undefined>;
    };

/**
 * Create a new item for the signed-in user. Validates the payload with Zod (the
 * source of truth), resolves the session, and delegates the write to the query,
 * which returns the created item's ItemDetail. A null result means the chosen
 * system type couldn't be resolved — surfaced as a generic error.
 */
export async function createItem(
  input: unknown,
): Promise<ActionResult<ItemDetail>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      issues: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // Enforce the free-tier item cap before any write; `isPro` also gates the
  // file/image (Pro-only) types in the query below.
  const user = await getCurrentUser();
  const isPro = user?.isPro ?? false;
  const { allowed } = await canCreateItem(session.user.id, isPro);
  if (!allowed) {
    return {
      success: false,
      error: "Free plan is limited to 50 items. Upgrade to Pro for unlimited.",
    };
  }

  try {
    const created = await createItemQuery(session.user.id, parsed.data, isPro);
    if (!created) {
      return { success: false, error: "Something went wrong. Please try again." };
    }
    return { success: true, data: created };
  } catch (error) {
    console.error("Failed to create item:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

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
 * Toggle whether an item the signed-in user owns is favorited. Resolves the
 * session, then delegates to the owner-scoped query — which updates nothing for a
 * missing or foreign item, so a user can only favorite their own. Returns a
 * not-found error in that case, or the item's new favorite state on success.
 */
export async function setItemFavorite(
  itemId: string,
  isFavorite: boolean,
): Promise<ActionResult<{ id: string; isFavorite: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  if (typeof isFavorite !== "boolean") {
    return { success: false, error: "Invalid request." };
  }

  try {
    const updated = await setItemFavoriteQuery(
      itemId,
      session.user.id,
      isFavorite,
    );
    if (!updated) {
      return { success: false, error: "Item not found." };
    }
    return { success: true, data: { id: itemId, isFavorite } };
  } catch (error) {
    console.error("Failed to update item favorite:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Toggle whether an item the signed-in user owns is pinned. Resolves the
 * session, then delegates to the owner-scoped query — which updates nothing for a
 * missing or foreign item, so a user can only pin their own. Returns a not-found
 * error in that case, or the item's new pinned state on success.
 */
export async function setItemPin(
  itemId: string,
  isPinned: boolean,
): Promise<ActionResult<{ id: string; isPinned: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  if (typeof isPinned !== "boolean") {
    return { success: false, error: "Invalid request." };
  }

  try {
    const updated = await setItemPinQuery(itemId, session.user.id, isPinned);
    if (!updated) {
      return { success: false, error: "Item not found." };
    }
    return { success: true, data: { id: itemId, isPinned } };
  } catch (error) {
    console.error("Failed to update item pin:", error);
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

/**
 * Fetch the next page of the signed-in user's combined (non-file/image) items
 * for the /items index "Items" section, which lazy-loads more. Coerces the page
 * via `parsePageParam` (junk -> 1), delegates to the owner-scoped query, and
 * reports whether a further page exists plus the page number to request next.
 */
export async function loadMoreCardItems(
  page: unknown,
): Promise<
  ActionResult<{ items: DashboardItem[]; hasNext: boolean; nextPage: number }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  try {
    const requestedPage = parsePageParam(page as string | string[] | undefined);
    const { items, pagination } = await getCardItemsPage(
      session.user.id,
      requestedPage,
    );
    return {
      success: true,
      data: {
        items,
        hasNext: pagination.hasNext,
        // The clamped page (not the raw request) is authoritative for "next".
        nextPage: pagination.page + 1,
      },
    };
  } catch (error) {
    console.error("Failed to load more items:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
