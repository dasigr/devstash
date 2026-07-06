import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connection } from "next/server";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user/UserAvatar";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getCurrentUser } from "@/lib/db/user";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  await connection();

  const user = await getCurrentUser();
  // The proxy protects this route, but guard defensively.
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-10">
      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "w-fit text-muted-foreground"
        )}
      >
        <ArrowLeft />
        Back to dashboard
      </Link>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <UserAvatar name={user.name} image={user.image} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground">
              {user.name ?? "Account"}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="font-medium text-foreground">
              {user.isPro ? "Pro" : "Free"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-border pt-6">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
