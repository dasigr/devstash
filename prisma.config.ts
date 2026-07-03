import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Used only by the Prisma CLI (migrate / introspect). Prefer Neon's
    // direct (unpooled) connection — the pooled endpoint breaks migrate's
    // advisory locks — and fall back to DATABASE_URL when DIRECT_URL is unset.
    // The app itself connects at runtime via the adapter in src/lib/prisma.ts.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});