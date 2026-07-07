import { defineConfig } from "vitest/config";

// Unit tests are scoped to server actions and utilities (not components), so we
// use the plain `node` environment — no jsdom, React plugin, or testing-library.
// `resolve.tsconfigPaths` resolves the `@/*` alias from tsconfig.json natively.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
