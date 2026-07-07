# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification

## Workflow

This is the common workflow that we will use for every single feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Branch** - Create new branch for feature, fix, etc
3. **Implement** - Implement the feature/fix that I create in @context/current-feature.md
4. **Test** - Verify it works in the browser. Add/update **Vitest** unit tests for any new or changed server actions or utilities (see [Testing](#testing)). Run `npm run test` and `npm run build` and fix any errors
5. **Iterate** - Iterate and change things if needed
6. **Commit** - Only after tests and build pass and everything works
7. **Merge** - Merge to main
8. **Delete Branch** - Delete branch after merge
9. **Review** - Review AI-generated code periodically and on demand.
10. Mark as completed in @context/current-feature.md and add to history

Do NOT commit without permission and until the tests and build pass. If either fails, fix the issues first.

## Testing

We use **Vitest** for unit testing. Scope is deliberately narrow:

- **Test** server actions (`src/actions/*`) and utilities (`src/lib/*`) — pure logic, validation schemas, and data helpers.
- **Don't test** React components, pages, or layouts. Cover those with manual/browser checks now and E2E later if needed.
- Colocate test files as `*.test.ts` next to the code under test (e.g. `src/lib/features.test.ts`).
- Tests must run without a database or network — keep the code under test pure, or mock its dependencies (`vi.mock`, `vi.stubEnv`).
- Import test helpers explicitly from `vitest` (`import { describe, it, expect } from "vitest"`); globals are not enabled.

Commands:

- `npm run test` — run once (use in the workflow's Test step and before committing)
- `npm run test:watch` — watch mode for local development

Config lives in `vitest.config.mts` (node environment, `@/*` alias resolved from `tsconfig.json`).

## Branching

We will create a new branch for every feature/fix. Name branch **feature/[feature]** or **fix[fix]**, etc. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:, etc.)
- Keep commits focused (one feature/fix per commit)
- Never put "Generated With Claude" in the commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation)
- Performance (unnecessary re-renders, N+1 queries)
- Logic errors (edge cases)
- Patterns (matches existing codebase?)
