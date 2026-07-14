import { z } from "zod";

// Validation for the public contact form (POST /api/support). Mirrors the auth
// schemas — trim/normalize before the value ever reaches Resend, with generous
// caps so a single submission can't be used to send a huge payload.

export const supportSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export type SupportInput = z.infer<typeof supportSchema>;
