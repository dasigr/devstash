import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

// Edge-compatible slice of the auth config: providers only, no adapter.
// Imported by both the full config (src/auth.ts) and the edge proxy
// (src/proxy.ts) so the middleware bundle never pulls in Prisma/node-postgres.
//
// GitHub reads AUTH_GITHUB_ID / AUTH_GITHUB_SECRET from the environment.
export const authConfig = {
  providers: [GitHub],
} satisfies NextAuthConfig;

export default authConfig;
