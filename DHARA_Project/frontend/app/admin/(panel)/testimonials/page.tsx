"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";
import { useToast } from "@/components/Toast";

interface Testimonial {
  id: string;
  author_name: string;
  author_location: string;
  quote: string;
  rating: number;
  is_published: boolean;
  sort_order: number;
}

const EMPTY = { author_name: "", author_location: "", quote: "", rating: "5", is_published: true };

export default function TestimonialsAdminPage() {
  const guard = useRoleGuard(["CONTENT_EDITOR", "ADMINISTRATOR"]);
  const toast = useToast();
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setRows(await adminJSON<Testimonial[]>("/testimonials"));
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (guard.status === "allowed") load();
  }, [guard.status]);

  function startEdit(t: Testimonial) {
    setEditingId(t.id);
    setForm({ author_name: t.author_name, author_location: t.author_location, quote: t.quote, rating: String(t.rating), is_published: t.is_published });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const existing = rows.find((r) => r.id === editingId);
      await adminJSON(editingId ? `/testimonials/${editingId}` : "/testimonials", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({
          author_name: form.author_name.trim(),
          author_location: form.author_location.trim(),
          quote: form.quote.trim(),
          rating: Number(form.rating),
          is_published: form.is_published,
          sort_order: existing?.sort_order ?? rows.length + 1,
        }),
      });
      toast.success(editingId ? "Testimonial updated" : "Testimonial added");
      reset();
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(t: Testimonial) {
    try {
      await adminJSON(`/testimonials/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ author_name: t.author_name, author_location: t.author_location, quote: t.quote, rating: t.rating, is_published: !t.is_published, sort_order: t.sort_order }),
      });
      toast.success(t.is_published ? "Hidden from the website" : "Now visible on the website");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this testimonial permanently?")) return;
    try {
      await adminJSON(`/testimonials/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      if (editingId === id) reset();
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Testimonials</h1>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-stone-line border border-stone-line bg-stone-paper">
          {rows.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-4 p-4 text-sm">
              <div className={t.is_published ? "" : "opacity-60"}>
                <div className="font-medium text-ink">
                  {t.author_name}
                  {t.author_location ? ` — ${t.author_location}` : ""}
                  <span className="ml-2 text-xs text-brass-dark">{"★".repeat(t.rating)}</span>
                  {!t.is_published && <span className="ml-2 rounded bg-stone-line px-1.5 py-0.5 text-[10px] uppercase">Hidden</span>}
                </div>
                <div className="mt-1 text-xs text-ink-soft">&ldquo;{t.quote}&rdquo;</div>
              </div>
              <div className="flex shrink-0 gap-3 text-xs">
                <button onClick={() => startEdit(t)} className="underline">Edit</button>
                <button onClick={() => togglePublished(t)} className="underline">{t.is_published ? "Hide" : "Show"}</button>
                <button onClick={() => remove(t.id)} className="text-red-700 underline">Delete</button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="p-6 text-center text-sm text-ink-soft">No testimonials yet.</div>}
        </div>
        <form onSubmit={save} className="h-fit space-y-3 border border-stone-line bg-stone-paper p-5 text-sm">
          <h2 className="font-display text-base text-ink">{editingId ? "Edit Testimonial" : "New Testimonial"}</h2>
          <input required placeholder="Author name" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <input placeholder="Location" value={form.author_location} onChange={(e) => setForm({ ...form, author_location: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <textarea required placeholder="Quote" rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} className="w-full border border-stone-line px-3 py-2" />
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="w-full border border-stone-line px-3 py-2">
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Visible on the website
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {saving ? "Saving…" : editingId ? "Save changes" : "Create"}
            </button>
            {editingId && <button type="button" onClick={reset} className="btn-outline">Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
