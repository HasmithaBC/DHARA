"use client";

// Thin authenticated fetch client for the admin panel. Tokens are kept in
// localStorage for simplicity in this reference build; a production hand-off
// may prefer httpOnly cookies issued by a small Next.js route handler instead.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080/api/v1";

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
  let res = await fetch(`${API_BASE}/admin${path}`, { ...options, headers });
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

export async function adminJSON<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await adminFetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message || `Request failed (${res.status})`);
  }
  return (body.data ?? body) as T;
}

export async function uploadMedia(file: File): Promise<{ url: string; content_type: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await adminFetch("/media-upload", {
    method: "POST",
    body: formData,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message || `Upload failed (${res.status})`);
  }
  return (body.data ?? body) as { url: string; content_type: string; size: number };
}

export { API_BASE };
