import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connection } from "next/server";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BillingSection } from "@/components/settings/BillingSection";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { EditorPreferencesForm } from "@/components/settings/EditorPreferencesForm";
import { getProfile } from "@/lib/db/profile";
import { getEditorPreferences } from "@/lib/db/editor-preferences";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  await connection();

  const user = await getProfile();
  // The proxy protects this route, but guard defensively.
  if (!user) redirect("/sign-in");

  const editorPreferences = await getEditorPreferences(user.id);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
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
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account.
        </p>
      </div>

      {/* Editor preferences */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">
          Editor preferences
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the code editor. Changes save automatically.
        </p>
        <div className="mt-4">
          <EditorPreferencesForm initial={editorPreferences} />
        </div>
      </section>

      {/* Billing */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Billing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.isPro
            ? "You're on the Pro plan."
            : "Upgrade to Pro for unlimited items, collections, uploads, and AI features."}
        </p>
        <div className="mt-4">
          <BillingSection isPro={user.isPro} />
        </div>
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
