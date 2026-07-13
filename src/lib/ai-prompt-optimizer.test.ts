import { describe, expect, it } from "vitest";

import { cleanOptimizedPrompt } from "@/lib/ai-prompt-optimizer";

describe("cleanOptimizedPrompt", () => {
  it("trims surrounding whitespace", () => {
    expect(cleanOptimizedPrompt("  Write a haiku.  \n")).toBe("Write a haiku.");
  });

  it("preserves internal newlines (prompt structure)", () => {
    const prompt = "You are an expert.\n\nDo the following:\n- step one\n- step two";
    expect(cleanOptimizedPrompt(prompt)).toBe(prompt);
  });

  it("unwraps a single wrapping fenced code block", () => {
    const raw = "```text\nYou are a helpful assistant.\n\nSummarize the input.\n```";
    expect(cleanOptimizedPrompt(raw)).toBe(
      "You are a helpful assistant.\n\nSummarize the input.",
    );
  });

  it("unwraps a fence with no language tag", () => {
    expect(cleanOptimizedPrompt("```\nRefined prompt here.\n```")).toBe(
      "Refined prompt here.",
    );
  });

  it("does not unwrap an inner fenced code block", () => {
    const prompt = "Given this code:\n\n```ts\nconst x = 1;\n```\n\nExplain it.";
    expect(cleanOptimizedPrompt(prompt)).toBe(prompt);
  });

  it("returns an empty string for blank input", () => {
    expect(cleanOptimizedPrompt("   \n  ")).toBe("");
    expect(cleanOptimizedPrompt("")).toBe("");
  });
});
