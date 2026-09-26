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
  
  // Mocks for backend data not yet implemented
  image_count?: number;
  created_by?: string;
  created_at?: string;
  published_at?: string;
  updated_by?: string;
  updated_at?: string;
  sold_rented_at?: string;
  district_name?: string;
  has_cover?: boolean;
}

export default function PropertiesListPage() {
  const guard = useRoleGuard(["SALES_MANAGER", "ADMINISTRATOR"]);
  const [rows, setRows] = useState<AdminProperty[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [publishableFilter, setPublishableFilter] = useState("");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [toast, setToast] = useState<{msg: string, type: 'error'|'success'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{message: string, confirmText?: string, onConfirm: () => void} | null>(null);

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  async function load() {
    try {
      const data = await adminJSON<AdminProperty[]>(`/properties`);
      setRows(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function transition(id: string, status: string) {
    try {
      await adminJSON(`/properties/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
      load();
      showToast(`Property status updated to ${status}`, "success");
    } catch (e: any) {
      showToast(e.message);
    }
  }

  async function duplicate(id: string) {
    setConfirmModal({
      message: "Do you need to duplicate the property?",
      confirmText: "Yes, duplicate",
      onConfirm: async () => {
        try {
          await adminJSON(`/properties/${id}/duplicate`, { method: "POST" });
          load();
          showToast("Property duplicated successfully", "success");
        } catch (e: any) {
          showToast(e.message);
        }
      }
    });
  }

  async function toggleFeature(id: string, is_featured: boolean) {
    try {
      // Mock toggle API call - backend needs to support this directly or via PATCH
      await adminJSON(`/properties/${id}`, { method: "PATCH", body: JSON.stringify({ is_featured: !is_featured }) });
      load();
      showToast(`Property is now ${!is_featured ? 'featured' : 'unfeatured'}`, "success");
    } catch (e: any) {
      showToast(e.message);
    }
  }

  async function bulk(action: string) {
    if (selected.size === 0) return;
    try {
      await adminJSON(`/properties/bulk`, { method: "POST", body: JSON.stringify({ ids: Array.from(selected), action }) });
      setSelected(new Set());
      load();
      showToast(`Bulk action '${action}' completed successfully`, "success");
    } catch (e: any) {
      showToast(e.message);
    }
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function renderStatus(r: AdminProperty) {
    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const action = e.target.value;
      if (!action) return;
      
      if (action === "Publish") {
        if ((r.image_count || 0) < 3) {
           showToast("Cannot publish: Need at least 3 images.");
           e.target.value = "";
           return;
        }
        transition(r.id, "PUBLISHED");
      } else if (action === "Archive" || action === "Withdraw") {
        transition(r.id, "ARCHIVED");
      } else if (action === "Draft") {
        transition(r.id, "DRAFT");
      } else if (action === "Reserve") {
        transition(r.id, "RESERVED");
      } else if (action === "Sold") {
        transition(r.id, "SOLD");
      } else if (action === "Rented") {
        transition(r.id, "RENTED");
      } else if (action === "Release") {
        transition(r.id, "PUBLISHED");
      }
      e.target.value = ""; 
    };

    let options: string[] = [];
    if (r.status === "DRAFT") options = ["Publish", "Archive"];
    else if (r.status === "PUBLISHED") options = ["Draft", "Reserve", "Withdraw", r.listing_type === "SALE" ? "Sold" : "Rented"];
    else if (r.status === "RESERVED") options = ["Release", r.listing_type === "SALE" ? "Sold" : "Rented"];
    else if (r.status === "SOLD" || r.status === "RENTED") options = ["Archive"];
    else if (r.status === "ARCHIVED") options = ["Draft"];

    let badge = null;
    if (r.status === "RESERVED") badge = <span className="block mt-2 w-fit bg-yellow-100 text-yellow-800 px-1.5 py-0.5 text-[10px] rounded font-medium">Under Offer</span>;
    else if (r.status === "SOLD") badge = <span className="block mt-2 w-fit bg-stone-300 text-stone-800 px-1.5 py-0.5 text-[10px] rounded font-medium">Sold</span>;
    else if (r.status === "RENTED") badge = <span className="block mt-2 w-fit bg-stone-300 text-stone-800 px-1.5 py-0.5 text-[10px] rounded font-medium">Rented</span>;
    
    let countdown = null;
    if (r.status === "SOLD" || r.status === "RENTED") {
      const date = r.sold_rented_at ? new Date(r.sold_rented_at) : new Date();
      const days = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));
      const remaining = Math.max(0, 90 - days);
      countdown = <span className="block mt-1 text-stone-500 font-medium text-[10px]">{remaining} days left before auto-archive</span>;
    }

    return (
      <div>
        <select onChange={handleSelect} className="border border-stone-line px-2 py-1 text-xs bg-stone-50">
          <option value="">{r.status}</option>
          {options.map(o => {
            const isPublishDisabled = o === "Publish" && ((r.image_count || 0) < 3 || !r.has_cover);
            return <option key={o} value={o} className={isPublishDisabled ? "text-stone-400" : ""}>{o}</option>;
          })}
        </select>
        {badge}
        {countdown}
      </div>
    );
  }

  const filteredRows = rows.filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.reference_code.toLowerCase().includes(q)) return false;
    }
    if (statusFilter && r.status !== statusFilter) return false;
    if (categoryFilter && r.category !== categoryFilter) return false;
    if (typeFilter && r.listing_type !== typeFilter) return false;
    if (featuredFilter === "FEATURED" && !r.is_featured) return false;
    if (featuredFilter === "UNFEATURED" && r.is_featured) return false;
    if (publishableFilter === "PUBLISHABLE" && ((r.image_count || 0) < 3 || !r.has_cover)) return false;
    if (publishableFilter === "NOT_PUBLISHABLE" && ((r.image_count || 0) >= 3 && r.has_cover)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "NEWEST") return (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0);
    if (sortBy === "OLDEST") return (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0);
    if (sortBy === "REF_ASC" || sortBy === "REF_DESC") {
       const numA = parseInt(a.reference_code.split("-").pop() || "0") || 0;
       const numB = parseInt(b.reference_code.split("-").pop() || "0") || 0;
       return sortBy === "REF_ASC" ? numA - numB : numB - numA;
    }
    return 0;
  });

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <>
      {confirmModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white border border-stone-200 p-6 rounded-xl shadow-2xl w-[400px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-medium text-ink mb-6">{confirmModal.message}</h3>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal(null)}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-5 py-2.5 bg-[#2B8B45] hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {confirmModal.confirmText || "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-6 py-3 shadow-xl rounded-sm text-sm font-medium transition-all animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#2B8B45] text-white'}`}>
          {toast.msg}
        </div>
      )}
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-ink">Properties</h1>
          <Link href="/admin/properties/new" className="btn-primary">+ New Property</Link>
        </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}



      <div className="mb-6 p-4 border border-stone-line bg-stone-paper grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-ink-soft mb-1">Search</label>
          <input 
            type="text" 
            placeholder="Search by Title or Ref No..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-stone-line px-3 py-2 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1">Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full border border-stone-line px-3 py-2 text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="RENTED">Rented</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1">Category</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full border border-stone-line px-3 py-2 text-sm bg-white">
            <option value="">All Categories</option>
            <option value="LAND">Land</option>
            <option value="HOUSE">House</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1">Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full border border-stone-line px-3 py-2 text-sm bg-white">
            <option value="">All Types</option>
            <option value="SALE">Sale</option>
            <option value="RENT">Rent</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1">Featured</label>
          <select value={featuredFilter} onChange={e => setFeaturedFilter(e.target.value)} className="w-full border border-stone-line px-3 py-2 text-sm bg-white">
            <option value="">All</option>
            <option value="FEATURED">Featured</option>
            <option value="UNFEATURED">Unfeatured</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1">Publish Readiness</label>
          <select value={publishableFilter} onChange={e => setPublishableFilter(e.target.value)} className="w-full border border-stone-line px-3 py-2 text-sm bg-white">
            <option value="">All</option>
            <option value="PUBLISHABLE">Can Publish (≥3 Images & Cover)</option>
            <option value="NOT_PUBLISHABLE">Not Publishable (&lt;3 Images or No Cover)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1">Sort By</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full border border-stone-line px-3 py-2 text-sm bg-white">
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="REF_ASC">Ref No (Min-Max)</option>
            <option value="REF_DESC">Ref No (Max-Min)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-stone-line bg-stone-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-line bg-stone-fog text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-3">Ref. No.</th>
              <th className="p-3">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">View Count</th>
              <th className="p-3 min-w-[200px]">Info</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id} className={`border-b border-stone-line transition-opacity ${r.status === 'SOLD' || r.status === 'RENTED' || r.status === 'ARCHIVED' ? 'opacity-60 bg-stone-50' : 'bg-white hover:bg-stone-50'}`}>
                <td className="p-3 text-xs font-mono text-ink-soft align-top pt-4">{r.reference_code}</td>
                <td className="p-3 align-top pt-4">
                  <Link href={`/admin/properties/${r.id}/edit`} className="text-ink font-medium hover:underline">{r.title}</Link>
                  {r.is_featured && <span className="ml-2 bg-brass px-1.5 py-0.5 text-[10px] text-ink rounded">Featured</span>}
                </td>
                <td className="p-3 align-top pt-3">
                  {renderStatus(r)}
                </td>
                <td className="p-3 align-top pt-4">{r.view_count}</td>
                <td className="p-3 text-xs text-ink-soft align-top pt-3 space-y-1">
                  <div><span className="font-medium">Created:</span> {r.created_by || 'Admin'} <span className="text-[10px]">({r.created_at || 'Just now'})</span></div>
                  <div><span className="font-medium">Published:</span> {r.published_at || 'Not yet'}</div>
                  <div><span className="font-medium">Updated:</span> {r.updated_by || 'Admin'} <span className="text-[10px]">({r.updated_at || 'Just now'})</span></div>
                </td>
                <td className="p-3 align-top pt-3">
                  <div className="flex flex-col items-start gap-1">
                    <button onClick={() => duplicate(r.id)} className="border border-stone-line px-3 py-1 text-xs bg-white hover:bg-stone-fog">Duplicate</button>
                    <button onClick={() => toggleFeature(r.id, r.is_featured)} className="border border-stone-line px-3 py-1 text-xs bg-white hover:bg-stone-fog">
                      {r.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-ink-soft">No properties found matching your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
