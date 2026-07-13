// Pure normalization for the AI-generated item summary. The model (gpt-5-nano
// via the Responses API, plain-text output — no json_object format) returns a
// short free-text description that may carry stray whitespace/newlines or be
// wrapped in quotes. This collapses it into a single clean line capped at
// SUMMARY_MAX_CHARS. Plain text means no JSON parse and no "json in input"
// requirement (unlike the auto-tag feature).

/** Max characters kept from the model's summary. */
export const SUMMARY_MAX_CHARS = 300;

/**
 * Normalize the model's raw text into a clean, single-line description.
 * Trims, collapses runs of whitespace/newlines to single spaces, strips a
 * single pair of wrapping quotes, and caps at SUMMARY_MAX_CHARS. Returns `""`
 * for empty/whitespace input (never throws).
 */
export function cleanSummary(raw: string): string {
  const collapsed = raw.replace(/\s+/g, " ").trim();
  if (collapsed.length === 0) return "";

  // Strip one pair of matching wrapping quotes (straight or curly). Whitespace
  // is already collapsed above, so `.` needs no dot-all flag.
  const unquoted = collapsed.replace(/^["'“”](.*)["'“”]$/, "$1").trim();

  return unquoted.slice(0, SUMMARY_MAX_CHARS).trim();
}
