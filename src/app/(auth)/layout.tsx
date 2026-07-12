import Link from "next/link";

import { Logo } from "@/components/dashboard/Logo";

// Centered shell shared by the sign-in and register pages.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <Link
        href="/"
        aria-label="DevStash home"
        className="mb-8 rounded-lg transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Logo />
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
