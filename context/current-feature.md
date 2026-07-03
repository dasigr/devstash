# Current Feature

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial Next.js setup** — Bootstrapped the project with Create Next App, pinned the Node version (`.nvmrc` → v24.18.0), and cleaned up the Next.js boilerplate. Added the `CLAUDE.md` guide, project context files (`context/`), coding standards, and AI interaction guidelines.
- **Dashboard UI — Phase 1** — Initialized ShadCN UI (Tailwind v4) and added the `button` and `input` components. Set dark mode as the default on `<html>` and fixed the ShadCN font token so Geist loads correctly. Built the `/dashboard` route with the shell layout: a full-height sidebar (with the DevStash `Logo` brand mark on top) and a main column with a display-only top bar (search field + "New Collection" / "New Item" buttons). Sidebar and main content are `h2` placeholders for Phase 2.
- **Dashboard UI — Phase 2 (Sidebar)** — Built out the full sidebar from `mock-data.ts`. Added a `SidebarProvider` context (`sidebar-context.tsx`) plus a `useIsMobile` hook to drive one toggle that collapses the desktop rail to an icon-only strip and opens/closes a slide-in drawer on mobile (with overlay, `Escape`-to-close, and body-scroll lock). The `Sidebar` renders Home / All items, an **Item Types** section linking to `/items/<type>` (colored lucide icons via `ItemTypeIcon`, counts, `Pro` badges on file/image types), a **Collections** section (favorites starred + recent, colored type dots, `+` action), and a user area at the bottom (avatar, name, plan · email). Added a `SidebarToggle` (`PanelLeft`) to the top bar and made the `Logo` collapse to just its brand mark. Build and lint pass.