import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LayoutGrid } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { LoadMoreItems } from "@/components/dashboard/LoadMoreItems";
import { ImageCardButton } from "@/components/dashboard/ImageCardButton";
import { FileListRow } from "@/components/dashboard/FileListRow";
import { ItemDrawerProvider } from "@/components/dashboard/ItemDrawer";
import { EditorPreferencesProvider } from "@/components/dashboard/editor-preferences-context";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import {
  getCardItemsPage,
  getSidebarItemTypes,
  getTypePreview,
} from "@/lib/db/items";
import { getSidebarCollections } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";
import { getEditorPreferences } from "@/lib/db/editor-preferences";
import { ITEMS_INDEX_PREVIEW_LIMIT } from "@/lib/pagination";

export const metadata: Metadata = { title: "All Items" };

/** A "View all →" link to a type's full listing, shown when the preview is capped. */
function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      View all →
    </Link>
  );
}

export default async function ItemsIndexPage() {
  // Read live data per request rather than baking it in at build.
  await connection();

  // Every query below is scoped to this user, so resolve them first. The proxy
  // guarantees a session on /items/*; redirect defensively rather than render an
  // unscoped page. No Pro guard — /items is a mixed overview for everyone; free
  // users simply have no files/images, so those sections hide.
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in");

  const [cardPage, images, files, sidebarItemTypes, sidebarCollections, editorPreferences] =
    await Promise.all([
      getCardItemsPage(currentUser.id, 1),
      getTypePreview("images", currentUser.id, ITEMS_INDEX_PREVIEW_LIMIT),
      getTypePreview("files", currentUser.id, ITEMS_INDEX_PREVIEW_LIMIT),
      getSidebarItemTypes(currentUser.id),
      getSidebarCollections(currentUser.id),
      getEditorPreferences(currentUser.id),
    ]);

  const hasCardItems = cardPage.pagination.totalCount > 0;
  const hasImages = Boolean(images && images.total > 0);
  const hasFiles = Boolean(files && files.total > 0);
  const isEmpty = !hasCardItems && !hasImages && !hasFiles;

  return (
    <SidebarProvider>
      <EditorPreferencesProvider value={editorPreferences}>
      <ItemDrawerProvider isPro={currentUser.isPro}>
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
            <h1 className="text-2xl font-semibold text-foreground">All items</h1>

            {isEmpty ? (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No items yet.
              </p>
            ) : (
              <>
                {hasCardItems && (
                  <section>
                    <SectionHeader
                      icon={<LayoutGrid className="size-4" />}
                      title="Items"
                      count={cardPage.pagination.totalCount}
                    />
                    <LoadMoreItems
                      initialItems={cardPage.items}
                      hasNext={cardPage.pagination.hasNext}
                      nextPage={cardPage.pagination.page + 1}
                    />
                  </section>
                )}

                {hasImages && images && (
                  <section>
                    <SectionHeader
                      icon={
                        <ItemTypeIcon
                          name={images.type.icon}
                          color={images.type.color}
                          className="size-4"
                        />
                      }
                      title="Images"
                      count={images.total}
                      action={
                        images.total > ITEMS_INDEX_PREVIEW_LIMIT ? (
                          <ViewAllLink href="/items/images" />
                        ) : undefined
                      }
                    />
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {images.items.map((item) => (
                        <ImageCardButton key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                )}

                {hasFiles && files && (
                  <section>
                    <SectionHeader
                      icon={
                        <ItemTypeIcon
                          name={files.type.icon}
                          color={files.type.color}
                          className="size-4"
                        />
                      }
                      title="Files"
                      count={files.total}
                      action={
                        files.total > ITEMS_INDEX_PREVIEW_LIMIT ? (
                          <ViewAllLink href="/items/files" />
                        ) : undefined
                      }
                    />
                    <div className="flex flex-col gap-1">
                      {files.items.map((item) => (
                        <FileListRow key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                )}
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
