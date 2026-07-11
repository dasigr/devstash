"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CollectionFavoriteButton } from "@/components/dashboard/CollectionFavoriteButton";
import { DeleteCollectionDialog } from "@/components/dashboard/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/dashboard/EditCollectionDialog";
import type { EditableCollection } from "@/components/dashboard/EditCollectionDialog";

/**
 * Edit / Favorite / Delete for the collection detail page header. The favorite
 * button is both the toggle and the at-a-glance indicator (filled amber when
 * favorited). Deleting sends the user back to /collections, since this page's
 * own id is about to 404.
 */
export function CollectionDetailActions({
  collection,
  isFavorite,
}: {
  collection: EditableCollection;
  isFavorite: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <CollectionFavoriteButton
        collectionId={collection.id}
        isFavorite={isFavorite}
      />
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
