// Central place for API addresses.
//
//  * PUBLIC_API_BASE  – what the visitor's BROWSER calls (admin panel, forms, download links).
//                       Inlined at build time from NEXT_PUBLIC_API_BASE_URL.
//  * SERVER_API_BASE  – what the Next.js SERVER calls while rendering pages. In Docker this must be
//                       the internal service address (http://backend:8080/api/v1) because
//                       "localhost" inside the frontend container is the container itself.
//                       Read at runtime from API_INTERNAL_URL; falls back to the public address.
export const PUBLIC_API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1").replace(/\/+$/, "");
export const SERVER_API_BASE = (process.env.API_INTERNAL_URL || PUBLIC_API_BASE).replace(/\/+$/, "");

/** Base URL for whichever side is executing. */
export const API_BASE = typeof window === "undefined" ? SERVER_API_BASE : PUBLIC_API_BASE;

/** Origin of the backend as seen by the browser, e.g. http://localhost:8080 (used for /uploads files). */
export const PUBLIC_API_ORIGIN = PUBLIC_API_BASE.replace(/\/api\/v\d+$/, "");

/** Public address of the website itself (used for share links, canonical URLs, structured data). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://dharact.com").replace(/\/+$/, "");

/** Canonical page for a listing. `/properties/{slug}` always exists for every category. */
export function propertyPath(slug: string): string {
  return `/properties/${slug}`;
}
