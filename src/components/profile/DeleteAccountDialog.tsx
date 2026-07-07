"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { Loader2, Trash2 } from "lucide-react";

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
import { toastManager } from "@/lib/toast";

/**
 * Destructive account-deletion action behind a confirmation dialog. On confirm
 * it DELETEs the account, then signs the user out (which clears the session and
 * redirects to /sign-in). The dialog stays open with a spinner while pending.
 */
export function DeleteAccountDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      const res = await fetch("/api/auth/account", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPending(false);
        setOpen(false);
        toastManager.add({
          title: "Couldn't delete account",
          description: data.error ?? "Please try again.",
          timeout: 6000,
        });
        return;
      }

      // Account is gone — end the session and land on sign-in.
      await signOut({ callbackUrl: "/sign-in" });
    } catch {
      setPending(false);
      setOpen(false);
      toastManager.add({
        title: "Couldn't delete account",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="destructive">
            <Trash2 />
            Delete account
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account along with all your items and
            collections. This action cannot be undone.
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
            Delete account
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
