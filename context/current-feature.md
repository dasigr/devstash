# Current Feature

<!-- Feature Name -->

Dashboard UI — Phase 3 (Main Content)

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

Phase 3 of 3 for the dashboard UI layout. Build out the main content area to the
right of the sidebar (from Phase 2). Import data directly from `src/lib/mock-data.js`
until the database is implemented. Follow `context/screenshots/dashboard-ui-main.png`
as the visual reference (does not have to be exact).

- **4 stats cards** at the top — number of items, collections, favorite items, and
  favorite collections _(not in the screenshot)_.
- **Recent collections** — grid of color-coded collection cards (background reflects
  the item type each collection holds most; show only the item-type icons of items in
  the collection).
- **Pinned items** — color-coded cards (left border reflects item type).
- **Recent items** — 10 most recent, as color-coded cards (left border reflects item type).

## Notes

<!-- Any extra notes -->

Full spec: `context/features/dashboard-phase-3-spec.md`.

References: `context/screenshots/dashboard-ui-main.png`, `context/project-overview.md`,
`src/lib/mock-data.js`, and the Phase 1 / Phase 2 specs in `context/features/`.

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial Next.js setup** — Bootstrapped the project with Create Next App, pinned the Node version (`.nvmrc` → v24.18.0), and cleaned up the Next.js boilerplate. Added the `CLAUDE.md` guide, project context files (`context/`), coding standards, and AI interaction guidelines.
- **Dashboard UI — Phase 1** — Initialized ShadCN UI (Tailwind v4) and added the `button` and `input` components. Set dark mode as the default on `<html>` and fixed the ShadCN font token so Geist loads correctly. Built the `/dashboard` route with the shell layout: a full-height sidebar (with the DevStash `Logo` brand mark on top) and a main column with a display-only top bar (search field + "New Collection" / "New Item" buttons). Sidebar and main content are `h2` placeholders for Phase 2.
- **Dashboard UI — Phase 2 (Sidebar)** — Built out the full sidebar from `mock-data.ts`. Added a `SidebarProvider` context (`sidebar-context.tsx`) plus a `useIsMobile` hook to drive one toggle that collapses the desktop rail to an icon-only strip and opens/closes a slide-in drawer on mobile (with overlay, `Escape`-to-close, and body-scroll lock). The `Sidebar` renders Home / All items, an **Item Types** section linking to `/items/<type>` (colored lucide icons via `ItemTypeIcon`, counts, `Pro` badges on file/image types), a **Collections** section (favorites starred + recent, colored type dots, `+` action), and a user area at the bottom (avatar, name, plan · email). Added a `SidebarToggle` (`PanelLeft`) to the top bar and made the `Logo` collapse to just its brand mark. Build and lint pass.
- **Dashboard UI — Phase 3 (Main Content)** — Built out the main content area from `mock-data.ts` as server components. Added a `Dashboard` page heading, a `StatsCards` row (Items, Collections, Favorite Items, Favorite Collections — derived counts), and three sections via a shared `SectionHeader` (icon + title + count): **Collections** (`CollectionCard` grid, background tinted by the collection's primary item type with a badge per type present), **Pinned Items**, and **Recent Items** (`ItemCard` with a left border colored by item type, preview box, tag chips, relative time, and a pin/favorite marker). Added a shared `ItemTypeBadge` (colored icon square) reused by both card types, and set a route-level `metadata` title of "Dashboard". Marked a few mock items as favorites so the favorite stats read non-zero. Build and lint pass.