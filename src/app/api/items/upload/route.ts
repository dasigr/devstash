import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { buildObjectKey, isR2Configured, r2PublicUrl, uploadToR2 } from "@/lib/r2";
import { isUploadKind, validateUpload } from "@/lib/validations/upload";

// POST /api/items/upload — stream a file/image upload to Cloudflare R2 and
// return the stored file's metadata for the create-item flow. Session-guarded;
// not in the proxy matcher, so it returns JSON (not an HTML redirect) on 401.
// The server re-validates kind/size/extension/MIME — the client checks are UX
// only. This is the source of truth for what R2 will accept.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "You must be signed in." },
      { status: 401 },
    );
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { success: false, error: "File uploads are not configured." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid upload." },
      { status: 400 },
    );
  }

  const kind = form.get("kind");
  const file = form.get("file");

  if (!isUploadKind(kind)) {
    return NextResponse.json(
      { success: false, error: "Invalid upload type." },
      { status: 400 },
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "No file provided." },
      { status: 400 },
    );
  }

  const validation = validateUpload(kind, {
    name: file.name,
    size: file.size,
    type: file.type,
  });
  if (!validation.ok) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  try {
    const key = buildObjectKey(session.user.id, file.name);
    const body = Buffer.from(await file.arrayBuffer());
    await uploadToR2({
      key,
      body,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      success: true,
      data: {
        fileUrl: r2PublicUrl(key),
        fileName: file.name,
        fileSize: file.size,
      },
    });
  } catch (error) {
    console.error("Failed to upload file to R2:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
