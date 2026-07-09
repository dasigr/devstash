import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getCollectionOptions } from "@/lib/db/collections";

// GET /api/collections — the signed-in user's collections, as picker options for
// the new/edit item forms. Requires a session; the query is scoped to that user,
// so nobody's collections leak into another user's picker. Deliberately outside
// the proxy matcher so an unauthenticated call returns JSON 401 rather than an
// HTML redirect.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 },
    );
  }

  const collections = await getCollectionOptions(session.user.id);
  return NextResponse.json({ success: true, data: collections });
}
