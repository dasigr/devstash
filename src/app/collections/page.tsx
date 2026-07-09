import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { FolderOpen } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { getAllCollections, getSidebarCollections } from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

export const metadata: Metadata = {
  title: "Collections",
};

export default async function CollectionsPage() {
  // Read live data per request rather than baking it in at build.
  await connection();

  // Every query below is scoped to this user, so resolve them first. The proxy
  // guarantees a session on /collections; redirect defensively rather than
  // render an unscoped page.
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in");

  const [collections, sidebarItemTypes, sidebarCollections] = await Promise.all([
    getAllCollections(currentUser.id),
    getSidebarItemTypes(currentUser.id),
    getSidebarCollections(currentUser.id),
  ]);

  return (
    <SidebarProvider>
      <div className="flex h-full min-h-screen bg-background text-foreground">
        <Sidebar
          itemTypes={sidebarItemTypes}
          collections={sidebarCollections}
          user={currentUser}
        />

        {/* Main column: top bar + content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 space-y-8 overflow-y-auto p-6">
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              <FolderOpen className="size-6 text-muted-foreground" />
              Collections
            </h1>

            <section>
              <SectionHeader
                icon={<FolderOpen className="size-4" />}
                title="All Collections"
                count={collections.length}
              />
              {collections.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {collections.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No collections yet.
                </p>
              )}
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
