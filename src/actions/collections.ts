"use server";

import { z } from "zod";

import { auth } from "@/auth";
import type { ActionResult } from "@/actions/items";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  setCollectionFavorite as setCollectionFavoriteQuery,
  updateCollection as updateCollectionQuery,
} from "@/lib/db/collections";
import type { DashboardCollection } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";
import { canCreateCollection } from "@/lib/plan";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "@/lib/validations/collections";

/**
 * Create a new collection for the signed-in user. Validates the payload with Zod
 * (the source of truth), resolves the session, and delegates the write to the
 * query — which takes the owner from the session, so a client can't create a
 * collection under someone else's account.
 */
export async function createCollection(
  input: unknown,
): Promise<ActionResult<DashboardCollection>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = createCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      issues: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // Enforce the free-tier collection cap before any write.
  const user = await getCurrentUser();
  const { allowed } = await canCreateCollection(
    session.user.id,
    user?.isPro ?? false,
  );
  if (!allowed) {
    return {
      success: false,
      error:
        "Free plan is limited to 3 collections. Upgrade to Pro for unlimited.",
    };
  }

  try {
    const created = await createCollectionQuery(session.user.id, parsed.data);
    return { success: true, data: created };
  } catch (error) {
    console.error("Failed to create collection:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Update a collection's metadata. Owner-scoped in the query, so a client can't
 * edit someone else's collection — a foreign or unknown id is reported the same
 * way, as "not found".
 */
export async function updateCollection(
  collectionId: string,
  input: unknown,
): Promise<ActionResult<DashboardCollection>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = updateCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the highlighted fields.",
      issues: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const updated = await updateCollectionQuery(
      collectionId,
      session.user.id,
      parsed.data,
    );
    if (!updated) {
      return { success: false, error: "Collection not found." };
    }
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update collection:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Toggle whether a collection the signed-in user owns is favorited. Owner-scoped
 * in the query, so a client can't favorite someone else's collection — a foreign
 * or unknown id is reported the same way, as "not found".
 */
export async function setCollectionFavorite(
  collectionId: string,
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
    const updated = await setCollectionFavoriteQuery(
      collectionId,
      session.user.id,
      isFavorite,
    );
    if (!updated) {
      return { success: false, error: "Collection not found." };
    }
    return { success: true, data: { id: collectionId, isFavorite } };
  } catch (error) {
    console.error("Failed to update collection favorite:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Delete a collection. Owner-scoped in the query. The collection's items are not
 * deleted — only their membership in this collection.
 */
export async function deleteCollection(
  collectionId: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  try {
    const deleted = await deleteCollectionQuery(collectionId, session.user.id);
    if (!deleted) {
      return { success: false, error: "Collection not found." };
    }
    return { success: true, data: { id: collectionId } };
  } catch (error) {
    console.error("Failed to delete collection:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
