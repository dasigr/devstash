/**
 * Delete all users and their content EXCEPT the demo user
 * (test-engineer@a5project.com).
 *
 * Each user's items, collections, custom item types, accounts, and sessions
 * are removed via the schema's ON DELETE CASCADE foreign keys. This also
 * clears verification tokens for the deleted accounts and any tags left with
 * no items. System item types (userId = null) are never touched.
 *
 * Dry run (default):  npm run db:purge-users
 * Actually delete:     npm run db:purge-users -- --yes
 *
 * ⚠️  Destructive. Respects DATABASE_URL from .env — make sure it points at the
 *     branch you intend (development, NOT production).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const KEEP_EMAIL = "test-engineer@a5project.com";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Best-effort host label from the connection string, for the safety print. */
function dbHost(url: string | undefined): string {
  if (!url) return "(unknown)";
  try {
    return new URL(url).host;
  } catch {
    return "(unparseable)";
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — check your .env file.");
  }

  const apply =
    process.argv.includes("--yes") || process.argv.includes("--force");

  console.log(`Target database host: ${dbHost(process.env.DATABASE_URL)}`);
  console.log(`Keeping user:         ${KEEP_EMAIL}`);
  console.log(`Mode:                 ${apply ? "APPLY (deleting)" : "DRY RUN"}\n`);

  // Locate the user to keep first. If it's missing, bail out — otherwise
  // "delete everyone except X" would wipe the entire table.
  const keep = await prisma.user.findUnique({
    where: { email: KEEP_EMAIL },
    select: { id: true },
  });
  if (!keep) {
    console.error(
      `❌ No user found with email ${KEEP_EMAIL}. Aborting so this doesn't ` +
        `delete every user. (Wrong database branch, or the demo user is missing?)`,
    );
    process.exit(1);
  }

  // Everything scoped by id, so users with a null email are handled correctly.
  const doomed = await prisma.user.findMany({
    where: { id: { not: keep.id } },
    select: {
      id: true,
      email: true,
      _count: { select: { items: true, collections: true, itemTypes: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (doomed.length === 0) {
    console.log("✅ Nothing to delete — only the demo user exists.");
    return;
  }

  console.log(`Users to delete (${doomed.length}):`);
  for (const u of doomed) {
    console.log(
      `  • ${u.email ?? "(no email)"} — ${u._count.items} items, ` +
        `${u._count.collections} collections, ${u._count.itemTypes} custom types`,
    );
  }
  console.log("");

  if (!apply) {
    console.log(
      "Dry run only. Re-run with `-- --yes` to actually delete:\n" +
        "  npm run db:purge-users -- --yes",
    );
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    // Cascade removes each user's items, collections, custom item types,
    // accounts, sessions, and item↔collection links.
    const users = await tx.user.deleteMany({ where: { id: { not: keep.id } } });

    // Verification tokens are keyed by email (no FK), so clear any that don't
    // belong to the kept user.
    const tokens = await tx.verificationToken.deleteMany({
      where: { identifier: { not: KEEP_EMAIL } },
    });

    // Tags are a global many-to-many; drop any now left with no items.
    const tags = await tx.tag.deleteMany({ where: { items: { none: {} } } });

    return { users: users.count, tokens: tokens.count, tags: tags.count };
  });

  console.log("✅ Done. Deleted:");
  console.table({
    users: result.users,
    "verification tokens": result.tokens,
    "orphaned tags": result.tags,
  });
}

main()
  .catch((e) => {
    console.error("❌ Purge failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
