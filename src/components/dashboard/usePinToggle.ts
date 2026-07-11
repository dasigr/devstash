"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/actions/items";
import { toastManager } from "@/lib/toast";

/**
 * Optimistic pin toggle for the item drawer's Pin control. Flips the local state
 * immediately, calls the owner-scoped server action, and on success refreshes the
 * server-rendered surfaces (listings, the dashboard's Pinned section) via
 * `router.refresh()`. On failure it reverts the local state and toasts — so a
 * rejected write never leaves the pin out of sync. Mirrors `useFavoriteToggle`.
 */
export function usePinToggle({
  initial,
  toggle,
}: {
  initial: boolean;
  toggle: (next: boolean) => Promise<ActionResult<unknown>>;
}) {
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(initial);
  const [pending, setPending] = useState(false);

  async function onToggle() {
    if (pending) return;
    const next = !isPinned;

    setIsPinned(next); // optimistic
    setPending(true);
    try {
      const result = await toggle(next);
      if (!result.success) {
        setIsPinned(!next); // revert
        toastManager.add({
          title: `Couldn't ${next ? "pin" : "unpin"} item`,
          description: result.error,
          timeout: 6000,
        });
        return;
      }
      router.refresh();
    } catch {
      setIsPinned(!next); // revert
      toastManager.add({
        title: "Something went wrong",
        description: "Please try again.",
        timeout: 6000,
      });
    } finally {
      setPending(false);
    }
  }

  return { isPinned, pending, onToggle };
}
