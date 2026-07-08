import { z } from "zod";

// Validation for item mutations (Zod). The `updateItem` server action parses
// with this before touching the database, so it's the source of truth — the
// drawer's client-side guards are UX only.

/** Coerce empty / whitespace-only strings to null before validation. */
const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

// Optional, nullable free text (description, language). Undefined means "leave
// unchanged"; null / blank means "clear it".
const optionalText = z.preprocess(
  emptyToNull,
  z.string().trim().min(1).nullable().optional(),
);

/** The text/url system types a user can create from the UI (file/image are Pro). */
export const CREATABLE_ITEM_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
] as const;

export type CreatableItemType = (typeof CREATABLE_ITEM_TYPES)[number];

export const createItemSchema = z
  .object({
    type: z.enum(CREATABLE_ITEM_TYPES),
    title: z.string().trim().min(1, "Title is required"),
    description: optionalText,
    // Content preserves internal whitespace (code), so it isn't trimmed.
    content: z.preprocess(emptyToNull, z.string().nullable().optional()),
    language: optionalText,
    url: z.preprocess(
      emptyToNull,
      z.string().trim().url("Enter a valid URL").nullable().optional(),
    ),
    tags: z
      .array(z.string())
      .default([])
      .transform((arr) => [
        ...new Set(arr.map((t) => t.trim()).filter((t) => t.length > 0)),
      ]),
  })
  // Link items must carry a URL; the base rule only checks it's a valid URL.
  .refine((data) => data.type !== "link" || !!data.url, {
    message: "URL is required",
    path: ["url"],
  });

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: optionalText,
  // Content preserves internal whitespace (code), so it isn't trimmed; a blank
  // value still becomes null.
  content: z.preprocess(emptyToNull, z.string().nullable().optional()),
  language: optionalText,
  url: z.preprocess(
    emptyToNull,
    z.string().trim().url("Enter a valid URL").nullable().optional(),
  ),
  // Trim, drop empties, and de-duplicate so tags land as clean, unique names.
  tags: z
    .array(z.string())
    .default([])
    .transform((arr) => [
      ...new Set(arr.map((t) => t.trim()).filter((t) => t.length > 0)),
    ]),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;
