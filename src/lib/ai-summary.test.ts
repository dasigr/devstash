import { describe, expect, it } from "vitest";

import { cleanSummary, SUMMARY_MAX_CHARS } from "@/lib/ai-summary";

describe("cleanSummary", () => {
  it("trims and returns a plain sentence unchanged", () => {
    expect(cleanSummary("  A React hook that debounces a value.  ")).toBe(
      "A React hook that debounces a value.",
    );
  });

  it("collapses internal whitespace and newlines to single spaces", () => {
    expect(cleanSummary("A hook\n\nthat   debounces\ta value.")).toBe(
      "A hook that debounces a value.",
    );
  });

  it("strips a single pair of wrapping straight quotes", () => {
    expect(cleanSummary('"A concise description."')).toBe(
      "A concise description.",
    );
    expect(cleanSummary("'A concise description.'")).toBe(
      "A concise description.",
    );
  });

  it("strips wrapping curly quotes", () => {
    expect(cleanSummary("“A concise description.”")).toBe(
      "A concise description.",
    );
  });

  it("does not strip quotes that only appear inside the text", () => {
    expect(cleanSummary('Prints "hello" to the console.')).toBe(
      'Prints "hello" to the console.',
    );
  });

  it("caps the result at SUMMARY_MAX_CHARS", () => {
    const long = "a".repeat(SUMMARY_MAX_CHARS + 50);
    expect(cleanSummary(long)).toHaveLength(SUMMARY_MAX_CHARS);
  });

  it("returns an empty string for empty or whitespace-only input", () => {
    expect(cleanSummary("")).toBe("");
    expect(cleanSummary("   \n\t ")).toBe("");
  });
});
