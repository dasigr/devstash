"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { deleteCollection } from "@/actions/collections";
import { toastManager } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";

/**
 * Confirmation dialog for deleting a collection. Fully controlled, so it can be
 * opened from the detail page's Delete button or from a card's dropdown menu.
 *
 * Deleting a collection never deletes its items — only their membership in it.
 * The copy says so, since "delete" on a container reads as destructive.
 *
 * When `redirectToList` is set (the detail page, which is about to 404 on its
 * own id) we navigate to /collections instead of just refreshing in place.
 */
export function DeleteCollectionDialog({
  collectionId,
  collectionName,
  open,
  onOpenChange,
  redirectToList = false,
}: {
  collectionId: string;
  collectionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectToList?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      const result = await deleteCollection(collectionId);
      if (!result.success) {
        setPending(false);
        onOpenChange(false);
        toastManager.add({
          title: "Couldn't delete collection",
          description: result.error,
          timeout: 6000,
        });
        return;
      }

      toastManager.add({
        title: "Collection deleted",
        description: `“${collectionName}” has been deleted. Its items were kept.`,
        timeout: 6000,
      });

      if (redirectToList) {
        // Navigate away, and don't also call refresh() — refreshing the route we
        // are leaving (whose id no longer exists) aborts the pending navigation
        // and strands the user on the deleted collection. /collections is
        // dynamic, so push refetches it.
        router.push("/collections");
      } else {
        router.refresh();
      }
      onOpenChange(false);
    } catch {
      setPending(false);
      onOpenChange(false);
      toastManager.add({
        title: "Couldn't delete collection",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes &ldquo;{collectionName}&rdquo;. The items in it are
            <strong className="font-medium text-foreground"> not deleted</strong>
            {" "}— they just stop belonging to this collection. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose
            render={<Button variant="outline" disabled={pending} />}
          >
            Cancel
          </AlertDialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending && <Loader2 className="animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
