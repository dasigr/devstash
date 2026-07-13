// Pure normalization for the AI-generated code explanation. The model
// (gpt-5-nano via the Responses API, plain-text output — no json_object format)
// returns GitHub-flavored Markdown. Unlike the summary, we keep newlines intact
// (Markdown needs them), so this only trims and unwraps a stray fenced code
// block the model occasionally puts around the whole answer.

/**
 * Normalize the model's raw text into clean Markdown. Trims surrounding
 * whitespace and, if the entire response is wrapped in a single fenced code
 * block (```…```), unwraps it so it renders as Markdown rather than one big
 * code block. Returns `""` for empty/whitespace input (never throws).
 */
export function cleanExplanation(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";

  // Unwrap a single wrapping fence, e.g. ```markdown\n…\n``` — but only when
  // the fence spans the whole string (no content before/after it).
  const wrapped = /^```[a-zA-Z]*\n([\s\S]*?)\n```$/.exec(trimmed);
  return (wrapped ? wrapped[1] : trimmed).trim();
}
