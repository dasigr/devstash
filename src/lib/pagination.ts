// Pagination constants and pure helpers, shared by the data layer (to build
// `skip`/`take`) and the UI (to render page links). No imports, no I/O — the
// page-math lives here so it can be unit-tested without a database.

/** Items per page on /items/[type] and /collections/[id]. */
export const ITEMS_PER_PAGE = 20;

/** Collections per page on /collections. */
export const COLLECTIONS_PER_PAGE = 20;

/** Cap on the dashboard's Collections grid — capped, not paged. */
export const DASHBOARD_COLLECTIONS_LIMIT = 8;

/** Cap on the dashboard's Recent Items grid — capped, not paged. */
export const DASHBOARD_RECENT_ITEMS_LIMIT = 8;

/** Cap on the /items index Files & Images preview sections (each links to its full page). */
export const ITEMS_INDEX_PREVIEW_LIMIT = 20;

/** Everything a paginated list and its controls need to render one page. */
export interface PageInfo {
  /** The current page, 1-based and clamped into range. */
  page: number;
  perPage: number;
  /** Total rows across all pages (not just this one). */
  totalCount: number;
  /** At least 1, so an empty list still reads as "page 1 of 1". */
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  /** Rows to skip — feed straight to Prisma. */
  skip: number;
  /** Rows to take — feed straight to Prisma. */
  take: number;
}

/**
 * Read a `?page=` search param into a 1-based page number.
 *
 * Anything that isn't a positive whole number — absent, empty, "0", "-3",
 * "2.5", "abc", or a repeated param — falls back to page 1 rather than
 * erroring, since a junk URL should still render the first page.
 */
export function parsePageParam(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

/**
 * Resolve a requested page against a known total into the numbers a query and
 * its controls need.
 *
 * The requested page is clamped to the last page, so `?page=999` on a 3-page
 * list shows page 3 rather than an empty grid. Callers must therefore count
 * before they fetch rows, and should render `info.page` (not their raw input)
 * as the active page.
 */
export function buildPageInfo(
  requestedPage: number,
  perPage: number,
  totalCount: number,
): PageInfo {
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  return {
    page,
    perPage,
    totalCount,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

/** A rendered page control: a page number, or a gap between them. */
export type PageLink = number | "ellipsis";

// Below this many pages every page gets its own link, so no gap can appear.
// 7 = first + last + the current page + one sibling either side + two gaps.
const MAX_LINKS_WITHOUT_GAPS = 7;

// Pages shown either side of the current one when the list is long.
const SIBLINGS = 1;

/**
 * The sequence of page links to render: always the first and last page, the
 * current page with a sibling either side, and an `"ellipsis"` marker wherever
 * that skips over pages.
 *
 * e.g. page 5 of 10 -> [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
 *
 * Returns an empty list when there's nothing to page through (0 pages) and a
 * single link for a 1-page list, so callers can hide the controls on `length < 2`.
 */
export function pageLinks(current: number, totalPages: number): PageLink[] {
  if (totalPages < 1) return [];
  if (totalPages <= MAX_LINKS_WITHOUT_GAPS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const page = Math.min(Math.max(1, current), totalPages);
  // The window sits strictly between the first and last page, which are always
  // rendered — so it never duplicates them.
  const windowStart = Math.max(2, page - SIBLINGS);
  const windowEnd = Math.min(totalPages - 1, page + SIBLINGS);

  const links: PageLink[] = [1];
  if (windowStart > 2) links.push("ellipsis");
  for (let i = windowStart; i <= windowEnd; i++) links.push(i);
  if (windowEnd < totalPages - 1) links.push("ellipsis");
  links.push(totalPages);

  return links;
}

/**
 * Href for a page link on the given route. Page 1 drops the param entirely so
 * the canonical URL of a list is its bare path.
 */
export function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}
