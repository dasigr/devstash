"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Plus,
  Star,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SidebarItemType } from "@/lib/db/items";
import type { SidebarCollection } from "@/lib/db/collections";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { Logo } from "@/components/dashboard/Logo";
import { NavRow } from "@/components/dashboard/NavRow";
import { SectionLabel } from "@/components/dashboard/SectionLabel";
import { SidebarUser, type SidebarUserData } from "@/components/dashboard/SidebarUser";
import { useSidebar } from "@/components/dashboard/sidebar-context";

interface SidebarContentProps {
  collapsed: boolean;
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
  user: SidebarUserData;
  /** Fires when a nav link is clicked — used to close the mobile drawer. */
  onNavigate?: () => void;
  /** When set, renders a close button in the header (mobile drawer). */
  onClose?: () => void;
}

function SidebarContent({
  collapsed,
  itemTypes,
  collections,
  user,
  onNavigate,
  onClose,
}: SidebarContentProps) {
  const pathname = usePathname();
  const totalItems = itemTypes.reduce((sum, type) => sum + type.count, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-border",
          collapsed ? "justify-center px-0" : "px-4"
        )}
      >
        <Link
          href="/dashboard"
          aria-label="DevStash dashboard"
          onClick={onNavigate}
          className="rounded-lg transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Logo collapsed={collapsed} />
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Scrollable navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        <NavRow
          href="/dashboard"
          active={pathname === "/dashboard"}
          collapsed={collapsed}
          onNavigate={onNavigate}
          icon={<Home className="size-4" />}
          label="Home"
        />
        <NavRow
          href="/items"
          active={pathname === "/items"}
          collapsed={collapsed}
          onNavigate={onNavigate}
          icon={<LayoutGrid className="size-4" />}
          label="All items"
          trailing={
            <span className="text-xs tabular-nums text-muted-foreground">
              {totalItems}
            </span>
          }
        />

        <SectionLabel collapsed={collapsed}>Item Types</SectionLabel>
        {itemTypes.map((type) => (
          <NavRow
            key={type.id}
            href={`/items/${type.slug}`}
            active={pathname === `/items/${type.slug}`}
            collapsed={collapsed}
            onNavigate={onNavigate}
            icon={
              <ItemTypeIcon
                name={type.icon}
                color={type.color}
                className="size-4"
              />
            }
            label={type.name}
            badge={
              type.isPro ? (
                <Badge
                  variant="secondary"
                  className="h-auto px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  PRO
                </Badge>
              ) : undefined
            }
            trailing={
              <span className="text-xs tabular-nums text-muted-foreground">
                {type.count}
              </span>
            }
          />
        ))}

        <SectionLabel
          collapsed={collapsed}
          action={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="New collection"
            >
              <Plus className="size-3.5" />
            </Button>
          }
        >
          Collections
        </SectionLabel>
        {collections.map((collection) => (
          <NavRow
            key={collection.id}
            href={`/collections/${collection.id}`}
            active={pathname === `/collections/${collection.id}`}
            collapsed={collapsed}
            onNavigate={onNavigate}
            icon={
              // Favorites show a star; recents show a circle colored by the
              // collection's most-used item type.
              collection.isFavorite ? (
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
              ) : (
                <span
                  className="size-2.5 rounded-full bg-muted-foreground/40"
                  style={
                    collection.color
                      ? { backgroundColor: collection.color }
                      : undefined
                  }
                />
              )
            }
            label={collection.name}
          />
        ))}

        <NavRow
          href="/collections"
          active={pathname === "/collections"}
          collapsed={collapsed}
          onNavigate={onNavigate}
          icon={<LayoutGrid className="size-4" />}
          label="View all collections"
        />
      </nav>

      {/* User area */}
      <div className="mt-auto shrink-0 border-t border-border p-3">
        <SidebarUser user={user} collapsed={collapsed} />
      </div>
    </div>
  );
}

interface SidebarProps {
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
  user: SidebarUserData;
}

export function Sidebar({ itemTypes, collections, user }: SidebarProps) {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();

  // Lock body scroll and allow Escape to close while the mobile drawer is open.
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, closeMobile]);

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          itemTypes={itemTypes}
          collections={collections}
          user={user}
        />
      </aside>

      {/* Mobile drawer overlay */}
      <div
        aria-hidden
        onClick={closeMobile}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Mobile drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          collapsed={false}
          itemTypes={itemTypes}
          collections={collections}
          user={user}
          onNavigate={closeMobile}
          onClose={closeMobile}
        />
      </aside>
    </>
  );
}