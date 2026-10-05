"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminJSON, adminList, ListMeta } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";
import { useToast } from "@/components/Toast";
import { STATUS_STYLES, publicPropertyPath } from "@/components/admin/PublishBar";
import { mediaUrl } from "@/lib/media";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface AdminProperty {
  id: string;
  reference_code: string;
  title: string;
  slug: string;
  category: string;
  listing_type: string;
  status: string;
  is_featured: boolean;
  view_count: number;
  cover_url?: string;
}

const transitions: Record<string, string[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["DRAFT", "RESERVED", "SOLD", "RENTED", "ARCHIVED"],
  RESERVED: ["PUBLISHED", "SOLD", "RENTED"],
  SOLD: ["ARCHIVED"],
  RENTED: ["ARCHIVED"],
  ARCHIVED: ["PUBLISHED"],
};

const actionLabel: Record<string, string> = {
  PUBLISHED: "Publish",
  DRAFT: "Unpublish",
  RESERVED: "Mark reserved",
  SOLD: "Mark sold",
  RENTED: "Mark rented",
  ARCHIVED: "Archive",
};

export default function PropertiesListPage() {
  const guard = useRoleGuard(["SALES_MANAGER", "ADMINISTRATOR"]);
  const toast = useToast();
  const [rows, setRows] = useState<AdminProperty[]>([]);
  const [meta, setMeta] = useState<ListMeta | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminProperty | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (query) params.set("q", query);
      const res = await adminList<AdminProperty>(`/properties?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, query]);

  useEffect(() => {
    if (guard.status === "allowed") load();
  }, [guard.status, load]);

  async function transition(id: string, status: string) {
    try {
      await adminJSON(`/properties/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
      toast.success(status === "PUBLISHED" ? "Published — live on the website." : "Status updated");
      load();
    } catch (e: any) {
      // e.g. "At least 3 images are required before publishing"
      toast.error(e.message);
    }
  }

  async function duplicate(id: string) {
    try {
      await adminJSON(`/properties/${id}/duplicate`, { method: "POST" });
      toast.success("Duplicated as a new draft");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function deleteProperty() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminJSON(`/properties/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Property permanently deleted");
      setSelected((current) => {
        const next = new Set(current);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  }

  async function bulk(action: string) {
    if (selected.size === 0) return;
    try {
      const res = await adminJSON<{ count: number; failed: { id: string; reason: string }[] }>(`/properties/bulk`, {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      if (res.failed?.length) {
        toast.error(`${res.count} done, ${res.failed.length} skipped: ${res.failed[0].reason}`);
      } else {
        toast.success(`${res.count} updated`);
      }
      setSelected(new Set());
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}
          className="flex"
        >
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or reference…" className="w-64 border border-stone-line px-3 py-1.5 text-sm" />
          <button type="submit" className="border border-l-0 border-stone-line px-3 text-sm">Search</button>
        </form>
        <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} className="border border-stone-line px-2 py-1.5 text-sm">
          <option value="">All statuses</option>
          {["DRAFT", "PUBLISHED", "RESERVED", "SOLD", "RENTED", "ARCHIVED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {selected.size > 0 && (
          <div className="flex gap-2 text-xs">
            <button onClick={() => bulk("publish")} className="btn-outline px-3 py-1">Publish</button>
            <button onClick={() => bulk("unpublish")} className="btn-outline px-3 py-1">Unpublish</button>
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
              <th className="p-3"><input type="checkbox" aria-label="Select all" onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th>
              <th className="p-3">Property</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Views</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-stone-line align-top">
                <td className="p-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.title}`} /></td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden bg-stone-fog">
                      {r.cover_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(r.cover_url)} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div>
                      <Link href={`/admin/properties/${r.id}/edit`} className="text-ink hover:underline">{r.title}</Link>
                      {r.is_featured && <span className="ml-2 bg-brass px-1.5 py-0.5 text-[10px] text-ink">Featured</span>}
                      <div className="text-xs text-ink-soft">{r.reference_code}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-xs">{r.category} · {r.listing_type}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status] ?? ""}`}>{r.status}</span>
                </td>
                <td className="p-3">{r.view_count}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Link href={`/admin/properties/${r.id}/edit`} className="border border-stone-line px-2 py-0.5 text-xs hover:bg-stone-fog">Edit</Link>
                    {(transitions[r.status] || []).map((s) => (
                      <button key={s} onClick={() => transition(r.id, s)} className={`border px-2 py-0.5 text-xs hover:bg-stone-fog ${s === "PUBLISHED" ? "border-ink font-medium" : "border-stone-line"}`}>
                        {r.status === "ARCHIVED" && s === "PUBLISHED" ? "Unarchive" : actionLabel[s] ?? s}
                      </button>
                    ))}
                    {r.status === "ARCHIVED" && (
                      <button onClick={() => setDeleteTarget(r)} className="border border-red-700 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50">Delete</button>
                    )}
                    <button onClick={() => duplicate(r.id)} className="border border-stone-line px-2 py-0.5 text-xs hover:bg-stone-fog">Duplicate</button>
                    {(r.status === "PUBLISHED" || r.status === "RESERVED" || r.status === "SOLD" || r.status === "RENTED") && (
                      <a href={publicPropertyPath(r.category, r.slug)} target="_blank" rel="noopener noreferrer" className="border border-stone-line px-2 py-0.5 text-xs hover:bg-stone-fog">View ↗</a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-ink-soft">No properties found.</td></tr>
            )}
            {loading && rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-ink-soft">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-soft">{meta.total} properties · page {meta.page} of {meta.total_pages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-outline px-3 py-1 disabled:opacity-40">Previous</button>
            <button disabled={page >= meta.total_pages} onClick={() => setPage(page + 1)} className="btn-outline px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteProperty}
        title="Permanently delete property?"
        message={`This permanently removes ${deleteTarget?.title ?? "this property"}, its photos, and documents. Related inquiries and testimonials will remain without a property link. This cannot be undone.`}
        confirmLabel="Delete permanently"
        isLoading={deleting}
      />
    </div>
  );
}
