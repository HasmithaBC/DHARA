import { fetchSettings, PublicSettings } from "./api";

export interface ContactInfo {
  phone: string; // as typed in Admin → Settings, e.g. "+94 76 377 4551"
  telHref: string; // tel:+94763774551
  email: string;
  address: string;
  hours: string;
  whatsapp: string; // digits only, international format, e.g. 94763774551
}

const DEFAULTS = {
  phone: "+94763774551",
  email: "kosala@dharact.com",
  address: "No. 535/1B, Kakunagahalanda Waththa, Heiyanthuduwa, Sri Lanka",
  hours: "Monday – Saturday, 8:30am – 5:30pm",
};

/** Sri Lankan number -> digits in international format ("0763774551" -> "94763774551"). */
function toWhatsappDigits(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("0")) return `94${d.slice(1)}`;
  return d;
}

export function resolveContact(settings: PublicSettings): ContactInfo {
  const c = settings.contact;
  const phone = (c?.phone || "").trim() || DEFAULTS.phone;
  const waFromSettings = toWhatsappDigits((c?.whatsapp || "").trim());
  const waFromPhone = toWhatsappDigits(phone);
  const waFromEnv = toWhatsappDigits(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "");
  return {
    phone,
    telHref: `tel:${phone.replace(/[^\d+]/g, "")}`,
    email: (c?.email || "").trim() || DEFAULTS.email,
    address: (c?.address || "").trim() || DEFAULTS.address,
    hours: (c?.hours || "").trim() || DEFAULTS.hours,
    // Admin → Settings (WhatsApp field) wins, then the main phone number, then the env var.
    whatsapp: waFromSettings || waFromPhone || waFromEnv || "94763774551",
  };
}

/** Live contact details from Admin → Settings. Never throws (falls back to defaults). */
export async function getContact(): Promise<ContactInfo> {
  return resolveContact(await fetchSettings());
}
