# Current Feature

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial Next.js setup** — Bootstrapped the project with Create Next App, pinned the Node version (`.nvmrc` → v24.18.0), and cleaned up the Next.js boilerplate. Added the `CLAUDE.md` guide, project context files (`context/`), coding standards, and AI interaction guidelines.
- **Dashboard UI — Phase 1** — Initialized ShadCN UI (Tailwind v4) and added the `button` and `input` components. Set dark mode as the default on `<html>` and fixed the ShadCN font token so Geist loads correctly. Built the `/dashboard` route with the shell layout: a full-height sidebar (with the DevStash `Logo` brand mark on top) and a main column with a display-only top bar (search field + "New Collection" / "New Item" buttons). Sidebar and main content are `h2` placeholders for Phase 2.
- **Dashboard UI — Phase 2 (Sidebar)** — Built out the full sidebar from `mock-data.ts`. Added a `SidebarProvider` context (`sidebar-context.tsx`) plus a `useIsMobile` hook to drive one toggle that collapses the desktop rail to an icon-only strip and opens/closes a slide-in drawer on mobile (with overlay, `Escape`-to-close, and body-scroll lock). The `Sidebar` renders Home / All items, an **Item Types** section linking to `/items/<type>` (colored lucide icons via `ItemTypeIcon`, counts, `Pro` badges on file/image types), a **Collections** section (favorites starred + recent, colored type dots, `+` action), and a user area at the bottom (avatar, name, plan · email). Added a `SidebarToggle` (`PanelLeft`) to the top bar and made the `Logo` collapse to just its brand mark. Build and lint pass.
- **Dashboard UI — Phase 3 (Main Content)** — Built out the main content area from `mock-data.ts` as server components. Added a `Dashboard` page heading, a `StatsCards` row (Items, Collections, Favorite Items, Favorite Collections — derived counts), and three sections via a shared `SectionHeader` (icon + title + count): **Collections** (`CollectionCard` grid, background tinted by the collection's primary item type with a badge per type present), **Pinned Items**, and **Recent Items** (`ItemCard` with a left border colored by item type, preview box, tag chips, relative time, and a pin/favorite marker). Added a shared `ItemTypeBadge` (colored icon square) reused by both card types, and set a route-level `metadata` title of "Dashboard". Marked a few mock items as favorites so the favorite stats read non-zero. Build and lint pass.
- **Prisma + Neon PostgreSQL Setup** — Wired up **Prisma 7** against a **Neon** (serverless) Postgres dev branch. Followed Prisma 7's breaking changes: the `prisma-client` generator (not `prisma-client-js`) with a mandatory `output` at `src/generated/prisma` (gitignored; generated on `postinstall` + `build`), a required **driver adapter** (`@prisma/adapter-pg` over node-postgres) in the `src/lib/prisma.ts` client singleton, and the datasource url moved to `prisma.config.ts` (loaded via `dotenv`, CLI-only, prefers `DIRECT_URL` for migrate then falls back to `DATABASE_URL`). Authored `prisma/schema.prisma` from the `project-overview.md` data model plus **NextAuth models** (Account, Session, VerificationToken) with indexes and cascade deletes, and created/applied the initial migration with `migrate dev` (never `db push`). Added an idempotent `prisma/seed.ts` that seeds from `src/lib/mock-data.ts` (1 user, 7 system item types, 8 collections, 10 items, 26 tags, 27 item↔collection links) and a `scripts/test-db.ts` connectivity check. Added npm scripts: `db:migrate`, `db:migrate:deploy`, `db:seed`, `db:studio`, `db:test`. Build and lint pass; seed and DB test verified against the live Neon branch.