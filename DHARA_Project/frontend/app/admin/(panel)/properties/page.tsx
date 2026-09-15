"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

interface AdminProperty {
  id: string;
  reference_code: string;
  title: string;
  category: string;
  listing_type: string;
  status: string;
  is_featured: boolean;
  view_count: number;
}

const transitions: Record<string, string[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["RESERVED", "SOLD", "RENTED", "ARCHIVED", "DRAFT"],
  RESERVED: ["PUBLISHED", "SOLD", "RENTED"],
  SOLD: ["ARCHIVED"],
  RENTED: ["ARCHIVED"],
  ARCHIVED: [],
};

export default function PropertiesListPage() {
  const guard = useRoleGuard(["SALES_MANAGER", "ADMINISTRATOR"]);
  const [rows, setRows] = useState<AdminProperty[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function load() {
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const data = await adminJSON<AdminProperty[]>(`/properties${qs}`);
      setRows(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function transition(id: string, status: string) {
    try {
      await adminJSON(`/properties/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
      load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function duplicate(id: string) {
    await adminJSON(`/properties/${id}/duplicate`, { method: "POST" });
    load();
  }

  async function bulk(action: string) {
    if (selected.size === 0) return;
    await adminJSON(`/properties/bulk`, { method: "POST", body: JSON.stringify({ ids: Array.from(selected), action }) });
    setSelected(new Set());
    load();
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Properties</h1>
        <Link href="/admin/properties/new" className="btn-primary">+ New Property</Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-stone-line px-2 py-1 text-sm">
          <option value="">All Statuses</option>
          {["DRAFT", "PUBLISHED", "RESERVED", "SOLD", "RENTED", "ARCHIVED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {selected.size > 0 && (
          <div className="flex gap-2 text-xs">
            <button onClick={() => bulk("feature")} className="btn-outline px-3 py-1">Feature</button>
            <button onClick={() => bulk("unfeature")} className="btn-outline px-3 py-1">Unfeature</button>
            <button onClick={() => bulk("archive")} className="btn-outline px-3 py-1">Archive</button>
            <span className="self-center text-ink-soft">{selected.size} selected</span>
          </div>
        )}
      </div>

      <div className="mt-4 overflow-x-auto border border-stone-line bg-stone-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-line bg-stone-fog text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-3"><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th>
              <th className="p-3">Reference</th>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Views</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-stone-line">
                <td className="p-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <td className="p-3 text-xs text-ink-soft">{r.reference_code}</td>
                <td className="p-3">
                  <Link href={`/admin/properties/${r.id}/edit`} className="text-ink hover:underline">{r.title}</Link>
                  {r.is_featured && <span className="ml-2 bg-brass px-1.5 py-0.5 text-[10px] text-ink">Featured</span>}
                </td>
                <td className="p-3">{r.category}</td>
                <td className="p-3">{r.listing_type}</td>
                <td className="p-3">
                  <span className="bg-stone-fog px-2 py-1 text-xs">{r.status}</span>
                </td>
                <td className="p-3">{r.view_count}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(transitions[r.status] || []).map((s) => (
                      <button key={s} onClick={() => transition(r.id, s)} className="border border-stone-line px-2 py-0.5 text-xs hover:bg-stone-fog">
                        → {s}
                      </button>
                    ))}
                    <button onClick={() => duplicate(r.id)} className="border border-stone-line px-2 py-0.5 text-xs hover:bg-stone-fog">Duplicate</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-ink-soft">No properties yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
