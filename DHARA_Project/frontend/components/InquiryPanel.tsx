"use client";

import { useState } from "react";
import { submitLead } from "@/lib/api";
import { PropertyDetail } from "@/lib/types";
import { HONEYPOT_FIELD_NAME, getHoneypot, getUtmParams } from "@/lib/lead-utils";

export default function InquiryPanel({
  property,
  price,
  whatsappLink,
}: {
  property: PropertyDetail;
  price: string;
  whatsappLink: string;
}) {
  const [mode, setMode] = useState<"inquiry" | "inspection">("inquiry");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const form = new FormData(e.currentTarget);
    if (getHoneypot(form)) {
      // Bot filled the hidden field — pretend success without hitting the API.
      setStatus("sent");
      return;
    }
    const payload: Record<string, unknown> = {
      lead_type: mode === "inspection" ? "SITE_INSPECTION" : "PROPERTY_INQUIRY",
      property_id: property.id,
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      message: form.get("message") || "",
      consent: form.get("consent") === "on",
      source_url: typeof window !== "undefined" ? window.location.href : "",
      website: "",
      ...getUtmParams(),
    };
    if (mode === "inspection") {
      payload.preferred_inspection_date = form.get("date");
      payload.preferred_inspection_slot = form.get("slot");
    } else if (property.listing_type === "SALE") {
      const offer = form.get("offer");
      if (offer) payload.offer_amount_lkr = Number(offer);
    }

    const res = await submitLead(payload);
    if (res.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(res.error ?? "Something went wrong. Please try again.");
    }
  }

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  return (
    <>
      <aside className="h-fit border border-stone-line bg-stone-paper p-6 lg:sticky lg:top-24">
        <div className="font-display text-xl text-ink">{price}</div>
        <div className="mt-1 text-xs text-ink-soft">Ref: {property.reference_code}</div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <a href="tel:+94763774551" className="btn-outline justify-center px-2 text-xs">Call</a>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-brass justify-center px-2 text-xs">WhatsApp</a>
          <button onClick={() => document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" })} className="btn-primary justify-center px-2 text-xs">
            Inquire
          </button>
        </div>

        <div className="mt-6 flex border-b border-stone-line text-sm">
          <button
            className={`flex-1 pb-2 ${mode === "inquiry" ? "border-b-2 border-ink font-medium text-ink" : "text-ink-soft"}`}
            onClick={() => setMode("inquiry")}
          >
            Inquire
          </button>
          <button
            className={`flex-1 pb-2 ${mode === "inspection" ? "border-b-2 border-ink font-medium text-ink" : "text-ink-soft"}`}
            onClick={() => setMode("inspection")}
          >
            Schedule Visit
          </button>
        </div>

        {status === "sent" ? (
          <div className="mt-6 border border-brass bg-brass/10 p-4 text-sm text-ink">
            Thank you — we've received your {mode === "inspection" ? "inspection request" : "inquiry"} and will
            be in touch shortly.
          </div>
        ) : (
          <form id="inquiry-form" onSubmit={onSubmit} className="mt-6 space-y-3 text-sm">
            <input name="name" required placeholder="Full name" className="w-full border border-stone-line px-3 py-2 transition-colors focus:border-brass focus:outline-none" />
            <input name="phone" required placeholder="Phone / WhatsApp" className="w-full border border-stone-line px-3 py-2 transition-colors focus:border-brass focus:outline-none" />
            <input name="email" required type="email" placeholder="Email" className="w-full border border-stone-line px-3 py-2 transition-colors focus:border-brass focus:outline-none" />

            {mode === "inspection" ? (
              <div className="grid grid-cols-2 gap-2">
                <input name="date" type="date" min={tomorrow} max={maxDate} required className="border border-stone-line px-3 py-2" />
                <select name="slot" required className="border border-stone-line px-3 py-2">
                  <option value="MORNING">Morning</option>
                  <option value="AFTERNOON">Afternoon</option>
                  <option value="EVENING">Evening</option>
                </select>
              </div>
            ) : (
              <>
                <textarea name="message" placeholder="Message" rows={3} className="w-full border border-stone-line px-3 py-2 transition-colors focus:border-brass focus:outline-none" />
                {property.listing_type === "SALE" && (
                  <input name="offer" type="number" placeholder="Proposed offer (LKR, optional)" className="w-full border border-stone-line px-3 py-2 transition-colors focus:border-brass focus:outline-none" />
                )}
              </>
            )}

            <label className="flex items-start gap-2 text-xs text-ink-soft">
              <input type="checkbox" name="consent" required className="mt-0.5" />
              I agree to the <a href="/privacy-policy" className="underline">Privacy Policy</a>.
            </label>

            {/* Honeypot — hidden from real visitors, tripped by bots (NFR-SEC-002) */}
            <input
              type="text"
              name={HONEYPOT_FIELD_NAME}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {status === "error" && <p className="text-xs text-red-700">{error}</p>}

            <button type="submit" disabled={status === "sending"} className="btn-primary w-full justify-center transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0">
              {status === "sending" ? "Sending…" : mode === "inspection" ? "Request Site Visit" : "Send Inquiry"}
            </button>
          </form>
        )}
      </aside>

      {/* Mobile sticky bottom action bar — FR-PRP-009 */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-stone-line bg-stone-paper p-3 shadow-[0_-4px_16px_-4px_rgba(33,34,30,0.15)] lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <a href="tel:+94763774551" className="btn-outline justify-center px-2 text-xs">Call</a>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-brass justify-center px-2 text-xs">WhatsApp</a>
        <button
          onClick={() => document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="btn-primary justify-center px-2 text-xs"
        >
          Inquire
        </button>
      </div>
      {/* Spacer so the fixed bar never overlaps page content on mobile */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  );
}
