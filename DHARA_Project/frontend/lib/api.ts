import { PropertyDetail, PropertySummary, Project, Service, Testimonial } from "./types";
import {
  FALLBACK_PROJECTS,
  FALLBACK_PROPERTIES,
  FALLBACK_PROPERTY_DETAIL,
  FALLBACK_SERVICES,
  FALLBACK_TESTIMONIALS,
} from "./fallback-data";
import { API_BASE, PUBLIC_API_BASE } from "./config";

export { API_BASE };

// Demo mode: set USE_FALLBACK_DATA=true (server env) to render the bundled sample content when no
// backend is running. It is OFF by default, so real content is never masked by fixtures.
const USE_FALLBACK = process.env.USE_FALLBACK_DATA === "true";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

// Always fetched fresh (no Next.js data cache) so anything saved in the admin panel shows up on the
// very next page load.
async function rawGet(path: string): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    console.error(`[api] ${API_BASE}${path} unreachable:`, (e as Error).message);
    throw new ApiError("The content service is temporarily unavailable.", 0);
  }
}

/** Fetch and unwrap { data }. Throws ApiError on failure (unless demo mode is on). */
async function getJSON<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await rawGet(path);
    if (!res.ok) {
      console.error(`[api] GET ${path} -> ${res.status}`);
      throw new ApiError(`Request failed (${res.status})`, res.status);
    }
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch (e) {
    if (USE_FALLBACK) return fallback;
    throw e;
  }
}

/** Like getJSON but a 404 means "does not exist" and returns null. */
async function getJSONOrNull<T>(path: string, fallback: T | null): Promise<T | null> {
  try {
    const res = await rawGet(path);
    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`[api] GET ${path} -> ${res.status}`);
      throw new ApiError(`Request failed (${res.status})`, res.status);
    }
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch (e) {
    if (USE_FALLBACK) return fallback;
    throw e;
  }
}

/** Non-essential data (settings, testimonials, related items): never break the page if it fails. */
async function getJSONSafe<T>(path: string, fallback: T): Promise<T> {
  try {
    return await getJSON<T>(path, fallback);
  } catch {
    return fallback;
  }
}

export interface ListResult<T> {
  data: T[];
  meta?: { page: number; per_page: number; total: number; total_pages: number };
}

export async function fetchProperties(params: Record<string, string> = {}): Promise<ListResult<PropertySummary>> {
  const qs = new URLSearchParams(params).toString();
  try {
    const res = await rawGet(`/properties?${qs}`);
    if (!res.ok) {
      console.error(`[api] GET /properties -> ${res.status}`);
      throw new ApiError(`Request failed (${res.status})`, res.status);
    }
    return await res.json();
  } catch (e) {
    if (!USE_FALLBACK) throw e;
    let filtered = FALLBACK_PROPERTIES;
    if (params.category) filtered = filtered.filter((p) => p.category === params.category.toUpperCase());
    if (params.type) filtered = filtered.filter((p) => p.listing_type === params.type.toUpperCase());
    if (params.district) filtered = filtered.filter((p) => p.district_name === params.district);
    if (params.featured === "true") filtered = filtered.filter((p) => p.is_featured);
    return { data: filtered, meta: { page: 1, per_page: 12, total: filtered.length, total_pages: 1 } };
  }
}

export async function fetchProperty(slug: string): Promise<PropertyDetail | null> {
  return getJSONOrNull<PropertyDetail>(`/properties/${encodeURIComponent(slug)}`, FALLBACK_PROPERTY_DETAIL[slug] ?? null);
}

export async function fetchSimilarProperties(id: string): Promise<PropertySummary[]> {
  return getJSONSafe<PropertySummary[]>(`/properties/${id}/similar`, USE_FALLBACK ? FALLBACK_PROPERTIES.slice(0, 3) : []);
}

export async function fetchServices(): Promise<Service[]> {
  return getJSON<Service[]>(`/services`, FALLBACK_SERVICES);
}

export async function fetchService(slug: string): Promise<Service | null> {
  return getJSONOrNull<Service>(`/services/${encodeURIComponent(slug)}`, FALLBACK_SERVICES.find((s) => s.slug === slug) ?? null);
}

export async function fetchProjects(sector?: string): Promise<Project[]> {
  const qs = sector ? `?sector=${encodeURIComponent(sector)}` : "";
  const fallback = sector ? FALLBACK_PROJECTS.filter((p) => p.sector === sector) : FALLBACK_PROJECTS;
  return getJSON<Project[]>(`/projects${qs}`, fallback);
}

export async function fetchProject(slug: string): Promise<Project | null> {
  return getJSONOrNull<Project>(`/projects/${encodeURIComponent(slug)}`, FALLBACK_PROJECTS.find((p) => p.slug === slug) ?? null);
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  return getJSONSafe<Testimonial[]>(`/testimonials`, USE_FALLBACK ? FALLBACK_TESTIMONIALS : []);
}

export async function fetchLocations(): Promise<any[]> {
  return getJSONSafe<any[]>(`/locations`, []);
}

export interface PageContent {
  slug: string;
  title: string;
  body: string;
  meta_title?: string;
  meta_description?: string;
}

/** Editable copy for About / Privacy / Terms. Returns null until an admin saves it once. */
export async function fetchPage(slug: string): Promise<PageContent | null> {
  try {
    return await getJSONOrNull<PageContent>(`/pages/${slug}`, null);
  } catch {
    return null;
  }
}

export interface PublicSettings {
  contact?: { phone: string; email: string; address: string; hours?: string; whatsapp?: string };
  social?: { facebook?: string; linkedin?: string; instagram?: string; pinterest?: string; youtube?: string; tiktok?: string };
  usd_rate?: { rate: number; updated_manually: boolean };
  homepage_stats?: { years_experience: number; completed_projects: number; trusted_clients: number };
  why_dhara?: { title: string; body: string }[];
}

// FR-CNT-003 / FR-ADM-010: public-safe site settings (contact, socials, USD rate, stats).
export async function fetchSettings(): Promise<PublicSettings> {
  const raw = await getJSONSafe<Record<string, string>>(`/settings/public`, {});
  const parsed: PublicSettings = {};
  for (const key of Object.keys(raw)) {
    try {
      (parsed as any)[key] = typeof raw[key] === "string" ? JSON.parse(raw[key]) : raw[key];
    } catch {
      // leave unset if the value isn't valid JSON
    }
  }
  return parsed;
}

export async function submitLead(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${PUBLIC_API_BASE}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error?.message || "Submission failed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again or contact us via WhatsApp." };
  }
}

// FR-INQ-010: newsletter subscription with double opt-in.
export async function subscribeNewsletter(email: string, honeypot: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${PUBLIC_API_BASE}/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, website: honeypot }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error?.message || "Subscription failed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again later." };
  }
}

// FR-INQ-005 / FR-PRP-007: gated document mini-form — issues a time-limited signed download URL.
export async function requestDocument(
  documentId: string,
  payload: { name: string; phone: string; email: string }
): Promise<{ ok: boolean; downloadUrl?: string; error?: string }> {
  try {
    const res = await fetch(`${PUBLIC_API_BASE}/documents/${documentId}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: body?.error?.message || "Request failed" };
    }
    // Responses are wrapped as { data: ... } by the backend (see httpx.JSON).
    return { ok: true, downloadUrl: (body?.data ?? body)?.download_url };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again or contact us via WhatsApp." };
  }
}

export function documentDownloadUrl(documentId: string): string {
  return `${PUBLIC_API_BASE}/documents/${documentId}/download`;
}
