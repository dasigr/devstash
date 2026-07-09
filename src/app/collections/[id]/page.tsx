import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { FolderOpen, Star } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ItemCardButton } from "@/components/dashboard/ItemCardButton";
import { ItemDrawerProvider } from "@/components/dashboard/ItemDrawer";
import { getCollectionDetail, getSidebarCollections } from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

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

  const collection = await getCollectionDetail(id, currentUser.id);
  return { title: collection ? collection.name : "Collection" };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Read live data per request rather than baking it in at build.
  await connection();

  const { id } = await params;

  // Every query below is scoped to this user, so resolve them first. The proxy
  // guarantees a session on /collections/*; redirect defensively rather than
  // render an unscoped page.
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in");

  const [collection, sidebarItemTypes, sidebarCollections] = await Promise.all([
    getCollectionDetail(id, currentUser.id),
    getSidebarItemTypes(currentUser.id),
    getSidebarCollections(currentUser.id),
  ]);

  // Unknown id and another user's collection are indistinguishable here — both
  // come back null, so both 404 and neither confirms the collection exists.
  if (!collection) notFound();

  // The collection's primary item type tints the heading icon, matching its card.
  const primaryColor = collection.items[0]?.itemType.color;

  return (
    <SidebarProvider>
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
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <FolderOpen
                    className="size-6"
                    style={primaryColor ? { color: primaryColor } : undefined}
                  />
                  {collection.name}
                  {collection.isFavorite && (
                    <Star className="size-5 shrink-0 fill-amber-400 text-amber-400" />
                  )}
                </h1>
                {collection.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {collection.description}
                  </p>
                )}
              </div>

              <section>
                <SectionHeader
                  icon={<FolderOpen className="size-4" />}
                  title="Items"
                  count={collection.items.length}
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
              </section>
            </main>
          </div>
        </div>
      </ItemDrawerProvider>
    </SidebarProvider>
  );
}
