import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ItemCardButton } from "@/components/dashboard/ItemCardButton";
import { ImageCardButton } from "@/components/dashboard/ImageCardButton";
import { ItemDrawerProvider } from "@/components/dashboard/ItemDrawer";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { getItemsByType, getSidebarItemTypes } from "@/lib/db/items";
import { getSidebarCollections } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const listing = await getItemsByType(type);
  return { title: listing ? listing.type.name : "Items" };
}

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  // Read live data per request rather than baking it in at build.
  await connection();

  const { type } = await params;

  const [listing, sidebarItemTypes, sidebarCollections, currentUser] =
    await Promise.all([
      getItemsByType(type),
      getSidebarItemTypes(),
      getSidebarCollections(),
      getCurrentUser(),
    ]);

  // Unknown type slug — render a 404.
  if (!listing) notFound();

  // The images type renders a thumbnail gallery instead of standard item cards.
  const isImageGallery = listing.type.slug === "images";

  const sidebarUser = currentUser ?? {
    name: null,
    email: null,
    image: null,
    isPro: false,
  };

  return (
    <SidebarProvider>
      <ItemDrawerProvider>
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
                count={listing.items.length}
              />
              {listing.items.length > 0 ? (
                isImageGallery ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {listing.items.map((item) => (
                      <ImageCardButton key={item.id} item={item} />
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
            </section>
          </main>
        </div>
      </div>
      </ItemDrawerProvider>
    </SidebarProvider>
  );
}
