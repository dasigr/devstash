import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    registered?: string;
    verified?: string;
    error?: string;
  }>;
}) {
  const { callbackUrl, registered, verified, error } = await searchParams;
  return (
    <SignInForm
      callbackUrl={callbackUrl || "/dashboard"}
      justRegistered={registered === "1" || registered === "ready"}
      awaitingVerification={registered === "1"}
      justVerified={verified === "1"}
      verifyError={error === "expired" || error === "invalid" ? error : null}
    />
  );
}
