import { PUBLIC_API_ORIGIN } from "./config";

/**
 * Uploaded files are stored by the backend as relative paths ("/uploads/abc.webp").
 * The browser must load them from the backend, so turn them into absolute URLs.
 * External URLs and local /images/... assets are returned unchanged.
 */
export function mediaUrl(src?: string | null): string {
  if (!src) return "";
  if (src.startsWith("/uploads/")) return `${PUBLIC_API_ORIGIN}${src}`;
  return src;
}

/** Files served by the API can't go through next/image's optimiser (it may not reach the API). */
export function isUploadedMedia(src?: string | null): boolean {
  if (!src) return false;
  return src.startsWith("/uploads/") || src.startsWith(PUBLIC_API_ORIGIN + "/uploads/");
}
