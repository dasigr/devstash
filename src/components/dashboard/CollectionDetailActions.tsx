"use client";

import { useState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeleteCollectionDialog } from "@/components/dashboard/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/dashboard/EditCollectionDialog";
import type { EditableCollection } from "@/components/dashboard/EditCollectionDialog";

/**
 * Edit / Favorite / Delete for the collection detail page header.
 *
 * Favorite is not wired up yet, so it renders disabled rather than silently
 * doing nothing. Deleting sends the user back to /collections, since this page's
 * own id is about to 404.
 */
export function CollectionDetailActions({
  collection,
}: {
  collection: EditableCollection;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        type="button"
        disabled
        aria-label="Favorite collection"
        className="text-muted-foreground"
      >
        <Star />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        aria-label="Edit collection"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setEditOpen(true)}
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        aria-label="Delete collection"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 />
      </Button>

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
        redirectToList
      />
    </div>
  );
}
