import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connection } from "next/server";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UpgradePlans } from "@/components/upgrade/UpgradePlans";
import { getProfile } from "@/lib/db/profile";

export const metadata: Metadata = {
  title: "Upgrade to Pro",
};

export default async function UpgradePage() {
  await connection();

  const user = await getProfile();
  // The proxy protects this route, but guard defensively.
  if (!user) redirect("/sign-in");
  // Pro users have nothing to upgrade — send them to billing.
  if (user.isPro) redirect("/settings");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10">
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

      <div>
        <h1 className="text-lg font-semibold text-foreground">Upgrade to Pro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a plan and unlock everything DevStash has to offer.
        </p>
      </div>

      <UpgradePlans />
    </div>
  );
}
