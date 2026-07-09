import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { fileExtension } from "@/lib/validations/upload";

// Cloudflare R2 access via the S3-compatible API. R2 exposes an S3 endpoint at
// https://<account-id>.r2.cloudflarestorage.com and works with the AWS SDK.
// Objects are served to browsers through the public bucket URL (R2_PUBLIC_URL);
// downloads go through our own proxy route (see /api/items/[id]/download).

let client: S3Client | null = null;

/** Whether the R2 credentials needed to upload/delete are all present. */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

/** Lazily build (and memoize) the S3 client so importing this module is cheap. */
function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
  return client;
}

function bucket(): string {
  return process.env.R2_BUCKET_NAME ?? "";
}

/** Sanitize a filename for use in an object key (keeps a readable suffix). */
function sanitizeFileName(name: string): string {
  const ext = fileExtension(name);
  const base = ext ? name.slice(0, name.length - ext.length) : name;
  const safeBase = base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${safeBase || "file"}${ext}`;
}

/**
 * Build a unique, owner-namespaced object key for an upload, e.g.
 * `items/<userId>/<uuid>-<safe-name>.png`. The random prefix prevents
 * collisions and guessing; the name is preserved for readability.
 */
export function buildObjectKey(userId: string, originalName: string): string {
  return `items/${userId}/${crypto.randomUUID()}-${sanitizeFileName(originalName)}`;
}

/** The public URL an object at `key` is served from (via R2_PUBLIC_URL). */
export function r2PublicUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
  return `${base}/${key}`;
}

/** Extract the object key from a stored public URL, or null if it isn't one. */
export function r2KeyFromUrl(url: string): string | null {
  try {
    const key = new URL(url).pathname.replace(/^\/+/, "");
    return key || null;
  } catch {
    return null;
  }
}

/** Upload an object to R2. Body is a buffer (files are small — see constraints). */
export async function uploadToR2(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
}

/** Delete an object from R2 by key. */
export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket(), Key: key }),
  );
}

/** Fetch an object from R2 as a web stream, for the download proxy. */
export async function getFromR2(key: string): Promise<{
  stream: ReadableStream;
  contentType: string | undefined;
  contentLength: number | undefined;
}> {
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
  );
  return {
    stream: res.Body!.transformToWebStream(),
    contentType: res.ContentType,
    contentLength: res.ContentLength,
  };
}
