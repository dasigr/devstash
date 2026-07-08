"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { deleteItem } from "@/actions/items";
import { toastManager } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";

/**
 * The item drawer's Delete action, behind a confirmation dialog. On confirm it
 * calls the owner-scoped `deleteItem` server action; on success it refreshes the
 * underlying card list (`router.refresh()`), toasts, and closes the drawer via
 * `onDeleted`. The dialog stays open with a spinner while pending.
 */
export function DeleteItemButton({
  itemId,
  itemTitle,
  onDeleted,
}: {
  itemId: string;
  itemTitle: string;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      const result = await deleteItem(itemId);
      if (!result.success) {
        setPending(false);
        setOpen(false);
        toastManager.add({
          title: "Couldn't delete item",
          description: result.error,
          timeout: 6000,
        });
        return;
      }

      toastManager.add({
        title: "Item deleted",
        description: `"${itemTitle}" has been deleted.`,
        timeout: 6000,
      });
      router.refresh();
      onDeleted();
    } catch {
      setPending(false);
      setOpen(false);
      toastManager.add({
        title: "Couldn't delete item",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Delete item"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this item?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes &ldquo;{itemTitle}&rdquo; and removes it from
            any collections. This action cannot be undone.
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
