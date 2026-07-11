"use client";

import { Pin } from "lucide-react";

import { setItemPin } from "@/actions/items";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePinToggle } from "@/components/dashboard/usePinToggle";

/**
 * A pin button that toggles an item's pinned state. Used in the item drawer's
 * action bar. (The pin on the item card stays a static indicator.)
 */
export function ItemPinButton({
  itemId,
  isPinned,
}: {
  itemId: string;
  isPinned: boolean;
}) {
  const { isPinned: pinned, pending, onToggle } = usePinToggle({
    initial: isPinned,
    toggle: (next) => setItemPin(itemId, next),
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      aria-label={pinned ? "Unpin item" : "Pin item"}
      aria-pressed={pinned}
      disabled={pending}
      onClick={() => void onToggle()}
    >
      <Pin
        className={cn("rotate-45", pinned && "fill-foreground text-foreground")}
      />
    </Button>
  );
}
