import { NextResponse } from "next/server";
import { z } from "zod";

import { sendSupportEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { supportSchema } from "@/lib/validations/support";

// POST /api/support — public contact form. Emails the team via Resend. Not
// added to the proxy matcher: unauthenticated visitors must be able to submit,
// and a blocked/invalid request should get JSON, not an HTML redirect.
export async function POST(request: Request) {
  // Rate limit by IP (3 / hour) to curb spam on this public endpoint.
  const rate = await checkRateLimit("support", getClientIp(request));
  if (!rate.success) return rateLimitResponse(rate);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = supportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  try {
    await sendSupportEmail(parsed.data);
  } catch (error) {
    // Log the real error, return a generic message so nothing internal leaks.
    console.error("Failed to send support email:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
