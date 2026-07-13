"use client";

import { useCallback, useRef, useState } from "react";

import type { ItemDetail } from "@/lib/db/items";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ItemDrawerContext } from "@/components/dashboard/item-drawer-context";
import {
  ItemDrawerDetail,
  ItemDrawerSkeleton,
} from "@/components/dashboard/ItemDrawerDetail";
import { ItemDrawerEdit } from "@/components/dashboard/ItemDrawerEdit";

/**
 * Client wrapper that provides the item drawer to the (server) pages. Children
 * render the page as before; clicking an ItemCardButton calls `openItem(id)`,
 * which opens the right-side Sheet and fetches the item's full detail from
 * /api/items/[id]. Fetching on open keeps the pages' card data server-rendered.
 */
export function ItemDrawerProvider({
  children,
  isPro = false,
}: {
  children: React.ReactNode;
  /** Whether the signed-in user is Pro — gates AI features in the edit form. */
  isPro?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  // Tracks the latest request so an earlier, slower fetch can't clobber a newer
  // one when the user opens items in quick succession.
  const requestId = useRef(0);

  const openItem = useCallback((id: string) => {
    setOpen(true);
    setItem(null);
    setError(false);
    setEditing(false);
    setLoading(true);

    const reqId = ++requestId.current;
    fetch(`/api/items/${id}`)
      .then((res) => res.json())
      .then((json: { success: boolean; data?: ItemDetail }) => {
        if (requestId.current !== reqId) return;
        if (json.success && json.data) {
          setItem(json.data);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (requestId.current === reqId) setError(true);
      })
      .finally(() => {
        if (requestId.current === reqId) setLoading(false);
      });
  }, []);

  return (
    <ItemDrawerContext.Provider value={{ openItem }}>
      {children}
      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(false);
        }}
      >
        <SheetContent
          side="right"
          showClose={false}
          aria-label="Item detail"
        >
          {loading || (!item && !error) ? (
            <>
              <SheetTitle className="sr-only">Loading item</SheetTitle>
              <ItemDrawerSkeleton />
            </>
          ) : error || !item ? (
            <>
              <SheetTitle className="sr-only">Item</SheetTitle>
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Couldn&apos;t load this item. Please try again.
              </div>
            </>
          ) : editing ? (
            <ItemDrawerEdit
              key={item.id}
              item={item}
              isPro={isPro}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => {
                setItem(updated);
                setEditing(false);
              }}
            />
          ) : (
            <ItemDrawerDetail
              item={item}
              onEdit={() => setEditing(true)}
              onDeleted={() => setOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </ItemDrawerContext.Provider>
  );
}
