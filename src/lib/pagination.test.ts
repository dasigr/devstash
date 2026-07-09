import { describe, expect, it } from "vitest";

import {
  COLLECTIONS_PER_PAGE,
  DASHBOARD_COLLECTIONS_LIMIT,
  DASHBOARD_RECENT_ITEMS_LIMIT,
  ITEMS_PER_PAGE,
  buildPageInfo,
  pageHref,
  pageLinks,
  parsePageParam,
} from "@/lib/pagination";

describe("pagination constants", () => {
  it("match the values the feature spec fixes them at", () => {
    expect(ITEMS_PER_PAGE).toBe(20);
    expect(COLLECTIONS_PER_PAGE).toBe(20);
    expect(DASHBOARD_COLLECTIONS_LIMIT).toBe(8);
    expect(DASHBOARD_RECENT_ITEMS_LIMIT).toBe(8);
  });
});

describe("parsePageParam", () => {
  it("reads a positive whole number", () => {
    expect(parsePageParam("1")).toBe(1);
    expect(parsePageParam("7")).toBe(7);
    expect(parsePageParam("100")).toBe(100);
  });

  it("falls back to page 1 when absent or empty", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("")).toBe(1);
  });

  // A junk URL should still render a list, not a crash or an empty grid.
  it("falls back to page 1 for zero, negatives, and fractions", () => {
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-3")).toBe(1);
    expect(parsePageParam("2.5")).toBe(1);
  });

  it("falls back to page 1 for non-numeric input", () => {
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("2; DROP TABLE")).toBe(1);
    expect(parsePageParam("Infinity")).toBe(1);
  });

  // ?page=1&page=2 arrives as an array; there's no single sensible page in that.
  it("falls back to page 1 for a repeated param", () => {
    expect(parsePageParam(["1", "2"])).toBe(1);
  });
});

describe("buildPageInfo", () => {
  it("derives skip/take and the neighbour flags for a middle page", () => {
    expect(buildPageInfo(2, 20, 50)).toEqual({
      page: 2,
      perPage: 20,
      totalCount: 50,
      totalPages: 3,
      hasPrev: true,
      hasNext: true,
      skip: 20,
      take: 20,
    });
  });

  it("has no prev on the first page and no next on the last", () => {
    expect(buildPageInfo(1, 20, 50)).toMatchObject({
      hasPrev: false,
      hasNext: true,
      skip: 0,
    });
    expect(buildPageInfo(3, 20, 50)).toMatchObject({
      hasPrev: true,
      hasNext: false,
      skip: 40,
    });
  });

  // Otherwise ?page=999 renders an empty grid with no way back.
  it("clamps a page past the end to the last page", () => {
    expect(buildPageInfo(999, 20, 50)).toMatchObject({
      page: 3,
      skip: 40,
      hasNext: false,
    });
  });

  it("clamps a page below 1 up to the first page", () => {
    expect(buildPageInfo(0, 20, 50)).toMatchObject({ page: 1, skip: 0 });
    expect(buildPageInfo(-5, 20, 50)).toMatchObject({ page: 1, skip: 0 });
  });

  // An empty list is "page 1 of 1", not "page 1 of 0".
  it("reports one page when there is nothing to show", () => {
    expect(buildPageInfo(1, 20, 0)).toMatchObject({
      page: 1,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
      skip: 0,
    });
  });

  it("adds a page for a partial last page", () => {
    expect(buildPageInfo(1, 20, 21).totalPages).toBe(2);
    expect(buildPageInfo(1, 20, 40).totalPages).toBe(2);
    expect(buildPageInfo(1, 20, 41).totalPages).toBe(3);
  });
});

describe("pageLinks", () => {
  it("returns nothing to render when there are no pages", () => {
    expect(pageLinks(1, 0)).toEqual([]);
  });

  it("lists every page while they fit without a gap", () => {
    expect(pageLinks(1, 1)).toEqual([1]);
    expect(pageLinks(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageLinks(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("brackets the current page and elides the rest on a long list", () => {
    expect(pageLinks(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("only elides the trailing side near the start", () => {
    expect(pageLinks(1, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(pageLinks(2, 10)).toEqual([1, 2, 3, "ellipsis", 10]);
    // Page 3's window touches page 2, so there's no gap worth an ellipsis.
    expect(pageLinks(3, 10)).toEqual([1, 2, 3, 4, "ellipsis", 10]);
  });

  it("only elides the leading side near the end", () => {
    expect(pageLinks(10, 10)).toEqual([1, "ellipsis", 9, 10]);
    expect(pageLinks(9, 10)).toEqual([1, "ellipsis", 8, 9, 10]);
    expect(pageLinks(8, 10)).toEqual([1, "ellipsis", 7, 8, 9, 10]);
  });

  it("never repeats the first or last page", () => {
    for (const current of [1, 2, 5, 9, 10]) {
      const links = pageLinks(current, 10);
      const numbers = links.filter((link) => typeof link === "number");
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });

  it("clamps an out-of-range current page", () => {
    expect(pageLinks(99, 10)).toEqual(pageLinks(10, 10));
    expect(pageLinks(0, 10)).toEqual(pageLinks(1, 10));
  });
});

describe("pageHref", () => {
  it("drops the param on page 1 so the bare path is canonical", () => {
    expect(pageHref("/collections", 1)).toBe("/collections");
    expect(pageHref("/items/snippets", 0)).toBe("/items/snippets");
  });

  it("appends the page number beyond page 1", () => {
    expect(pageHref("/collections", 2)).toBe("/collections?page=2");
    expect(pageHref("/items/snippets", 12)).toBe("/items/snippets?page=12");
  });
});
