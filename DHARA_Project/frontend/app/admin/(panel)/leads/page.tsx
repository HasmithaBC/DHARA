"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminJSON, API_BASE, getToken } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

interface Lead {
  id: string;
  lead_type: string;
  property_id?: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

const statuses = ["NEW", "CONTACTED", "SITE_VISIT_SCHEDULED", "NEGOTIATING", "CLOSED_WON", "CLOSED_LOST"];
const leadTypes = ["PROPERTY_INQUIRY", "SITE_INSPECTION", "GENERAL_CONTACT", "SERVICE_CONSULTATION", "DOCUMENT_DOWNLOAD", "NEWSLETTER"];

export default function LeadsPage() {
  const guard = useRoleGuard(["SALES_MANAGER", "ADMINISTRATOR"]);
  const [rows, setRows] = useState<Lead[]>([]);
  const [status, setStatus] = useState("");
  const [leadType, setLeadType] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (leadType) params.set("lead_type", leadType);
      const data = await adminJSON<Lead[]>(`/leads?${params.toString()}`);
      setRows(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, [status, leadType]); // eslint-disable-line react-hooks/exhaustive-deps

  function exportCsv() {
    const token = getToken();
    fetch(`${API_BASE}/admin/leads/export`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "leads.csv";
        a.click();
      });
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Leads</h1>
        <button onClick={exportCsv} className="btn-outline">Export CSV</button>
      </div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-stone-line px-2 py-1 text-sm">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={leadType} onChange={(e) => setLeadType(e.target.value)} className="border border-stone-line px-2 py-1 text-sm">
          <option value="">All Types</option>
          {leadTypes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="mt-4 overflow-x-auto border border-stone-line bg-stone-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-line bg-stone-fog text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Contact</th>
              <th className="p-3">Status</th><th className="p-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-stone-line">
                <td className="p-3"><Link href={`/admin/leads/${l.id}`} className="hover:underline">{l.name}</Link></td>
                <td className="p-3 text-xs">{l.lead_type.replace("_", " ")}</td>
                <td className="p-3 text-xs">{l.email}<br />{l.phone}</td>
                <td className="p-3"><span className="bg-stone-fog px-2 py-1 text-xs">{l.status}</span></td>
                <td className="p-3 text-xs text-ink-soft">{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ink-soft">No leads yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
