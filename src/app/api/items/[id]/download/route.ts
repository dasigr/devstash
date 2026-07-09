import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemFile } from "@/lib/db/items";
import { getFromR2, r2KeyFromUrl } from "@/lib/r2";

// GET /api/items/[id]/download — proxy a file/image item's R2 object through our
// own origin so the browser can download it without cross-origin (CORS) issues,
// and so access stays owner-scoped. Session-guarded; the query is scoped to the
// signed-in user, so a foreign/unknown id returns 404 (no existence leak).
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
  const file = await getItemFile(id, session.user.id);
  if (!file) {
    return NextResponse.json(
      { success: false, error: "File not found." },
      { status: 404 },
    );
  }

  const key = r2KeyFromUrl(file.fileUrl);
  if (!key) {
    return NextResponse.json(
      { success: false, error: "File not found." },
      { status: 404 },
    );
  }

  try {
    const object = await getFromR2(key);
    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.contentType ?? "application/octet-stream",
    );
    if (object.contentLength !== undefined) {
      headers.set("Content-Length", String(object.contentLength));
    }
    // Force a download with the original filename (RFC 5987 for non-ASCII).
    const asciiName = file.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );

    return new Response(object.stream, { status: 200, headers });
  } catch (error) {
    console.error("Failed to fetch R2 object for download:", id, error);
    return NextResponse.json(
      { success: false, error: "Download failed. Please try again." },
      { status: 500 },
    );
  }
}
