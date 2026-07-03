import { FolderPlus, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Dashboard top bar: search field and "New Collection" / "New Item" actions.
 * Display only for Phase 1 — no handlers wired up yet.
 */
export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-6">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items, tags, collections…"
          className="pl-9"
          aria-label="Search"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button variant="outline">
          <FolderPlus className="size-4" />
          New Collection
        </Button>
        <Button>
          <Plus className="size-4" />
          New Item
        </Button>
      </div>
    </header>
  );
}