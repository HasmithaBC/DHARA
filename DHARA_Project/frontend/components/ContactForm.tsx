"use client";

import { useState } from "react";
import { submitLead } from "@/lib/api";
import { HONEYPOT_FIELD_NAME, getHoneypot, getUtmParams } from "@/lib/lead-utils";

export default function ContactForm({ defaultService }: { defaultService?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    if (getHoneypot(form)) {
      setStatus("sent");
      return;
    }
    const inquiryType = form.get("inquiry_type");
    const leadType = inquiryType === "Property" ? "PROPERTY_INQUIRY" : inquiryType === "Construction Service" ? "SERVICE_CONSULTATION" : "GENERAL_CONTACT";

    const res = await submitLead({
      lead_type: leadType,
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      message: `[${form.get("subject") || "General"}] ${form.get("message") || ""}`,
      consent: form.get("consent") === "on",
      source_url: typeof window !== "undefined" ? window.location.href : "",
      website: "",
      ...getUtmParams(),
    });

    if (res.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(res.error ?? "Something went wrong. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="border border-brass bg-brass/10 p-6 text-sm text-ink">
        Thank you for reaching out — a member of our team will respond shortly.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Full name" className="border border-stone-line px-3 py-2" />
        <input name="phone" required placeholder="Phone" className="border border-stone-line px-3 py-2" />
      </div>
      <input name="email" required type="email" placeholder="Email" className="w-full border border-stone-line px-3 py-2" />
      <div className="grid gap-4 sm:grid-cols-2">
        <select name="inquiry_type" defaultValue={defaultService ? "Construction Service" : "General"} className="border border-stone-line px-3 py-2">
          <option value="General">General</option>
          <option value="Property">Property</option>
          <option value="Construction Service">Construction Service</option>
        </select>
        <input name="subject" placeholder="Subject" className="border border-stone-line px-3 py-2" />
      </div>
      <textarea name="message" rows={5} placeholder="Message" className="w-full border border-stone-line px-3 py-2" />
      <label className="flex items-start gap-2 text-xs text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        I agree to the <a href="/privacy-policy" className="underline">Privacy Policy</a>.
      </label>
      <input
        type="text"
        name={HONEYPOT_FIELD_NAME}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {status === "error" && <p className="text-xs text-red-700">{error}</p>}
      <button type="submit" disabled={status === "sending"} className="btn-primary">
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
