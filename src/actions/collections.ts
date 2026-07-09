"use server";

import { z } from "zod";

import { auth } from "@/auth";
import type { ActionResult } from "@/actions/items";
import { createCollection as createCollectionQuery } from "@/lib/db/collections";
import type { DashboardCollection } from "@/lib/db/collections";
import { createCollectionSchema } from "@/lib/validations/collections";

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

  try {
    const created = await createCollectionQuery(session.user.id, parsed.data);
    return { success: true, data: created };
  } catch (error) {
    console.error("Failed to create collection:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
