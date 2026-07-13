// Pure normalization for the AI-optimized prompt. The model (gpt-5-nano via the
// Responses API, plain-text output — no json_object format) returns the refined
// prompt text, which may be multi-line/Markdown. Like the code explanation (and
// unlike the one-line summary), we keep newlines intact, so this only trims and
// unwraps a stray fenced code block the model occasionally wraps the whole
// answer in.

/**
 * Normalize the model's raw text into a clean prompt. Trims surrounding
 * whitespace and, if the entire response is wrapped in a single fenced code
 * block (```…```), unwraps it so it's used as the prompt rather than kept inside
 * a code fence. Returns `""` for empty/whitespace input (never throws).
 */
export function cleanOptimizedPrompt(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";

  // Unwrap a single wrapping fence, e.g. ```text\n…\n``` — but only when the
  // fence spans the whole string (no content before/after it).
  const wrapped = /^```[a-zA-Z]*\n([\s\S]*?)\n```$/.exec(trimmed);
  return (wrapped ? wrapped[1] : trimmed).trim();
}
