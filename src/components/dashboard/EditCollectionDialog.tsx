"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { updateCollection } from "@/actions/collections";
import { toastManager } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** The collection metadata this dialog edits. */
export interface EditableCollection {
  id: string;
  name: string;
  description: string | null;
}

/** Trim a value and treat blank as null (matches the server-side coercion). */
function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Modal for editing a collection's metadata (name, description). Fully
 * controlled — the caller owns `open`, so the same dialog can be opened from the
 * detail page's Edit button or from a card's dropdown menu (a dialog rendered
 * inside the menu would unmount with it).
 *
 * On success it toasts and refreshes, so the dashboard grid, the /collections
 * page, and the sidebar — all server reads — pick up the new name together.
 */
export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: {
  collection: EditableCollection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>
            Rename this collection or update its description.
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so the fields always initialize from the
            collection's saved values rather than the last edit. */}
        {open && (
          <EditCollectionForm
            collection={collection}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditCollectionForm({
  collection,
  onOpenChange,
}: {
  collection: EditableCollection;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nameEmpty = name.trim() === "";
  const submitDisabled = nameEmpty || pending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitDisabled) return;
    setError(null);

    setPending(true);
    try {
      const result = await updateCollection(collection.id, {
        name: name.trim(),
        description: blankToNull(description),
      });
      if (!result.success) {
        setError(result.error);
        toastManager.add({
          title: "Couldn't save collection",
          description: result.error,
          timeout: 6000,
        });
        return;
      }

      toastManager.add({
        title: "Collection updated",
        description: `“${result.data.name}” has been saved.`,
        timeout: 6000,
      });
      router.refresh();
      onOpenChange(false);
    } catch {
      setError("Something went wrong. Please try again.");
      toastManager.add({
        title: "Couldn't save collection",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    } finally {
      setPending(false);
    }
  }

  const fieldId = `edit-collection-${collection.id}`;

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
      <div className="space-y-1.5">
        <label
          htmlFor={`${fieldId}-name`}
          className="text-sm font-medium text-foreground"
        >
          Name
        </label>
        <Input
          id={`${fieldId}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={nameEmpty}
          placeholder="e.g. React Patterns"
          autoFocus
          required
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${fieldId}-description`}
          className="text-sm font-medium text-foreground"
        >
          Description
        </label>
        <Textarea
          id={`${fieldId}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitDisabled}>
          {pending && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}
