"use client";

import * as React from "react";
// Only the primitives — never cmdk's own `CommandDialog`. The shell below is the
// app's Base UI Dialog instead, so every dialog in the app behaves identically.
// This does NOT keep Radix out of the bundle: cmdk hard-depends on
// @radix-ui/react-dialog and imports it at module scope, and Turbopack ships it
// regardless — every package involved already declares `sideEffects: false`.
import {
  Command as CommandPrimitive,
  CommandEmpty as CommandEmptyPrimitive,
  CommandGroup as CommandGroupPrimitive,
  CommandInput as CommandInputPrimitive,
  CommandItem as CommandItemPrimitive,
  CommandList as CommandListPrimitive,
} from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandInputPrimitive>) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <CommandInputPrimitive
        data-slot="command-input"
        className={cn(
          "h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandListPrimitive>) {
  return (
    <CommandListPrimitive
      data-slot="command-list"
      className={cn("max-h-80 overflow-y-auto overflow-x-hidden p-2", className)}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandEmptyPrimitive>) {
  return (
    <CommandEmptyPrimitive
      data-slot="command-empty"
      className={cn("py-8 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandGroupPrimitive>) {
  return (
    <CommandGroupPrimitive
      data-slot="command-group"
      className={cn(
        "overflow-hidden text-foreground",
        "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandItemPrimitive>) {
  return (
    <CommandItemPrimitive
      data-slot="command-item"
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm outline-none select-none",
        "data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

interface CommandDialogProps extends React.ComponentProps<typeof Command> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name for the dialog; rendered visually hidden. */
  title: string;
  children: React.ReactNode;
}

/**
 * The palette shell: the app's Base UI Dialog wrapping a cmdk Command. Padding
 * is stripped from DialogContent so the command input can sit flush against the
 * top edge, and the built-in close button is hidden (Escape closes it).
 */
function CommandDialog({
  open,
  onOpenChange,
  title,
  children,
  className,
  ...props
}: CommandDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="top-[20%] max-w-xl translate-y-0 overflow-hidden p-0"
        data-slot="command-dialog"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <Command className={className} {...props}>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
};
