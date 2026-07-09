import { z } from "zod";

// Validation for collection mutations (Zod). The `createCollection` server
// action parses with this before touching the database, so it's the source of
// truth — the dialog's client-side guards are UX only.

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
