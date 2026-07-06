"use client";

import { Toast } from "@base-ui/react/toast";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { toastManager } from "@/lib/toast";

/**
 * App-wide toast host. Mounted once (root layout) and wired to the shared
 * `toastManager` so `toastManager.add(...)` from anywhere renders here.
 */
export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none sm:right-6 sm:bottom-6">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "relative flex items-start gap-3 rounded-lg border border-border bg-popover p-4 pr-9 text-popover-foreground shadow-lg",
        "transition-all duration-200 data-[ending-style]:translate-x-2 data-[starting-style]:translate-x-2 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <Toast.Title className="text-sm font-medium text-foreground" />
        <Toast.Description className="text-sm text-muted-foreground" />
      </div>
      <Toast.Close
        aria-label="Close"
        className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </Toast.Close>
    </Toast.Root>
  ));
}
