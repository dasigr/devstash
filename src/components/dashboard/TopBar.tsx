import { FolderPlus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarToggle } from "@/components/dashboard/SidebarToggle";
import { CreateItemDialog } from "@/components/dashboard/CreateItemDialog";

/**
 * Dashboard top bar: sidebar toggle, search field, and
 * "New Collection" / "New Item" actions. "New Item" opens the create modal;
 * "New Collection" is display only for now.
 */
export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-6">
      <SidebarToggle />

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
        <CreateItemDialog />
      </div>
    </header>
  );
}