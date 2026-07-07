import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

// GET /api/items/[id] — full detail for one item, used by the item drawer.
// Requires a session; the query is scoped to the signed-in user, so a user can
// only fetch their own items (a foreign/unknown id returns 404, not 403, to
// avoid leaking which ids exist).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const item = await getItemDetail(id, session.user.id);
  if (!item) {
    return NextResponse.json(
      { success: false, error: "Item not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: item });
}
