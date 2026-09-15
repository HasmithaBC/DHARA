import { PropertyDetail, PropertySummary, Project, Service, Testimonial } from "./types";
import {
  FALLBACK_PROJECTS,
  FALLBACK_PROPERTIES,
  FALLBACK_PROPERTY_DETAIL,
  FALLBACK_SERVICES,
  FALLBACK_TESTIMONIALS,
} from "./fallback-data";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

async function safeFetch<T>(path: string, fallback: T, revalidate = 60): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
    if (!res.ok) return fallback;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch {
    // Backend not reachable (e.g. local frontend-only preview) — serve fixture data
    // so the site still renders. Real deployments will always hit the live API.
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
    const res = await fetch(`${API_BASE}/properties?${qs}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch {
    return { data: FALLBACK_PROPERTIES, meta: { page: 1, per_page: 12, total: FALLBACK_PROPERTIES.length, total_pages: 1 } };
  }
}

export async function fetchProperty(slug: string): Promise<PropertyDetail | null> {
  const fallback = FALLBACK_PROPERTY_DETAIL[slug] ?? null;
  return safeFetch<PropertyDetail | null>(`/properties/${slug}`, fallback);
}

export async function fetchSimilarProperties(id: string): Promise<PropertySummary[]> {
  return safeFetch<PropertySummary[]>(`/properties/${id}/similar`, FALLBACK_PROPERTIES.slice(0, 3));
}

export async function fetchServices(): Promise<Service[]> {
  return safeFetch<Service[]>(`/services`, FALLBACK_SERVICES);
}

export async function fetchService(slug: string): Promise<Service | null> {
  const fallback = FALLBACK_SERVICES.find((s) => s.slug === slug) ?? null;
  return safeFetch<Service | null>(`/services/${slug}`, fallback);
}

export async function fetchProjects(sector?: string): Promise<Project[]> {
  const qs = sector ? `?sector=${encodeURIComponent(sector)}` : "";
  const fallback = sector ? FALLBACK_PROJECTS.filter((p) => p.sector === sector) : FALLBACK_PROJECTS;
  return safeFetch<Project[]>(`/projects${qs}`, fallback);
}

export async function fetchProject(slug: string): Promise<Project | null> {
  const fallback = FALLBACK_PROJECTS.find((p) => p.slug === slug) ?? null;
  return safeFetch<Project | null>(`/projects/${slug}`, fallback);
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  return safeFetch<Testimonial[]>(`/testimonials`, FALLBACK_TESTIMONIALS);
}

export async function fetchLocations(): Promise<any[]> {
  return safeFetch<any[]>(`/locations`, []);
}

export interface PublicSettings {
  contact?: { phone: string; email: string; address: string };
  social?: { facebook?: string; linkedin?: string; instagram?: string; pinterest?: string };
  usd_rate?: { rate: number; updated_manually: boolean };
  homepage_stats?: { years_experience: number; completed_projects: number; trusted_clients: number };
}

// FR-CNT-003 / FR-ADM-010: public-safe site settings (contact, socials, USD rate, stats).
export async function fetchSettings(): Promise<PublicSettings> {
  const raw = await safeFetch<Record<string, string>>(`/settings/public`, {});
  const parsed: PublicSettings = {};
  for (const key of Object.keys(raw)) {
    try {
      (parsed as any)[key] = JSON.parse(raw[key]);
    } catch {
      // leave unset if the value isn't valid JSON
    }
  }
  return parsed;
}

export async function submitLead(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/leads`, {
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
    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
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
    const res = await fetch(`${API_BASE}/documents/${documentId}/request`, {
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
  return `${API_BASE}/documents/${documentId}/download`;
}
