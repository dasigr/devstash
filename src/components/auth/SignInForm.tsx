"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/lib/toast";

interface SignInFormProps {
  callbackUrl: string;
  /** Set after a successful registration redirect — fires a welcome toast. */
  justRegistered?: boolean;
  /**
   * Whether the just-registered account still needs email verification. Drives
   * the registration toast copy ("check your email" vs "you can sign in now").
   */
  awaitingVerification?: boolean;
  /** Set after a successful email-verification redirect — fires a toast. */
  justVerified?: boolean;
  /** Set when a verification link was expired/invalid — fires a toast. */
  verifyError?: "expired" | "invalid" | null;
  /** Set after a successful password reset redirect — fires a toast. */
  justReset?: boolean;
}

// lucide-react v1 dropped brand icons, so inline the GitHub mark.
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.53.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

/**
 * Only allow a relative, same-origin path (a single leading slash). Rejects
 * absolute URLs and protocol-relative `//host` values to avoid open redirects.
 */
function safeCallbackUrl(url: string): string {
  return /^\/(?![/\\])/.test(url) ? url : "/dashboard";
}

export function SignInForm({
  callbackUrl,
  justRegistered,
  awaitingVerification,
  justVerified,
  verifyError,
  justReset,
}: SignInFormProps) {
  const router = useRouter();
  const target = safeCallbackUrl(callbackUrl);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [githubPending, setGithubPending] = React.useState(false);
  // Email of an account that signed in with the right password but isn't yet
  // verified — drives the "resend verification email" prompt.
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<string | null>(
    null,
  );
  const [resendPending, setResendPending] = React.useState(false);

  // Fire a one-time toast for whichever status flag brought the user here
  // (registration, verification success, or a bad verification link), then
  // strip the flag from the URL so a refresh doesn't replay the toast.
  //
  // The toast is added via setTimeout so it lands *after* this commit's passive
  // effects flush. The <Toaster> provider subscribes to the shared toast
  // manager in its own passive effect; on a cold full-page load (e.g. arriving
  // from the email-verification redirect) this deep-child effect runs before
  // that root-level parent effect, and toastManager.add() has no queue — so an
  // immediate call would be dropped. Registration escaped this only because
  // it's a warm client navigation where the provider is already subscribed.
  const toastShown = React.useRef(false);
  React.useEffect(() => {
    if (toastShown.current) return;

    let toast: Parameters<typeof toastManager.add>[0] | null = null;
    let stripKey: string | null = null;

    if (justRegistered) {
      toast = {
        title: "Account created",
        description: awaitingVerification
          ? "Check your email for a verification link before signing in."
          : "You can now sign in with your email and password.",
        timeout: awaitingVerification ? 8000 : 6000,
      };
      stripKey = "registered";
    } else if (justVerified) {
      toast = {
        title: "Email verified",
        description: "You can now sign in with your email and password.",
        timeout: 6000,
      };
      stripKey = "verified";
    } else if (justReset) {
      toast = {
        title: "Password reset",
        description: "You can now sign in with your new password.",
        timeout: 6000,
      };
      stripKey = "reset";
    } else if (verifyError) {
      toast = {
        title: "Verification failed",
        description:
          verifyError === "expired"
            ? "That link has expired. Sign in to send yourself a new one."
            : "That link is invalid or has already been used.",
        timeout: 8000,
      };
      stripKey = "error";
    }

    if (!toast || !stripKey) return;
    toastShown.current = true;

    // Strip the flag so a refresh doesn't replay the toast.
    const params = new URLSearchParams(window.location.search);
    params.delete(stripKey);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/sign-in?${qs}` : "/sign-in");

    // No cleanup/clearTimeout: under React StrictMode the effect runs
    // mount → unmount → remount, and the `toastShown` ref persists across that
    // remount (same fiber), so clearing the timer on the throwaway unmount
    // would cancel the toast while the guard blocks it from rescheduling. The
    // ref already guarantees the toast is scheduled exactly once.
    setTimeout(() => toastManager.add(toast), 0);
  }, [justRegistered, awaitingVerification, justVerified, verifyError, justReset]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setPending(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);

    if (result?.error) {
      if (result.code === "email_not_verified") {
        setUnverifiedEmail(email);
        setError("Please verify your email before signing in.");
      } else if (result.code === "rate_limited") {
        const message =
          "Too many sign-in attempts. Please try again in a few minutes.";
        setError(message);
        toastManager.add({
          title: "Too many attempts",
          description: message,
          timeout: 8000,
        });
      } else {
        setError("Invalid email or password.");
      }
      return;
    }

    // Session cookie is set; navigate and refresh server components.
    router.push(target);
    router.refresh();
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setResendPending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => null);
        toastManager.add({
          title: "Too many attempts",
          description:
            data?.error ??
            "Too many requests. Please try again in a few minutes.",
          timeout: 8000,
        });
        return;
      }

      toastManager.add({
        title: "Verification email sent",
        description: "Check your inbox for a new verification link.",
        timeout: 6000,
      });
    } catch {
      // Non-fatal — guide the user to try again.
      toastManager.add({
        title: "Verification email sent",
        description: "Check your inbox for a new verification link.",
        timeout: 6000,
      });
    } finally {
      setResendPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your DevStash account
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={githubPending || pending}
        onClick={() => {
          setGithubPending(true);
          signIn("github", { callbackUrl: target });
        }}
      >
        {githubPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <GithubIcon className="size-4" />
        )}
        Sign in with GitHub
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {unverifiedEmail && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={resendPending}
            onClick={handleResend}
          >
            {resendPending && <Loader2 className="animate-spin" />}
            Resend verification email
          </Button>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending || githubPending}
        >
          {pending && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
