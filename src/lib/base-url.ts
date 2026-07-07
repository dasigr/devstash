// Resolve the app's public base URL for building absolute links (e.g. email
// verification links). Prefers an explicit AUTH_URL/NEXTAUTH_URL when set,
// otherwise derives the origin from the incoming request.
export function getBaseUrl(request: Request): string {
  const configured = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}
