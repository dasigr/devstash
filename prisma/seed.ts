import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ContentType } from "../src/generated/prisma/client";
import {
  currentUser,
  itemTypes,
  collections,
  pinnedItems,
  recentItems,
  type Item as MockItem,
} from "../src/lib/mock-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Map a mock item's type to its stored ContentType + storage-shape fields. */
function contentFields(item: MockItem) {
  const urlTypes = ["type_link"];
  const fileTypes = ["type_file", "type_image"];

  if (urlTypes.includes(item.itemTypeId)) {
    return { contentType: ContentType.URL, url: item.preview };
  }
  if (fileTypes.includes(item.itemTypeId)) {
    const fileName = item.preview.split(" ")[0];
    return {
      contentType: ContentType.FILE,
      fileName,
      fileUrl: `https://files.devstash.local/${fileName}`,
      description: item.preview,
    };
  }
  return {
    contentType: ContentType.TEXT,
    content: item.preview,
    language: item.language ?? null,
  };
}

async function main() {
  // Idempotent: wipe seeded domain data (FK-safe order) before re-inserting.
  await prisma.itemCollection.deleteMany();
  await prisma.item.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.itemType.deleteMany();
  await prisma.user.deleteMany();

  // User
  const user = await prisma.user.create({
    data: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      isPro: currentUser.isPro,
    },
  });

  // System item types (isSystem = true, no owner)
  for (const type of itemTypes) {
    await prisma.itemType.create({
      data: {
        id: type.id,
        name: type.name,
        icon: type.icon,
        color: type.color,
        isSystem: true,
      },
    });
  }

  // Collections — default type is the collection's most-common item type.
  for (const collection of collections) {
    await prisma.collection.create({
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isFavorite: collection.isFavorite,
        userId: user.id,
        defaultTypeId: collection.itemTypeIds[0] ?? null,
      },
    });
  }

  // Items (pinned + recent). Link each to any collection that lists its type,
  // and connect-or-create tags.
  const allItems = [...pinnedItems, ...recentItems];
  for (const item of allItems) {
    const memberCollectionIds = collections
      .filter((c) => c.itemTypeIds.includes(item.itemTypeId))
      .map((c) => c.id);

    await prisma.item.create({
      data: {
        id: item.id,
        title: item.title,
        userId: user.id,
        itemTypeId: item.itemTypeId,
        isPinned: item.isPinned,
        isFavorite: item.isFavorite,
        ...contentFields(item),
        tags: {
          connectOrCreate: item.tags.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
        collections: {
          create: memberCollectionIds.map((collectionId) => ({
            collection: { connect: { id: collectionId } },
          })),
        },
      },
    });
  }

  const [users, types, cols, items, tags, links] = await Promise.all([
    prisma.user.count(),
    prisma.itemType.count(),
    prisma.collection.count(),
    prisma.item.count(),
    prisma.tag.count(),
    prisma.itemCollection.count(),
  ]);

  console.log("Seed complete:", { users, types, cols, items, tags, links });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });