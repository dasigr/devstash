# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links, and custom types.

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

No test runner is configured yet.

Node version is pinned in `.nvmrc` (v24.18.0); run `nvm use` before installing or running.

## Architecture

DevStash is a Next.js 16 (App Router) application using React 19, TypeScript (strict), and Tailwind CSS v4.

- **Routing**: App Router under `src/app/`. `layout.tsx` is the root layout (loads Geist fonts, applies global styles); route UI lives in colocated `page.tsx` files.
- **Styling**: Tailwind CSS v4 via PostCSS (`@tailwindcss/postcss`). There is no `tailwind.config`; the single entry point is `@import "tailwindcss"` in `src/app/globals.css`.
- **React Compiler is enabled** (`reactCompiler: true` in `next.config.ts`, backed by `babel-plugin-react-compiler`). Do not hand-add `useMemo`/`useCallback`/`memo` for optimization the compiler already handles.
- **Imports**: use the `@/*` alias for `./src/*`.

## Working in this codebase

@AGENTS.md

Per `AGENTS.md`, this is Next.js 16 with breaking changes from earlier versions. Before writing framework code, read the relevant guide in `node_modules/next/dist/docs/` rather than relying on prior Next.js knowledge.
