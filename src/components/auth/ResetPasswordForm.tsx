"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema } from "@/lib/validations/auth";

interface ResetPasswordFormProps {
  /** Reset token read from the URL (`/reset-password?token=...`). */
  token: string;
}

type FieldErrors = Partial<
  Record<"password" | "confirmPassword", string[]>
>;

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [values, setValues] = React.useState({
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  function update(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Client-side validation mirrors the server (same Zod schema).
    const parsed = resetPasswordSchema.safeParse({ ...values, token });
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors;
      setFieldErrors({
        password: flat.password,
        confirmPassword: flat.confirmPassword,
      });
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 400 && data?.issues) {
          setFieldErrors(data.issues as FieldErrors);
        } else {
          setFormError(
            data?.error ?? "Something went wrong. Please try again.",
          );
        }
        return;
      }

      // Password updated — send them to sign in; a success toast fires there.
      router.push("/sign-in?reset=1");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  // A missing token means the link was malformed or manually opened — there's
  // nothing to submit, so guide the user to request a fresh link.
  if (!token) {
    return (
      <div className="space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Invalid reset link
          </h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is missing or malformed. Request a new one
            to continue.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "w-full",
          })}
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Choose a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter a new password for your DevStash account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            New password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={update("password")}
            aria-invalid={!!fieldErrors.password?.length}
          />
          {!!fieldErrors.password?.length && (
            <p role="alert" className="text-sm text-destructive">
              {fieldErrors.password[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={values.confirmPassword}
            onChange={update("confirmPassword")}
            aria-invalid={!!fieldErrors.confirmPassword?.length}
          />
          {!!fieldErrors.confirmPassword?.length && (
            <p role="alert" className="text-sm text-destructive">
              {fieldErrors.confirmPassword[0]}
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Reset password
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/sign-in"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
