/**
 * Quick database connectivity + data check.
 * Run with: npm run db:test  (or `npx tsx scripts/test-db.ts`)
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — check your .env file.");
  }

  const [users, itemTypes, collections, items, tags, links] = await Promise.all(
    [
      prisma.user.count(),
      prisma.itemType.count(),
      prisma.collection.count(),
      prisma.item.count(),
      prisma.tag.count(),
      prisma.itemCollection.count(),
    ],
  );

  console.log("✅ Connected to the database. Row counts:");
  console.table({ users, itemTypes, collections, items, tags, links });

  // Sample a couple of items with their type, tags, and collections to
  // confirm relations resolve.
  const sample = await prisma.item.findMany({
    take: 3,
    orderBy: { createdAt: "asc" },
    include: {
      itemType: { select: { name: true } },
      tags: { select: { name: true } },
      collections: { include: { collection: { select: { name: true } } } },
    },
  });

  console.log("\nSample items:");
  for (const item of sample) {
    console.log(`• ${item.title} [${item.itemType.name}]`);
    console.log(`    tags: ${item.tags.map((t) => t.name).join(", ") || "—"}`);
    console.log(
      `    collections: ${
        item.collections.map((c) => c.collection.name).join(", ") || "—"
      }`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Database test failed:", e);
    process.exit(1);
  });