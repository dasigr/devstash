import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pageHref, pageLinks } from "@/lib/pagination";
import type { PageInfo } from "@/lib/pagination";

interface PaginationProps {
  pagination: PageInfo;
  /** Route the page links hang off, e.g. "/items/snippets". */
  basePath: string;
  /** Announced to screen readers, e.g. "Snippets pages". */
  label?: string;
}

/**
 * Numbered page links with prev/next, rendered under a paginated list.
 *
 * Server component: every control is a real anchor, so pages stay shareable and
 * the back button works. Renders nothing for a single-page list.
 *
 * An unavailable prev/next is a `<span>`, not a disabled `<a>` — an anchor has
 * no disabled state, and dropping the href is what actually stops it being
 * followed or focused. `aria-disabled` carries the greyed-out look to
 * assistive tech.
 */
export function Pagination({ pagination, basePath, label }: PaginationProps) {
  const { page, totalPages, hasPrev, hasNext } = pagination;
  if (totalPages < 2) return null;

  const links = pageLinks(page, totalPages);

  return (
    <nav
      aria-label={label ?? "Pagination"}
      className="mt-6 flex items-center justify-center gap-1"
    >
      <PageStep
        direction="prev"
        href={pageHref(basePath, page - 1)}
        enabled={hasPrev}
      />

      {links.map((link, index) =>
        link === "ellipsis" ? (
          <span
            // Ellipses carry no identity of their own; there are at most two and
            // their position is stable for a given page, so the index is a safe key.
            key={`ellipsis-${index}`}
            aria-hidden
            className="px-2 text-sm text-muted-foreground"
          >
            &hellip;
          </span>
        ) : (
          <Link
            key={link}
            href={pageHref(basePath, link)}
            aria-label={`Page ${link}`}
            aria-current={link === page ? "page" : undefined}
            className={cn(
              buttonVariants({
                variant: link === page ? "default" : "ghost",
                size: "icon-sm",
              }),
              "text-sm",
            )}
          >
            {link}
          </Link>
        ),
      )}

      <PageStep
        direction="next"
        href={pageHref(basePath, page + 1)}
        enabled={hasNext}
      />
    </nav>
  );
}

/** The prev/next control: a link when the page exists, a greyed span when not. */
function PageStep({
  direction,
  href,
  enabled,
}: {
  direction: "prev" | "next";
  href: string;
  enabled: boolean;
}) {
  const isPrev = direction === "prev";
  const label = isPrev ? "Previous page" : "Next page";
  const icon = isPrev ? (
    <ChevronLeft className="size-4" />
  ) : (
    <ChevronRight className="size-4" />
  );
  const className = buttonVariants({ variant: "ghost", size: "icon-sm" });

  if (!enabled) {
    return (
      <span
        aria-label={label}
        aria-disabled="true"
        className={cn(className, "cursor-not-allowed opacity-50")}
      >
        {icon}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={className}>
      {icon}
    </Link>
  );
}
