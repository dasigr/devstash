import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { FileText, FolderOpen, Star } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { ItemDrawerProvider } from "@/components/dashboard/ItemDrawer";
import { EditorPreferencesProvider } from "@/components/dashboard/editor-preferences-context";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { FavoriteItemRow } from "@/components/dashboard/FavoriteItemRow";
import { FavoriteCollectionRow } from "@/components/dashboard/FavoriteCollectionRow";
import { getFavoriteItems, getSidebarItemTypes } from "@/lib/db/items";
import {
  getFavoriteCollections,
  getSidebarCollections,
} from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";
import { getEditorPreferences } from "@/lib/db/editor-preferences";

export const metadata: Metadata = {
  title: "Favorites",
};

export default async function FavoritesPage() {
  // Read live data per request rather than baking it in at build.
  await connection();

  // Every query below is scoped to this user, so resolve them first. The proxy
  // guarantees a session on /favorites; redirect defensively rather than render
  // an unscoped page.
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in");

  const [
    items,
    collections,
    sidebarItemTypes,
    sidebarCollections,
    editorPreferences,
  ] = await Promise.all([
    getFavoriteItems(currentUser.id),
    getFavoriteCollections(currentUser.id),
    getSidebarItemTypes(currentUser.id),
    getSidebarCollections(currentUser.id),
    getEditorPreferences(currentUser.id),
  ]);

  const isEmpty = items.length === 0 && collections.length === 0;

  return (
    <SidebarProvider>
      <EditorPreferencesProvider value={editorPreferences}>
        {/* Item rows open the drawer in place, so wrap in the drawer provider. */}
        <ItemDrawerProvider>
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
                  <Star className="size-6 text-yellow-400" />
                  Favorites
                </h1>

                {isEmpty ? (
                  <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No favorites yet. Star an item or collection to see it here.
                  </p>
                ) : (
                  <>
                    <section>
                      <SectionHeader
                        icon={<FileText className="size-4" />}
                        title="Items"
                        count={items.length}
                      />
                      {items.length > 0 ? (
                        <div className="flex flex-col">
                          {items.map((item) => (
                            <FavoriteItemRow key={item.id} item={item} />
                          ))}
                        </div>
                      ) : (
                        <p className="px-2 py-1.5 text-sm text-muted-foreground">
                          No favorite items.
                        </p>
                      )}
                    </section>

                    <section>
                      <SectionHeader
                        icon={<FolderOpen className="size-4" />}
                        title="Collections"
                        count={collections.length}
                      />
                      {collections.length > 0 ? (
                        <div className="flex flex-col">
                          {collections.map((collection) => (
                            <FavoriteCollectionRow
                              key={collection.id}
                              collection={collection}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="px-2 py-1.5 text-sm text-muted-foreground">
                          No favorite collections.
                        </p>
                      )}
                    </section>
                  </>
                )}
              </main>
            </div>
          </div>
        </ItemDrawerProvider>
      </EditorPreferencesProvider>
    </SidebarProvider>
  );
}
