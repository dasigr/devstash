import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getSearchData } from "@/lib/db/search";

// GET /api/search — the signed-in user's searchable items and collections, used
// by the command palette to filter client-side. Requires a session; the queries
// are scoped to that user, so nobody's items leak into another user's palette.
// Deliberately outside the proxy matcher so an unauthenticated call returns JSON
// 401 rather than an HTML redirect.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 },
    );
  }

  const data = await getSearchData(session.user.id);
  return NextResponse.json({ success: true, data });
}
