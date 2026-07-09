import type { SearchCollection, SearchItem } from "@/lib/db/search";

/**
 * Scores one field's text against the query. 0 means no match; higher is better.
 * Injected rather than imported so this module stays pure and testable — the
 * palette passes cmdk's `defaultFilter`.
 */
export type Scorer = (text: string, search: string) => number;

/** One searchable field of a result, and how much a match on it counts. */
export interface WeightedField {
  text: string;
  weight: number;
  /**
   * Fuzzy-match this field (subsequence, so "udh" finds "useDebounce hook"), or
   * require the query to appear verbatim.
   *
   * Short identifiers are fuzzy-matched. Long free text — an item's content
   * preview — is not: over 160 characters a scattered subsequence exists for
   * almost any short query, so fuzzy matching there surfaces near-everything.
   * "devops" fuzzily "matches" the body of a prompt named "Refactoring
   * assistant", which then outranks the collection actually called DevOps.
   */
  fuzzy: boolean;
}

// A title match is what the user almost always means. Content and tags are worth
// finding, but should never outrank a title hit; the type name is a weak signal
// (typing "snippet" shouldn't bury an item actually named "snippet").
const WEIGHT_TITLE = 1;
const WEIGHT_TAG = 0.7;
const WEIGHT_PREVIEW = 0.5;
const WEIGHT_TYPE = 0.3;

/** The fields an item is matched on, most significant first. */
export function itemFields(item: SearchItem): WeightedField[] {
  return [
    { text: item.title, weight: WEIGHT_TITLE, fuzzy: true },
    ...item.tags.map((tag) => ({ text: tag, weight: WEIGHT_TAG, fuzzy: true })),
    { text: item.preview, weight: WEIGHT_PREVIEW, fuzzy: false },
    { text: item.typeName, weight: WEIGHT_TYPE, fuzzy: true },
  ];
}

/** The fields a collection is matched on. */
export function collectionFields(
  collection: SearchCollection,
): WeightedField[] {
  return [{ text: collection.name, weight: WEIGHT_TITLE, fuzzy: true }];
}

/** Verbatim, case-insensitive containment. 1 on a hit, 0 otherwise. */
function containsScore(text: string, search: string): number {
  return text.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
}

/**
 * Score a result by its best-matching field. We take the max rather than the sum
 * so an item with many tags can't out-rank a direct title match just by having
 * more fields, and score each field separately so a fuzzy match can't span the
 * boundary between (say) a title and its content.
 *
 * Empty fields are skipped — scoring "" would otherwise let an item with no
 * content edge out one whose content genuinely matches.
 */
export function scoreFields(
  search: string,
  fields: WeightedField[],
  score: Scorer,
): number {
  let best = 0;
  for (const field of fields) {
    if (!field.text) continue;
    const raw = field.fuzzy
      ? score(field.text, search)
      : containsScore(field.text, search);
    best = Math.max(best, raw * field.weight);
  }
  return best;
}

/**
 * Build the id -> fields lookup the palette's cmdk `filter` consults. Each
 * CommandItem carries its id as its cmdk `value` (stable and unique, unlike a
 * title), so filtering has to resolve the id back to the text it should match.
 */
export function buildSearchIndex(
  items: SearchItem[],
  collections: SearchCollection[],
): Map<string, WeightedField[]> {
  const index = new Map<string, WeightedField[]>();
  for (const item of items) index.set(item.id, itemFields(item));
  for (const collection of collections) {
    index.set(collection.id, collectionFields(collection));
  }
  return index;
}
