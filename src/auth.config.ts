import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

// Edge-compatible slice of the auth config: providers only, no adapter.
// Imported by both the full config (src/auth.ts) and the edge proxy
// (src/proxy.ts) so the middleware bundle never pulls in Prisma/node-postgres.
//
// GitHub reads AUTH_GITHUB_ID / AUTH_GITHUB_SECRET from the environment.
//
// The Credentials provider is a placeholder here (`authorize: () => null`) so
// the edge bundle stays free of Prisma/bcrypt. The real bcrypt validation is
// supplied in src/auth.ts, which overrides this provider in the Node runtime.
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;
