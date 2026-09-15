"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

interface Service { id: string; slug: string; title: string; summary: string; sort_order: number; is_published?: boolean; }

export default function ServicesAdminPage() {
  const guard = useRoleGuard(["CONTENT_EDITOR", "ADMINISTRATOR"]);
  const [rows, setRows] = useState<Service[]>([]);
  const [form, setForm] = useState({ title: "", summary: "", body: "", icon: "", hero_image: "", sort_order: "1" });
  const [error, setError] = useState("");

  async function load() {
    // Uses the admin list endpoint (includes unpublished drafts), not the public one.
    try {
      setRows(await adminJSON("/services"));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminJSON("/services", {
        method: "POST",
        body: JSON.stringify({ ...form, sort_order: Number(form.sort_order), is_published: true }),
      });
      setForm({ title: "", summary: "", body: "", icon: "", hero_image: "", sort_order: "1" });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove(id: string) {
    await adminJSON(`/services/${id}`, { method: "DELETE" });
    load();
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Services</h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-stone-line border border-stone-line bg-stone-paper">
          {rows.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <div className="font-medium text-ink">{s.title}</div>
                <div className="text-xs text-ink-soft">{s.summary}</div>
              </div>
              <button onClick={() => remove(s.id)} className="text-xs text-red-700">Delete</button>
            </div>
          ))}
          {rows.length === 0 && <div className="p-6 text-center text-sm text-ink-soft">No services yet.</div>}
        </div>
        <form onSubmit={create} className="h-fit space-y-3 border border-stone-line bg-stone-paper p-5 text-sm">
          <h2 className="font-display text-base text-ink">New Service</h2>
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <input placeholder="Summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <textarea placeholder="Body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <input placeholder="Hero image path (/images/...)" value={form.hero_image} onChange={(e) => setForm({ ...form, hero_image: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <input placeholder="Sort order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <button type="submit" className="btn-primary w-full justify-center">Create</button>
        </form>
      </div>
    </div>
  );
}
