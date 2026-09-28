"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";

interface Testimonial { id: string; author_name: string; author_location: string; quote: string; rating: number; }

export default function TestimonialsAdminPage() {
  const guard = useRoleGuard(["CONTENT_EDITOR", "ADMINISTRATOR"]);
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [form, setForm] = useState({ author_name: "", author_location: "", quote: "", rating: "5" });
  const [error, setError] = useState("");

  async function load() {
    try {
      setRows(await adminJSON("/testimonials"));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminJSON("/testimonials", {
        method: "POST",
        body: JSON.stringify({ ...form, rating: Number(form.rating), is_published: true, sort_order: rows.length + 1 }),
      });
      setForm({ author_name: "", author_location: "", quote: "", rating: "5" });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove(id: string) {
    await adminJSON(`/testimonials/${id}`, { method: "DELETE" });
    load();
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Testimonials</h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-stone-line border border-stone-line bg-stone-paper">
          {rows.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <div className="font-medium text-ink">{t.author_name} — {t.author_location}</div>
                <div className="text-xs text-ink-soft">&ldquo;{t.quote}&rdquo;</div>
              </div>
              <button onClick={() => remove(t.id)} className="text-xs text-red-700">Delete</button>
            </div>
          ))}
          {rows.length === 0 && <div className="p-6 text-center text-sm text-ink-soft">No testimonials yet.</div>}
        </div>
        <form onSubmit={create} className="h-fit space-y-3 border border-stone-line bg-stone-paper p-5 text-sm">
          <h2 className="font-display text-base text-ink">New Testimonial</h2>
          <input required placeholder="Author name" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <input placeholder="Location" value={form.author_location} onChange={(e) => setForm({ ...form, author_location: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <textarea required placeholder="Quote" rows={3} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="w-full border border-stone-line px-3 py-2">
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
          </select>
          <button type="submit" className="btn-primary w-full justify-center">Create</button>
        </form>
      </div>
    </div>
  );
}
