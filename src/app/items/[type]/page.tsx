import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ItemCardButton } from "@/components/dashboard/ItemCardButton";
import { ImageCardButton } from "@/components/dashboard/ImageCardButton";
import { FileListRow } from "@/components/dashboard/FileListRow";
import { ItemDrawerProvider } from "@/components/dashboard/ItemDrawer";
import { EditorPreferencesProvider } from "@/components/dashboard/editor-preferences-context";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { Pagination } from "@/components/dashboard/Pagination";
import {
  getItemsByType,
  getSidebarItemTypes,
  getSystemItemType,
} from "@/lib/db/items";
import { getSidebarCollections } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";
import { getEditorPreferences } from "@/lib/db/editor-preferences";
import { parsePageParam } from "@/lib/pagination";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  // Only the label is needed here — no item query, so no owner scoping.
  const itemType = await getSystemItemType(type);
  return { title: itemType ? itemType.name : "Items" };
}

export default async function ItemsByTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  // Read live data per request rather than baking it in at build.
  await connection();

  const { type } = await params;
  const requestedPage = parsePageParam((await searchParams).page);

  // Every query below is scoped to this user, so resolve them first. The proxy
  // guarantees a session on /items/*; redirect defensively rather than render an
  // unscoped page.
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in");

  const [listing, sidebarItemTypes, sidebarCollections, editorPreferences] =
    await Promise.all([
      getItemsByType(type, currentUser.id, requestedPage),
      getSidebarItemTypes(currentUser.id),
      getSidebarCollections(currentUser.id),
      getEditorPreferences(currentUser.id),
    ]);

  // Unknown type slug — render a 404. (A known type the user has no items for
  // renders the empty state below, not a 404.)
  if (!listing) notFound();

  // The images type renders a thumbnail gallery, and the files type a
  // single-column list; every other type uses the standard item-card grid.
  const isImageGallery = listing.type.slug === "images";
  const isFileList = listing.type.slug === "files";

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
          <TopBar isPro={currentUser.isPro} />
          <main className="flex-1 space-y-8 overflow-y-auto p-6">
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              <ItemTypeIcon
                name={listing.type.icon}
                color={listing.type.color}
                className="size-6"
              />
              {listing.type.name}
            </h1>

            <section>
              <SectionHeader
                icon={
                  <ItemTypeIcon
                    name={listing.type.icon}
                    color={listing.type.color}
                    className="size-4"
                  />
                }
                title={`All ${listing.type.name}`}
                // The total across all pages, not just the items on this one.
                count={listing.pagination.totalCount}
              />
              {listing.items.length > 0 ? (
                isImageGallery ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {listing.items.map((item) => (
                      <ImageCardButton key={item.id} item={item} />
                    ))}
                  </div>
                ) : isFileList ? (
                  <div className="flex flex-col gap-1">
                    {listing.items.map((item) => (
                      <FileListRow key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {listing.items.map((item) => (
                      <ItemCardButton key={item.id} item={item} />
                    ))}
                  </div>
                )
              ) : (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No {listing.type.name.toLowerCase()} yet.
                </p>
              )}

              <Pagination
                pagination={listing.pagination}
                basePath={`/items/${listing.type.slug}`}
                label={`${listing.type.name} pages`}
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
