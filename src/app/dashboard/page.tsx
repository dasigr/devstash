import { Clock, FolderOpen, Pin } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { ItemCard } from "@/components/dashboard/ItemCard";
import type { Metadata } from "next";
import { connection } from "next/server";

import {
  getCollectionStats,
  getRecentCollections,
  getSidebarCollections,
} from "@/lib/db/collections";
import {
  getItemStats,
  getPinnedItems,
  getRecentItems,
  getSidebarItemTypes,
} from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  // Read live data per request rather than baking it in at build.
  await connection();

  const [
    collections,
    collectionStats,
    pinnedItems,
    recentItems,
    itemStats,
    sidebarItemTypes,
    sidebarCollections,
    currentUser,
  ] = await Promise.all([
    getRecentCollections(),
    getCollectionStats(),
    getPinnedItems(),
    getRecentItems(),
    getItemStats(),
    getSidebarItemTypes(),
    getSidebarCollections(),
    getCurrentUser(),
  ]);

  // The proxy guarantees a session on /dashboard; fall back defensively.
  const sidebarUser = currentUser ?? {
    name: null,
    email: null,
    image: null,
    isPro: false,
  };

  return (
    <SidebarProvider>
      <div className="flex h-full min-h-screen bg-background text-foreground">
        <Sidebar
          itemTypes={sidebarItemTypes}
          collections={sidebarCollections}
          user={sidebarUser}
        />

        {/* Main column: top bar + content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 space-y-8 overflow-y-auto p-6">
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

            <StatsCards
              itemsCount={itemStats.total}
              favoriteItemsCount={itemStats.favorites}
              collectionsCount={collectionStats.total}
              favoriteCollectionsCount={collectionStats.favorites}
            />

            {/* Collections */}
            <section>
              <SectionHeader
                icon={<FolderOpen className="size-4" />}
                title="Collections"
                count={collections.length}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {collections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            </section>

            {/* Pinned Items — hidden entirely when nothing is pinned. */}
            {pinnedItems.length > 0 && (
              <section>
                <SectionHeader
                  icon={<Pin className="size-4 rotate-45" />}
                  title="Pinned Items"
                  count={pinnedItems.length}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {pinnedItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Items */}
            <section>
              <SectionHeader
                icon={<Clock className="size-4" />}
                title="Recent Items"
                count={recentItems.length}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {recentItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}