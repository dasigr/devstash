import { Resend } from "resend";

// Resend client. RESEND_API_KEY is read from the environment (present in .env).
// We use Resend's shared sender (onboarding@resend.dev) so no domain
// verification is required for development.
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "DevStash <noreply@devstash.a5project.com>";

// Where contact-form submissions are delivered. Overridable via env so the
// support inbox can change without a code change; falls back to a sensible
// default address.
const SUPPORT_TO = process.env.SUPPORT_EMAIL || "support@a5project.com";

interface SendVerificationEmailArgs {
  to: string;
  /** Absolute URL the recipient clicks to verify their address. */
  verifyUrl: string;
}

/**
 * Send the "verify your email" message. Throws if Resend returns an error so
 * callers can decide how to surface a delivery failure.
 */
export async function sendVerificationEmail({
  to,
  verifyUrl,
}: SendVerificationEmailArgs): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your DevStash email",
    html: verificationEmailHtml(verifyUrl),
  });

  if (error) {
    throw new Error(`Resend failed to send verification email: ${error.message}`);
  }
}

interface SendPasswordResetEmailArgs {
  to: string;
  /** Absolute URL the recipient clicks to choose a new password. */
  resetUrl: string;
}

/**
 * Send the "reset your password" message. Throws if Resend returns an error so
 * callers can decide how to surface a delivery failure.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailArgs): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your DevStash password",
    html: passwordResetEmailHtml(resetUrl),
  });

  if (error) {
    throw new Error(`Resend failed to send password reset email: ${error.message}`);
  }
}

interface SendSupportEmailArgs {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Send a contact-form submission to the support inbox. `replyTo` is set to the
 * sender so a reply from the inbox reaches them directly. Throws if Resend
 * returns an error so the caller can decide how to surface a delivery failure.
 */
export async function sendSupportEmail({
  name,
  email,
  subject,
  message,
}: SendSupportEmailArgs): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to: SUPPORT_TO,
    replyTo: email,
    subject: `[Support] ${subject}`,
    html: supportEmailHtml({ name, email, subject, message }),
  });

  if (error) {
    throw new Error(`Resend failed to send support email: ${error.message}`);
  }
}

/** Escape user-supplied text before interpolating it into the email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function supportEmailHtml({
  name,
  email,
  subject,
  message,
}: SendSupportEmailArgs): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0a0a0a;">
    <h1 style="font-size: 20px; margin: 0 0 20px;">New support message</h1>
    <p style="font-size: 14px; line-height: 1.6; margin: 0 0 6px; color: #737373;">From</p>
    <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px; color: #0a0a0a;">
      ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;
    </p>
    <p style="font-size: 14px; line-height: 1.6; margin: 0 0 6px; color: #737373;">Subject</p>
    <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px; color: #0a0a0a;">
      ${escapeHtml(subject)}
    </p>
    <p style="font-size: 14px; line-height: 1.6; margin: 0 0 6px; color: #737373;">Message</p>
    <div style="font-size: 14px; line-height: 1.6; margin: 0; color: #0a0a0a; white-space: pre-wrap; border-left: 3px solid #e5e5e5; padding-left: 14px;">${escapeHtml(
      message,
    )}</div>
  </div>`;
}

function verificationEmailHtml(verifyUrl: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0a0a0a;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">Verify your email</h1>
    <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px; color: #404040;">
      Welcome to DevStash! Confirm your email address to activate your account and start stashing.
    </p>
    <a href="${verifyUrl}"
       style="display: inline-block; background: #0a0a0a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px;">
      Verify email
    </a>
    <p style="font-size: 12px; line-height: 1.6; margin: 24px 0 0; color: #737373;">
      This link expires in 24 hours. If you didn't create a DevStash account, you can safely ignore this email.
    </p>
    <p style="font-size: 12px; line-height: 1.6; margin: 16px 0 0; color: #737373; word-break: break-all;">
      Or paste this link into your browser:<br />${verifyUrl}
    </p>
  </div>`;
}

function passwordResetEmailHtml(resetUrl: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0a0a0a;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h1>
    <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px; color: #404040;">
      We received a request to reset your DevStash password. Click below to choose a new one.
    </p>
    <a href="${resetUrl}"
       style="display: inline-block; background: #0a0a0a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px;">
      Reset password
    </a>
    <p style="font-size: 12px; line-height: 1.6; margin: 24px 0 0; color: #737373;">
      This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.
    </p>
    <p style="font-size: 12px; line-height: 1.6; margin: 16px 0 0; color: #737373; word-break: break-all;">
      Or paste this link into your browser:<br />${resetUrl}
    </p>
  </div>`;
}
