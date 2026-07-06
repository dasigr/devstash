import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>;
}) {
  const { callbackUrl, registered } = await searchParams;
  return (
    <SignInForm
      callbackUrl={callbackUrl || "/dashboard"}
      justRegistered={registered === "1"}
    />
  );
}
