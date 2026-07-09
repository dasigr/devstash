import { describe, expect, it, vi } from "vitest";

import type { SearchCollection, SearchItem } from "@/lib/db/search";
import {
  buildSearchIndex,
  collectionFields,
  itemFields,
  scoreFields,
  type Scorer,
  type WeightedField,
} from "@/lib/search";

function makeItem(overrides: Partial<SearchItem> = {}): SearchItem {
  return {
    id: "item_1",
    title: "useDebounce hook",
    preview: "export function useDebounce(value, delay) {}",
    tags: ["react", "hooks"],
    typeName: "snippet",
    typeColor: "#3b82f6",
    typeIcon: "Code",
    ...overrides,
  };
}

function makeCollection(
  overrides: Partial<SearchCollection> = {},
): SearchCollection {
  return { id: "col_1", name: "React Patterns", itemCount: 3, ...overrides };
}

/** A scorer that returns 1 on an exact match, 0 otherwise. */
const exactScorer: Scorer = (text, search) => (text === search ? 1 : 0);

describe("itemFields", () => {
  it("puts the title first and weights it highest", () => {
    const [first] = itemFields(makeItem());
    expect(first).toEqual({ text: "useDebounce hook", weight: 1, fuzzy: true });
  });

  it("fuzzy-matches short identifiers but not the long content preview", () => {
    const byText = new Map(
      itemFields(makeItem()).map((field) => [field.text, field.fuzzy]),
    );
    expect(byText.get("useDebounce hook")).toBe(true);
    expect(byText.get("react")).toBe(true);
    expect(byText.get("snippet")).toBe(true);
    expect(byText.get("export function useDebounce(value, delay) {}")).toBe(
      false,
    );
  });

  it("includes every tag, the preview, and the type name", () => {
    const fields = itemFields(makeItem());
    expect(fields.map((field) => field.text)).toEqual([
      "useDebounce hook",
      "react",
      "hooks",
      "export function useDebounce(value, delay) {}",
      "snippet",
    ]);
  });

  it("weights tags above the preview, and the preview above the type name", () => {
    const byText = new Map(
      itemFields(makeItem()).map((field) => [field.text, field.weight]),
    );
    expect(byText.get("react")).toBeGreaterThan(byText.get("snippet")!);
    expect(byText.get("react")).toBeGreaterThan(
      byText.get("export function useDebounce(value, delay) {}")!,
    );
    expect(
      byText.get("export function useDebounce(value, delay) {}"),
    ).toBeGreaterThan(byText.get("snippet")!);
  });

  it("yields only title, preview and type for an untagged item", () => {
    const fields = itemFields(makeItem({ tags: [] }));
    expect(fields).toHaveLength(3);
  });
});

describe("collectionFields", () => {
  it("matches on the name alone, at full weight, fuzzily", () => {
    expect(collectionFields(makeCollection())).toEqual([
      { text: "React Patterns", weight: 1, fuzzy: true },
    ]);
  });
});

/** A fuzzy field carrying `text`. */
const fuzzy = (text: string, weight = 1): WeightedField => ({
  text,
  weight,
  fuzzy: true,
});
/** A verbatim-match field carrying `text`. */
const literal = (text: string, weight = 1): WeightedField => ({
  text,
  weight,
  fuzzy: false,
});

describe("scoreFields", () => {
  it("returns 0 when nothing matches", () => {
    expect(scoreFields("beta", [fuzzy("alpha")], exactScorer)).toBe(0);
  });

  it("returns 0 for an empty field list", () => {
    expect(scoreFields("alpha", [], exactScorer)).toBe(0);
  });

  it("scales the raw score by the field's weight", () => {
    expect(scoreFields("alpha", [fuzzy("alpha", 0.5)], exactScorer)).toBe(0.5);
  });

  it("takes the best field rather than summing, so extra tags can't out-rank a title hit", () => {
    const titleHit = [fuzzy("alpha", 1), fuzzy("noise", 0.7)];
    const manyTagHits = [
      fuzzy("noise", 1),
      fuzzy("alpha", 0.7),
      fuzzy("alpha", 0.7),
      fuzzy("alpha", 0.7),
    ];
    expect(scoreFields("alpha", titleHit, exactScorer)).toBe(1);
    // Summing would give 2.1 here and beat the title match; taking the max gives 0.7.
    expect(scoreFields("alpha", manyTagHits, exactScorer)).toBe(0.7);
  });

  it("skips empty fields instead of scoring them", () => {
    const score = vi.fn(exactScorer);
    scoreFields("alpha", [fuzzy("")], score);
    expect(score).not.toHaveBeenCalled();
  });

  it("scores each field separately so a match cannot span two fields", () => {
    const score = vi.fn(exactScorer);
    scoreFields("alpha beta", [fuzzy("alpha"), fuzzy("beta")], score);
    expect(score.mock.calls.map(([text]) => text)).toEqual(["alpha", "beta"]);
    expect(score).not.toHaveBeenCalledWith("alpha beta", expect.anything());
  });

  it("never runs the fuzzy scorer on a verbatim-match field", () => {
    const score = vi.fn(exactScorer);
    scoreFields("alpha", [literal("alpha")], score);
    expect(score).not.toHaveBeenCalled();
  });

  it("matches a verbatim field on a case-insensitive substring", () => {
    expect(scoreFields("BOUNCE", [literal("useDebounce hook")], exactScorer)).toBe(1);
    expect(scoreFields("bounce", [literal("useDebounce hook", 0.5)], exactScorer)).toBe(0.5);
  });

  it("does not subsequence-match a verbatim field", () => {
    // "udh" is a subsequence of "useDebounce hook" but not a substring. This is
    // the guard against a scattered match in long content out-ranking a real hit.
    expect(scoreFields("udh", [literal("useDebounce hook")], exactScorer)).toBe(0);
  });

  it("lets an exact collection-name hit out-score a stray content match", () => {
    // The regression that motivated the split: "devops" appears as a scattered
    // subsequence inside a prompt's body, but not as a substring.
    const promptBody =
      "Refactor the provided code, deduplicate helpers, and verify output specs.";
    const item = [fuzzy("Refactoring assistant"), literal(promptBody, 0.5)];
    const collection = [fuzzy("DevOps")];

    const scorer: Scorer = (text, search) =>
      text.toLowerCase() === search.toLowerCase() ? 1 : 0;

    expect(scoreFields("devops", item, scorer)).toBe(0);
    expect(scoreFields("devops", collection, scorer)).toBe(1);
  });
});

describe("buildSearchIndex", () => {
  it("keys items and collections by id", () => {
    const index = buildSearchIndex(
      [makeItem({ id: "item_1" })],
      [makeCollection({ id: "col_1" })],
    );
    expect([...index.keys()]).toEqual(["item_1", "col_1"]);
  });

  it("maps each id to that record's fields", () => {
    const item = makeItem();
    const collection = makeCollection();
    const index = buildSearchIndex([item], [collection]);
    expect(index.get("item_1")).toEqual(itemFields(item));
    expect(index.get("col_1")).toEqual(collectionFields(collection));
  });

  it("returns an empty index for an empty dataset", () => {
    expect(buildSearchIndex([], []).size).toBe(0);
  });
});
