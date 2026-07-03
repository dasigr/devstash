import { Clock, FolderOpen, Pin } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { ItemCard } from "@/components/dashboard/ItemCard";
import type { Metadata } from "next";

import { collections, pinnedItems, recentItems } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Show up to 10 of the most recent items (mock order stands in for recency).
const recent = recentItems.slice(0, 10);

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex h-full min-h-screen bg-background text-foreground">
        <Sidebar />

        {/* Main column: top bar + content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 space-y-8 overflow-y-auto p-6">
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

            <StatsCards />

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

            {/* Pinned Items */}
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

            {/* Recent Items */}
            <section>
              <SectionHeader
                icon={<Clock className="size-4" />}
                title="Recent Items"
                count={recent.length}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {recent.map((item) => (
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