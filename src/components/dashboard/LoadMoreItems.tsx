"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { loadMoreCardItems } from "@/actions/items";
import type { DashboardItem } from "@/lib/db/items";
import { toastManager } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { ItemCardButton } from "@/components/dashboard/ItemCardButton";

/**
 * The /items index "Items" grid (combined non-file/image types) that lazy-loads
 * further pages. The server renders the first page; this appends subsequent
 * pages via the `loadMoreCardItems` server action, auto-triggered when a
 * sentinel scrolls into view (IntersectionObserver) with a visible "Load more"
 * button as the accessible fallback and manual trigger.
 */
export function LoadMoreItems({
  initialItems,
  hasNext: initialHasNext,
  nextPage: initialNextPage,
}: {
  initialItems: DashboardItem[];
  hasNext: boolean;
  nextPage: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [page, setPage] = useState(initialNextPage);
  const [loading, setLoading] = useState(false);
  // Prevents overlapping loads (a fast scroll can fire the observer repeatedly).
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await loadMoreCardItems(String(page));
      if (!result.success) {
        toastManager.add({
          title: "Couldn't load more items",
          description: result.error,
          timeout: 6000,
        });
        return;
      }
      setItems((prev) => [...prev, ...result.data.items]);
      setHasNext(result.data.hasNext);
      setPage(result.data.nextPage);
    } catch {
      toastManager.add({
        title: "Something went wrong",
        description: "Please try again.",
        timeout: 6000,
      });
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page]);

  // Auto-load the next page when the sentinel enters the viewport. Falls back to
  // the button when IO is unsupported.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNext) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNext, loadMore]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ItemCardButton key={item.id} item={item} />
        ))}
      </div>

      {hasNext && (
        <div ref={sentinelRef} className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadMore()}
            disabled={loading}
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}
