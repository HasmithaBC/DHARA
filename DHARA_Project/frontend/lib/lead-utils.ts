// Shared helpers for public lead-capture forms (FR-INQ-001/007/008, NFR-SEC-002).

/** Name of the honeypot field the backend silently drops (must stay empty). */
export const HONEYPOT_FIELD_NAME = "website";

/** Reads utm_source / utm_medium / utm_campaign from the current URL, if present. */
export function getUtmParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: { utm_source?: string; utm_medium?: string; utm_campaign?: string } = {};
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  if (source) out.utm_source = source;
  if (medium) out.utm_medium = medium;
  if (campaign) out.utm_campaign = campaign;
  return out;
}

/** Reads the honeypot input from a submitted form. Bots that fill every field trip this. */
export function getHoneypot(form: FormData): string {
  return (form.get(HONEYPOT_FIELD_NAME) as string) || "";
}
