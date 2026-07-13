// Pure parsing for AI auto-tag suggestions. The model (gpt-5-nano via the
// Responses API with json_object format) returns freeform JSON that may be
// either { "tags": ["a", "b"] } OR a bare ["a", "b"] array. This normalizes
// either shape into a clean, lowercased, de-duplicated list capped at 5.

/** Max number of tag suggestions surfaced to the user. */
export const MAX_SUGGESTED_TAGS = 5;

/**
 * Parse the model's raw text into a normalized tag list. Accepts both
 * `{ "tags": [...] }` and a bare `[...]`; lowercases, trims, drops empties and
 * non-strings, de-duplicates, and caps at MAX_SUGGESTED_TAGS. Returns `[]` on
 * any parse failure or unexpected shape (never throws).
 */
export function parseSuggestedTags(raw: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const list: unknown = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && "tags" in parsed
      ? (parsed as { tags: unknown }).tags
      : null;

  if (!Array.isArray(list)) return [];

  const cleaned = list
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v.length > 0);

  return [...new Set(cleaned)].slice(0, MAX_SUGGESTED_TAGS);
}
