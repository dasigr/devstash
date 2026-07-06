import { handlers } from "@/auth";

// NextAuth's catch-all route handler (sign-in, callback, session, etc.).
export const { GET, POST } = handlers;
