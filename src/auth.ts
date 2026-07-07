import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import authConfig from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validations/auth";

// Thrown when the password is correct but the email hasn't been verified. The
// `code` surfaces to the client via signIn()'s result so the sign-in UI can
// show the "verify your email / resend" prompt instead of "invalid password".
class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

// Full (Node-runtime) auth instance: the edge-safe providers from
// auth.config.ts combined with the Prisma adapter. JWT session strategy is
// required here because the adapter's database sessions aren't edge-compatible,
// and the proxy needs to read the session from the token.
//
// The Credentials provider is redeclared here with the real bcrypt validation,
// overriding the `authorize: () => null` placeholder in auth.config.ts so the
// Node-only Prisma/bcrypt code never ends up in the edge/proxy bundle.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        // No user, or an OAuth-only account without a password hash.
        if (!user?.password) return null;

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) return null;

        // Correct credentials, but the email must be verified first.
        if (!user.emailVerified) throw new EmailNotVerifiedError();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
