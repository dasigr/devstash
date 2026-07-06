"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Star,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";
import type { SidebarItemType } from "@/lib/db/items";
import type { SidebarCollection } from "@/lib/db/collections";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { Logo } from "@/components/dashboard/Logo";
import { useSidebar } from "@/components/dashboard/sidebar-context";

interface NavRowProps {
  href: string;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
}

function NavRow({
  href,
  active,
  collapsed,
  onNavigate,
  icon,
  label,
  trailing,
}: NavRowProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && trailing}
    </Link>
  );
}

function SectionLabel({
  children,
  collapsed,
  action,
}: {
  children: React.ReactNode;
  collapsed: boolean;
  action?: React.ReactNode;
}) {
  if (collapsed) {
    return <div className="mx-3 my-2 border-t border-border" />;
  }
  return (
    <div className="flex items-center justify-between px-3 pt-4 pb-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
        {children}
      </p>
      {action}
    </div>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
  /** Fires when a nav link is clicked — used to close the mobile drawer. */
  onNavigate?: () => void;
  /** When set, renders a close button in the header (mobile drawer). */
  onClose?: () => void;
}

function SidebarContent({
  collapsed,
  itemTypes,
  collections,
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
        <Logo collapsed={collapsed} />
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
            trailing={
              type.isPro ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  Pro
                </span>
              ) : (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {type.count}
                </span>
              )
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
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-blue-500 text-xs font-semibold text-white"
            title={collapsed ? currentUser.name : undefined}
          >
            {currentUser.avatarInitials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium text-foreground">
                  {currentUser.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {currentUser.isPro ? "Pro" : "Free"} · {currentUser.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Account menu"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface SidebarProps {
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
}

export function Sidebar({ itemTypes, collections }: SidebarProps) {
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
          onNavigate={closeMobile}
          onClose={closeMobile}
        />
      </aside>
    </>
  );
}