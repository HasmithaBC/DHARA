"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

const statuses = ["NEW", "CONTACTED", "SITE_VISIT_SCHEDULED", "NEGOTIATING", "CLOSED_WON", "CLOSED_LOST"];

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const guard = useRoleGuard(["SALES_MANAGER", "ADMINISTRATOR"]);
  const [lead, setLead] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminJSON<any>(`/leads/${params.id}`)
      .then((l) => { setLead(l); setNotes(l.internal_notes || ""); setStatus(l.status); })
      .catch((e) => setError(e.message));
  }, [params.id]);

  async function save() {
    try {
      await adminJSON(`/leads/${params.id}`, { method: "PATCH", body: JSON.stringify({ status, internal_notes: notes }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (error) return <div className="p-8 text-sm text-red-700">{error}</div>;
  if (!lead) return <div className="p-8 text-sm text-ink-soft">Loading…</div>;

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">{lead.name}</h1>
      <p className="text-sm text-ink-soft">{lead.lead_type.replace("_", " ")} · {new Date(lead.created_at).toLocaleString()}</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="border border-stone-line bg-stone-paper p-5 text-sm">
          <dl className="space-y-2">
            <div><dt className="text-xs text-ink-soft">Email</dt><dd>{lead.email}</dd></div>
            <div><dt className="text-xs text-ink-soft">Phone</dt><dd>{lead.phone}</dd></div>
            {lead.property_id && <div><dt className="text-xs text-ink-soft">Property ID</dt><dd className="text-xs">{lead.property_id}</dd></div>}
            {lead.message && <div><dt className="text-xs text-ink-soft">Message</dt><dd>{lead.message}</dd></div>}
            {lead.source_url && <div><dt className="text-xs text-ink-soft">Source URL</dt><dd className="break-all text-xs">{lead.source_url}</dd></div>}
            {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
              <div><dt className="text-xs text-ink-soft">UTM</dt><dd className="text-xs">{[lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ")}</dd></div>
            )}
          </dl>
        </div>

        <div className="border border-stone-line bg-stone-paper p-5 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-stone-line px-3 py-2">
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-xs text-ink-soft">Internal Notes (staff only)</span>
            <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-stone-line px-3 py-2" />
          </label>
          <button onClick={save} className="btn-primary mt-4">Save</button>
          {saved && <span className="ml-3 text-xs text-brass-dark">Saved.</span>}
        </div>
      </div>
    </div>
  );
}
