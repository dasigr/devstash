"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordSchema } from "@/lib/validations/auth";
import { toastManager } from "@/lib/toast";

/**
 * Change-password form for email/password accounts. Validates locally with the
 * shared schema, then POSTs to /api/auth/change-password, surfacing server
 * field/code errors inline and confirming success with a toast.
 */
export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Couldn't change your password.");
        return;
      }

      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      toastManager.add({
        title: "Password changed",
        description: "Your password has been updated.",
        timeout: 6000,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label
          htmlFor="currentPassword"
          className="text-sm font-medium text-foreground"
        >
          Current password
        </label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          aria-invalid={!!error}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="newPassword"
          className="text-sm font-medium text-foreground"
        >
          New password
        </label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-foreground"
        >
          Confirm new password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={!!error}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Change password
      </Button>
    </form>
  );
}
