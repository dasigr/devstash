"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { CollectionOption } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

/**
 * Checkbox list of the signed-in user's collections, for filing an item under
 * zero, one, or many of them. Both call sites (the New Item dialog and the
 * drawer's edit form) are client components with no server-fetched props to hand
 * down, so the list is fetched here from the owner-scoped `/api/collections`.
 *
 * `value` is the selected collection ids; the server re-checks ownership on
 * write, so a stale or tampered id here is dropped rather than trusted.
 */
export function CollectionPicker({
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /** Namespaces the checkbox ids so two pickers can coexist on a page. */
  idPrefix: string;
}) {
  const [collections, setCollections] = useState<CollectionOption[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/collections");
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok || !body.success) {
          setError(true);
          return;
        }
        setCollections(body.data);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(id: string) {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  }

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-foreground">Collections</span>

      {error ? (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load your collections.
        </p>
      ) : collections === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading collections…
        </div>
      ) : collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No collections yet. Create one to file items under it.
        </p>
      ) : (
        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
          {collections.map((collection) => {
            const checked = value.includes(collection.id);
            return (
              <label
                key={collection.id}
                htmlFor={`${idPrefix}-${collection.id}`}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  checked ? "text-foreground" : "text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                <input
                  id={`${idPrefix}-${collection.id}`}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(collection.id)}
                  disabled={disabled}
                  className="size-4 shrink-0 accent-primary"
                />
                <span className="truncate">{collection.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
