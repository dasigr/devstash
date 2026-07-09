"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { defaultFilter } from "cmdk";
import { FolderOpen, Search } from "lucide-react";

import type { SearchData } from "@/lib/db/search";
import { buildSearchIndex, scoreFields } from "@/lib/search";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const EMPTY_DATA: SearchData = { items: [], collections: [] };

// The platform never changes for the life of the page, so there is nothing to
// subscribe to. Reading it through useSyncExternalStore (rather than an effect)
// keeps the server and first client render in agreement on "⌘K", then settles on
// the real value without a cascading re-render.
const subscribePlatform = () => () => {};
const isMacSnapshot = () => /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const isMacServerSnapshot = () => true;

/**
 * Global command palette. Opens on Cmd+K / Ctrl+K or by clicking the top bar's
 * search field, and filters the user's items and collections entirely on the
 * client — the dataset is fetched once up front from /api/search.
 *
 * Selecting an item opens the existing item drawer in place (no navigation);
 * selecting a collection navigates to its page. Must be rendered inside an
 * <ItemDrawerProvider>, since it calls openItem().
 */
export function SearchPalette() {
  const router = useRouter();
  const { openItem } = useItemDrawer();

  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SearchData>(EMPTY_DATA);
  const isMac = useSyncExternalStore(
    subscribePlatform,
    isMacSnapshot,
    isMacServerSnapshot,
  );
  // Tracks the latest request so a slower earlier fetch can't clobber a newer one.
  const requestId = useRef(0);

  const load = useCallback(() => {
    const reqId = ++requestId.current;
    fetch("/api/search")
      .then((res) => res.json())
      .then((json: { success: boolean; data?: SearchData }) => {
        if (requestId.current !== reqId) return;
        if (json.success && json.data) setData(json.data);
      })
      .catch(() => {
        // A failed prefetch just means an empty palette; nothing to surface.
      });
  }, []);

  // Pre-fetch on app load, then refresh in the background on each open so newly
  // created or deleted items don't linger in a stale palette.
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Each CommandItem carries its id as the cmdk value (stable and unique, unlike
  // a title), so filtering resolves the id back to the text it should match.
  const index = useMemo(
    () => buildSearchIndex(data.items, data.collections),
    [data],
  );

  const filter = useCallback(
    (value: string, search: string) =>
      scoreFields(search, index.get(value) ?? [], defaultFilter),
    [index],
  );

  const select = useCallback((action: () => void) => {
    setOpen(false);
    action();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="relative flex h-8 w-full max-w-md items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors outline-none hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search items, tags, collections…</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search items and collections"
        filter={filter}
      >
        <CommandInput placeholder="Search items, tags, collections…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {data.items.length > 0 && (
            <CommandGroup heading="Items">
              {data.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => select(() => openItem(item.id))}
                >
                  <ItemTypeIcon
                    name={item.typeIcon}
                    color={item.typeColor}
                    className="size-4 shrink-0"
                  />
                  <span className="truncate">{item.title}</span>
                  {item.preview && (
                    <span className="truncate text-xs text-muted-foreground">
                      {item.preview}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data.collections.length > 0 && (
            <CommandGroup heading="Collections">
              {data.collections.map((collection) => (
                <CommandItem
                  key={collection.id}
                  value={collection.id}
                  onSelect={() =>
                    select(() => router.push(`/collections/${collection.id}`))
                  }
                >
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{collection.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {collection.itemCount}{" "}
                    {collection.itemCount === 1 ? "item" : "items"}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
