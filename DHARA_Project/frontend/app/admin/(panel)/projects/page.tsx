"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

interface Project { id: string; slug: string; title: string; sector: string; location: string; year_completed: number; }

export default function ProjectsAdminPage() {
  const guard = useRoleGuard(["CONTENT_EDITOR", "ADMINISTRATOR"]);
  const [rows, setRows] = useState<Project[]>([]);
  const [form, setForm] = useState({ title: "", sector: "Residential", location: "", year_completed: "2026", scope: "", cover_image: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      setRows(await adminJSON("/projects"));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminJSON("/projects", {
        method: "POST",
        body: JSON.stringify({ ...form, year_completed: Number(form.year_completed), is_published: true }),
      });
      setForm({ title: "", sector: "Residential", location: "", year_completed: "2026", scope: "", cover_image: "" });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove(id: string) {
    await adminJSON(`/projects/${id}`, { method: "DELETE" });
    load();
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Projects</h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-stone-line border border-stone-line bg-stone-paper">
          {rows.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <div className="font-medium text-ink">{p.title}</div>
                <div className="text-xs text-ink-soft">{p.sector} · {p.location} · {p.year_completed}</div>
              </div>
              <button onClick={() => remove(p.id)} className="text-xs text-red-700">Delete</button>
            </div>
          ))}
          {rows.length === 0 && <div className="p-6 text-center text-sm text-ink-soft">No projects yet.</div>}
        </div>
        <form onSubmit={create} className="h-fit space-y-3 border border-stone-line bg-stone-paper p-5 text-sm">
          <h2 className="font-display text-base text-ink">New Project</h2>
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="w-full border border-stone-line px-3 py-2">
            {["Residential", "Commercial", "Industrial", "Hospitality", "Infrastructure"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <input placeholder="Year completed" type="number" value={form.year_completed} onChange={(e) => setForm({ ...form, year_completed: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <textarea placeholder="Scope" rows={3} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <input placeholder="Cover image path (/images/...)" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <button type="submit" className="btn-primary w-full justify-center">Create</button>
        </form>
      </div>
    </div>
  );
}
