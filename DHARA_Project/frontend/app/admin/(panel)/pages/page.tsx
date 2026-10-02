"use client";

import { useEffect, useState } from "react";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";
import { useToast } from "@/components/Toast";

interface PageForm {
  slug: string;
  label: string;
  title: string;
  body: string;
  meta_title: string;
  meta_description: string;
  updated_at?: string;
}

const PAGES = [
  { slug: "about-us", label: "About Us", url: "/about-us", hint: "Replaces the “Our Story” paragraphs on the About page." },
  { slug: "privacy-policy", label: "Privacy Policy", url: "/privacy-policy", hint: "The full page content." },
  { slug: "terms", label: "Terms & Conditions", url: "/terms", hint: "The full page content." },
];

export default function PagesAdminPage() {
  const guard = useRoleGuard(["CONTENT_EDITOR", "ADMINISTRATOR"]);
  const toast = useToast();
  const [slug, setSlug] = useState(PAGES[0].slug);
  const [form, setForm] = useState<PageForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (guard.status !== "allowed") return;
    setForm(null);
    setError("");
    adminJSON<PageForm>(`/pages/${slug}`)
      .then((p) =>
        setForm({
          slug,
          label: p.label,
          title: p.title || PAGES.find((x) => x.slug === slug)!.label,
          body: p.body || "",
          meta_title: p.meta_title || "",
          meta_description: p.meta_description || "",
          updated_at: p.updated_at,
        })
      )
      .catch((e) => setError(e.message));
  }, [slug, guard.status]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      const saved = await adminJSON<PageForm>(`/pages/${slug}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          meta_title: form.meta_title,
          meta_description: form.meta_description,
        }),
      });
      setForm({ ...form, updated_at: saved.updated_at });
      toast.success("Page saved — it is live on the website now.");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;
  const meta = PAGES.find((p) => p.slug === slug)!;

  return (
    <div className="p-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Pages</h1>
          <p className="mt-1 text-sm text-ink-soft">Edit the wording of the About, Privacy and Terms pages.</p>
        </div>
        <a href={meta.url} target="_blank" rel="noopener noreferrer" className="text-sm underline">
          View on site ↗
        </a>
      </div>

      <div className="mt-6 flex gap-2 border-b border-stone-line">
        {PAGES.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setSlug(p.slug)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${slug === p.slug ? "border-ink font-medium text-ink" : "border-transparent text-ink-soft"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {!form && !error && <p className="mt-6 text-sm text-ink-soft">Loading…</p>}

      {form && (
        <form onSubmit={save} className="mt-6 max-w-3xl space-y-4 text-sm">
          <label className="block">
            <span className="text-xs text-ink-soft">Title</span>
            <input required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full border border-stone-line px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-xs text-ink-soft">Content — {meta.hint}</span>
            <textarea rows={18} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="mt-1 w-full border border-stone-line px-3 py-2 font-mono text-[13px]" />
            <span className="mt-1 block text-xs text-ink-soft">
              Leave a blank line between paragraphs. Start a line with <code>## </code> for a heading, or with <code>- </code> for bullet points.
              {slug === "about-us" && " Leave empty to keep the built-in text."}
            </span>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs text-ink-soft">SEO title (max 60)</span>
              <input maxLength={60} value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className="mt-1 w-full border border-stone-line px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-xs text-ink-soft">SEO description (max 160)</span>
              <input maxLength={160} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className="mt-1 w-full border border-stone-line px-3 py-2" />
            </label>
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? "Saving…" : "Save page"}
            </button>
            {form.updated_at && <span className="text-xs text-ink-soft">Last saved {new Date(form.updated_at).toLocaleString()}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
