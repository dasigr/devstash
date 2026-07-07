import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connection } from "next/server";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user/UserAvatar";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { getProfile, getProfileStats } from "@/lib/db/profile";

export const metadata: Metadata = {
  title: "Profile",
};

/** Format an account creation date, e.g. "July 7, 2026". */
function formatJoinDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ProfilePage() {
  await connection();

  const user = await getProfile();
  // The proxy protects this route, but guard defensively.
  if (!user) redirect("/sign-in");

  const stats = await getProfileStats(user.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
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

      {/* Account info */}
      <section className="rounded-xl border border-border bg-card p-6">
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
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Member since</dt>
            <dd className="font-medium text-foreground">
              {formatJoinDate(user.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-border pt-6">
          <SignOutButton />
        </div>
      </section>

      {/* Usage stats */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Usage</h2>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-2xl font-semibold text-foreground">
              {stats.totalItems}
            </p>
            <p className="text-sm text-muted-foreground">Items</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-2xl font-semibold text-foreground">
              {stats.totalCollections}
            </p>
            <p className="text-sm text-muted-foreground">Collections</p>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-medium text-muted-foreground">
          By type
        </h3>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {stats.byType.map((type) => (
            <li
              key={type.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm text-foreground">
                <ItemTypeIcon
                  name={type.icon}
                  color={type.color}
                  className="size-4"
                />
                {type.name}
              </span>
              <span className="text-sm font-medium text-foreground">
                {type.count}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Change password — email/password accounts only */}
      {user.hasPassword && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground">
            Change password
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update the password you use to sign in.
          </p>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </section>
      )}

      {/* Danger zone */}
      <section className="rounded-xl border border-destructive/40 bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">
          Delete account
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your account and all of your items and collections.
          This cannot be undone.
        </p>
        <div className="mt-4">
          <DeleteAccountDialog />
        </div>
      </section>
    </div>
  );
}
