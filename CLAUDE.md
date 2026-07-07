# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links, and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
- `npm run test` — run the Vitest unit tests once
- `npm run test:watch` — run Vitest in watch mode

Unit tests use **Vitest** and are scoped to **server actions and utilities only** (`src/actions/*`, `src/lib/*`) — not components/pages. Colocate tests as `*.test.ts` next to the code under test.

Node version is pinned in `.nvmrc` (v24.18.0); run `nvm use` before installing or running.

## Working in this codebase

@AGENTS.md

Per `AGENTS.md`, this is Next.js 16 with breaking changes from earlier versions. Before writing framework code, read the relevant guide in `node_modules/next/dist/docs/` rather than relying on prior Next.js knowledge.

## Neon Database (MCP)

When using the Neon MCP for this project, ALWAYS scope operations to:

- **Project:** `devstash` — projectId `patient-wildflower-11743361` (org `Vercel: Personal`, `org-orange-river-03575016`)
- **Branch:** `development` — branchId `br-cool-leaf-aotja3d5`

Rules:

- Always pass both `projectId` and `branchId` explicitly on every Neon MCP call (`run_sql`, `run_sql_transaction`, migrations, etc.). Never rely on the default branch.
- **NEVER touch the `production` branch** (`br-silent-bread-aowzptnx`, the primary/default) unless I explicitly name "production" in my request. This includes reads — default to `development` for everything.
- Never run destructive SQL (`DROP`, `DELETE`, `TRUNCATE`, `UPDATE`/`INSERT` without explicit instruction) on any branch without asking first.
- If a request is ambiguous about which branch, assume `development` and say so.
