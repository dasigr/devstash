import { z } from "zod";

// Validation for AI action inputs (Zod). The generateAutoTags server action
// parses with this before calling OpenAI, so it's the source of truth. Content
// is bounded here as a cheap guard; the action further truncates it to
// AUTO_TAG_CONTENT_LIMIT chars before the API call.

/** Max content chars sent to the model (truncated in the action). */
export const AUTO_TAG_CONTENT_LIMIT = 2000;

export const autoTagSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  content: z.string().max(20000).optional().default(""),
});

export type AutoTagInput = z.infer<typeof autoTagSchema>;
