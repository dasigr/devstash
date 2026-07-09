import { z } from "zod";

// Validation for collection mutations (Zod). The `createCollection` and
// `updateCollection` server actions parse with these before touching the
// database, so they're the source of truth — the dialogs' client-side guards are
// UX only.

/** Coerce empty / whitespace-only strings to null before validation. */
const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.preprocess(
    emptyToNull,
    z.string().trim().min(1).nullable().optional(),
  ),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

/**
 * Editing a collection's metadata. Same fields as create — the edit dialog
 * always submits both, and a blanked-out description clears it (null).
 */
export const updateCollectionSchema = createCollectionSchema;

export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
