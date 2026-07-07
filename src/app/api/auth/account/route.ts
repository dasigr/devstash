import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/auth/account — permanently delete the signed-in user's account.
// Cascades remove their items, collections, custom types, accounts, and
// sessions (see the schema's onDelete: Cascade relations). The client signs the
// user out afterward, which clears the JWT session cookie.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 },
    );
  }

  try {
    await prisma.user.delete({ where: { id: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
