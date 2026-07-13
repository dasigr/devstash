import { describe, expect, it } from "vitest";

import { cleanExplanation } from "@/lib/ai-explain";

describe("cleanExplanation", () => {
  it("trims surrounding whitespace", () => {
    expect(cleanExplanation("  Hello world.  \n")).toBe("Hello world.");
  });

  it("preserves internal newlines (Markdown structure)", () => {
    const md = "# Heading\n\n- one\n- two";
    expect(cleanExplanation(md)).toBe(md);
  });

  it("unwraps a single wrapping fenced code block", () => {
    const raw = "```markdown\n## What it does\n\nDebounces a value.\n```";
    expect(cleanExplanation(raw)).toBe("## What it does\n\nDebounces a value.");
  });

  it("unwraps a fence with no language tag", () => {
    expect(cleanExplanation("```\nExplanation here.\n```")).toBe(
      "Explanation here.",
    );
  });

  it("does not unwrap an inner fenced code block", () => {
    const md = "Here is code:\n\n```ts\nconst x = 1;\n```\n\nThat's it.";
    expect(cleanExplanation(md)).toBe(md);
  });

  it("returns an empty string for blank input", () => {
    expect(cleanExplanation("   \n  ")).toBe("");
    expect(cleanExplanation("")).toBe("");
  });
});
