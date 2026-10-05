"use client";

// Thin authenticated fetch client for the admin panel. Tokens are kept in
// localStorage for simplicity in this reference build; a production hand-off
// may prefer httpOnly cookies issued by a small Next.js route handler instead.

import { PUBLIC_API_BASE as API_BASE } from "./config";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dhara_access_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("dhara_access_token", access);
  localStorage.setItem("dhara_refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("dhara_access_token");
  localStorage.removeItem("dhara_refresh_token");
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dhara_role");
}

export function setRole(role: string) {
  localStorage.setItem("dhara_role", role);
}

async function tryRefresh(): Promise<boolean> {
  const refresh = typeof window !== "undefined" ? localStorage.getItem("dhara_refresh_token") : null;
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const body = await res.json();
    setTokens(body.data.access_token, body.data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (options.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/admin${path}`, { ...options, headers });
  } catch {
    throw new Error(`Cannot reach the API at ${API_BASE}. Is the backend running, and is this site's address listed in ALLOWED_ORIGINS?`);
  }
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${getToken()}` };
      res = await fetch(`${API_BASE}/admin${path}`, { ...options, headers: retryHeaders });
    } else {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/admin";
    }
  }
  return res;
}

/** Turns the backend's { error: { message, fields } } into one readable message. */
export function errorMessage(body: any, fallback: string): string {
  const msg = body?.error?.message || fallback;
  const fields = body?.error?.fields;
  if (fields && typeof fields === "object") {
    const details = Object.values(fields).filter(Boolean).join(" · ");
    if (details) return `${msg}: ${details}`;
  }
  return msg;
}

/** Error that keeps the backend's per-field validation messages so forms can highlight them. */
export class AdminApiError extends Error {
  fields: Record<string, string>;
  status: number;
  constructor(message: string, status = 0, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export async function adminJSON<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await adminFetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AdminApiError(errorMessage(body, `Request failed (${res.status})`), res.status, body?.error?.fields ?? {});
  }
  return (body.data ?? body) as T;
}

/** Public (no-auth) endpoints used inside the admin, e.g. the location tree and amenities. */
export async function publicJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  const body = await res.json();
  return (body.data ?? body) as T;
}

export interface ListMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** For paginated admin lists: returns both rows and pagination meta. */
export async function adminList<T>(path: string): Promise<{ data: T[]; meta?: ListMeta }> {
  const res = await adminFetch(path);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(errorMessage(body, `Request failed (${res.status})`));
  return { data: (body.data ?? []) as T[], meta: body.meta };
}

/**
 * Uploads an image (JPEG/PNG/WebP) or PDF and returns its "/uploads/..." path.
 * Pass a propertyId when uploading for a property: that route is open to Sales Managers,
 * while the generic /media-upload (services, projects) is for Content Editors and Administrators.
 */
export async function uploadMedia(file: File, propertyId?: string, folder?: string): Promise<{ url: string; content_type: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) {
    formData.append("folder", folder);
  }
  const res = await adminFetch(propertyId ? `/properties/${propertyId}/media-upload` : "/media-upload", {
    method: "POST",
    body: formData,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(errorMessage(body, `Upload failed (${res.status})`));
  }
  return (body.data ?? body) as { url: string; content_type: string; size: number };
}

export { API_BASE };
