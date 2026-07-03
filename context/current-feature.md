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