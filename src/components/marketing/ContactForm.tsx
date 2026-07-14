"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { marketingButton } from "@/components/marketing/marketing-button";
import { supportSchema } from "@/lib/validations/support";
import { toastManager } from "@/lib/toast";

type SupportField = "name" | "email" | "subject" | "message";
type FieldErrors = Partial<Record<SupportField, string>>;

const inputClassName =
  "w-full rounded-[10px] border border-[var(--m-border-2)] bg-[var(--m-bg)] px-3.5 py-[11px] text-[0.94rem] text-[var(--m-text)] placeholder:text-[var(--m-text-mute)] transition-[border-color,box-shadow] duration-150 focus:border-[var(--m-brand)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)] focus:outline-none";

/** Pull the first message per field from a Zod/route `fieldErrors` map. */
function firstErrors(
  fieldErrors: Partial<Record<string, string[] | undefined>>,
): FieldErrors {
  return {
    name: fieldErrors.name?.[0],
    email: fieldErrors.email?.[0],
    subject: fieldErrors.subject?.[0],
    message: fieldErrors.message?.[0],
  };
}

/**
 * Controlled contact form → `POST /api/support`. Client-side Zod validation for
 * instant field errors, disables while pending, toasts success/error, resets on
 * success, and surfaces server-side field errors from the response `issues`.
 */
export function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = supportSchema.safeParse({ name, email, subject, message });
    if (!parsed.success) {
      setErrors(firstErrors(z.flattenError(parsed.error).fieldErrors));
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => null);
        toastManager.add({
          title: "Too many messages",
          description: data?.error ?? "Please try again later.",
          timeout: 8000,
        });
        return;
      }

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        if (data?.issues) setErrors(firstErrors(data.issues));
        toastManager.add({
          title: "Couldn't send your message",
          description: data?.error ?? "Please check the form and try again.",
          timeout: 6000,
        });
        return;
      }

      toastManager.add({
        title: "Message sent",
        description: "Thanks for reaching out — we'll get back to you soon.",
        timeout: 6000,
      });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      toastManager.add({
        title: "Network error",
        description: "Please try again.",
        timeout: 6000,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Contact form"
      className="mx-auto max-w-[620px] rounded-[14px] border border-[var(--m-border)] bg-[var(--m-surface)] p-[30px]"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cf-name" label="Name" error={errors.name}>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            className={inputClassName}
          />
        </Field>
        <Field id="cf-email" label="Email" error={errors.email}>
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field id="cf-subject" label="Subject" error={errors.subject}>
          <input
            id="cf-subject"
            name="subject"
            type="text"
            placeholder="How can we help?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            aria-invalid={!!errors.subject}
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field id="cf-message" label="Message" error={errors.message}>
          <textarea
            id="cf-message"
            name="message"
            rows={5}
            placeholder="Tell us what's going on…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={!!errors.message}
            className={`${inputClassName} min-h-[130px] resize-y`}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={marketingButton({
          variant: "primary",
          size: "lg",
          block: true,
          className: "mt-5 disabled:cursor-not-allowed disabled:opacity-70",
        })}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Send message
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.86rem] font-semibold text-[var(--m-text)]"
      >
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-[0.82rem] text-[#f87171]">
          {error}
        </p>
      )}
    </div>
  );
}
