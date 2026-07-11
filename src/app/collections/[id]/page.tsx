import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { FolderOpen } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ItemCardButton } from "@/components/dashboard/ItemCardButton";
import { ItemDrawerProvider } from "@/components/dashboard/ItemDrawer";
import { EditorPreferencesProvider } from "@/components/dashboard/editor-preferences-context";
import { CollectionDetailActions } from "@/components/dashboard/CollectionDetailActions";
import { Pagination } from "@/components/dashboard/Pagination";
import {
  getCollectionDetail,
  getCollectionSummary,
  getSidebarCollections,
} from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import { getEditorPreferences } from "@/lib/db/editor-preferences";
import { parsePageParam } from "@/lib/pagination";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // Owner-scoped like the page itself: a foreign collection's name must not
  // leak through the document title.
  const currentUser = await getCurrentUser();
  if (!currentUser) return { title: "Collection" };

  // Only the name is needed here — the summary is cached and shared with the
  // page's own `getCollectionDetail`, so this costs no extra query.
  const collection = await getCollectionSummary(id, currentUser.id);
  return { title: collection ? collection.name : "Collection" };
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  // Read live data per request rather than baking it in at build.
  await connection();

  const { id } = await params;
  const requestedPage = parsePageParam((await searchParams).page);

  // Every query below is scoped to this user, so resolve them first. The proxy
  // guarantees a session on /collections/*; redirect defensively rather than
  // render an unscoped page.
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in");

  const [collection, sidebarItemTypes, sidebarCollections, editorPreferences] =
    await Promise.all([
      getCollectionDetail(id, currentUser.id, requestedPage),
      getSidebarItemTypes(currentUser.id),
      getSidebarCollections(currentUser.id),
      getEditorPreferences(currentUser.id),
    ]);

  // Unknown id and another user's collection are indistinguishable here — both
  // come back null, so both 404 and neither confirms the collection exists.
  if (!collection) notFound();

  // The first item's type tints the heading icon, matching its card. That's the
  // first item *of this page*, so the tint can shift between pages — the card's
  // own tint (a most-used-type tally) stays stable either way.
  const primaryColor = collection.items[0]?.itemType.color;

  return (
    <SidebarProvider>
      <EditorPreferencesProvider value={editorPreferences}>
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
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                    <FolderOpen
                      className="size-6 shrink-0"
                      style={primaryColor ? { color: primaryColor } : undefined}
                    />
                    {collection.name}
                  </h1>
                  {collection.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                </div>
                <CollectionDetailActions
                  collection={{
                    id: collection.id,
                    name: collection.name,
                    description: collection.description,
                  }}
                  isFavorite={collection.isFavorite}
                />
              </div>

              <section>
                <SectionHeader
                  icon={<FolderOpen className="size-4" />}
                  title="Items"
                  // The total across all pages, not just the cards on this one.
                  count={collection.pagination.totalCount}
                />
                {collection.items.length > 0 ? (
                  // A collection holds mixed item types, so every item renders as
                  // a standard card — no images-gallery / files-list branch.
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {collection.items.map((item) => (
                      <ItemCardButton key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No items in this collection yet.
                  </p>
                )}

                <Pagination
                  pagination={collection.pagination}
                  basePath={`/collections/${collection.id}`}
                  label="Collection item pages"
                />
              </section>
            </main>
          </div>
        </div>
      </ItemDrawerProvider>
      </EditorPreferencesProvider>
    </SidebarProvider>
  );
}
