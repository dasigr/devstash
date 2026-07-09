"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteCollectionDialog } from "@/components/dashboard/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/dashboard/EditCollectionDialog";
import type { EditableCollection } from "@/components/dashboard/EditCollectionDialog";

/**
 * The three-dots menu on a collection card: Edit, Favorite, Delete.
 *
 * The card's click surface is a link overlaying the whole card; this menu sits
 * above it (`z-10`), so clicking the trigger hits the button rather than the
 * link and never navigates.
 *
 * Both dialogs render as siblings of the menu, not inside it — a Base UI menu
 * unmounts its content on close, which would take a nested dialog with it.
 *
 * Favorite is not wired up yet, so it renders disabled rather than silently
 * doing nothing.
 */
export function CollectionCardMenu({
  collection,
}: {
  collection: EditableCollection;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="relative z-10 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              aria-label={`Actions for ${collection.name}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Star />
            Favorite
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCollectionDialog
        collection={collection}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteCollectionDialog
        collectionId={collection.id}
        collectionName={collection.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
