"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { Service } from "@/lib/types";

interface ServiceFormState {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  icon: string;
  hero_image: string;
  sort_order: number;
  is_published: boolean;
}

const initialFormState: ServiceFormState = {
  title: "",
  slug: "",
  summary: "",
  body: "",
  icon: "construction",
  hero_image: "",
  sort_order: 1,
  is_published: true,
};

export default function ServicesAdminPage() {
  const guard = useRoleGuard(["CONTENT_EDITOR", "ADMINISTRATOR"]);
  const toast = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit / Create modal or form state
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ServiceFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadServices() {
    setIsLoading(true);
    try {
      const data = await adminJSON<Service[]>("/services");
      setServices(data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load services.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "PUBLISHED"
          ? s.is_published !== false
          : s.is_published === false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.summary && s.summary.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [services, statusFilter, searchQuery]);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Service title is required.";
    if (!form.summary.trim()) errors.summary = "Service summary is required.";
    if (form.sort_order < 0 || isNaN(form.sort_order)) errors.sort_order = "Valid sort order is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleStartCreate() {
    setForm({
      ...initialFormState,
      sort_order: services.length + 1,
    });
    setFormErrors({});
    setIsEditing(true);
  }

  function handleStartEdit(service: Service) {
    setForm({
      id: service.id,
      title: service.title,
      slug: service.slug,
      summary: service.summary || "",
      body: service.body || "",
      icon: service.icon || "construction",
      hero_image: service.hero_image || "",
      sort_order: service.sort_order ?? 1,
      is_published: service.is_published !== false,
    });
    setFormErrors({});
    setIsEditing(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (form.id) {
        // Edit Service
        await adminJSON(`/services/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: form.title.trim(),
            slug: form.slug.trim(),
            summary: form.summary.trim(),
            body: form.body.trim(),
            icon: form.icon,
            hero_image: form.hero_image,
            sort_order: Number(form.sort_order),
            is_published: form.is_published,
          }),
        });
        toast.success("Service updated successfully.");
      } else {
        // Create Service
        await adminJSON("/services", {
          method: "POST",
          body: JSON.stringify({
            title: form.title.trim(),
            slug: form.slug.trim(),
            summary: form.summary.trim(),
            body: form.body.trim(),
            icon: form.icon,
            hero_image: form.hero_image,
            sort_order: Number(form.sort_order),
            is_published: form.is_published,
          }),
        });
        toast.success("Service created successfully.");
      }

      setIsEditing(false);
      setForm(initialFormState);
      loadServices();
    } catch (err: any) {
      const msg = err.message || (form.id ? "Failed to update service." : "Failed to create service.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminJSON(`/services/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Service deleted successfully.");
      setDeleteTarget(null);
      loadServices();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete service.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (guard.status !== "allowed") return <AccessDenied role={guard.role} />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-line pb-5">
        <div>
          <h1 className="font-display text-2xl text-ink">Services Management</h1>
          <p className="text-xs text-ink-soft mt-1">
            Manage public services, sort ordering, hero banners, and publication statuses.
          </p>
        </div>
        <button
          onClick={handleStartCreate}
          className="btn-primary self-start sm:self-auto inline-flex items-center gap-2 text-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Service
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-stone-paper border border-stone-line p-3 rounded-sm text-xs">
        <div className="flex items-center gap-1 bg-stone-fog p-1 rounded-sm border border-stone-line">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 font-medium transition-colors rounded-sm ${
                statusFilter === st
                  ? "bg-ink text-stone-paper shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {st === "ALL" ? "All Services" : st === "PUBLISHED" ? "Published" : "Drafts"}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by title, slug, or summary…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-stone-line rounded-sm bg-stone-paper text-ink placeholder:text-stone-400 focus:outline-none focus:border-ink"
          />
          <svg
            className="w-4 h-4 absolute left-2.5 top-2 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="border border-stone-line bg-stone-paper rounded-sm overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-ink-soft flex flex-col items-center justify-center gap-2">
            <svg className="animate-spin h-6 w-6 text-brass" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-xs">Loading services…</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center text-ink-soft text-sm">
            {searchQuery || statusFilter !== "ALL"
              ? "No services match your filters."
              : "No services created yet. Click 'New Service' to add one."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-line bg-stone-fog text-ink font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-16 text-center">Order</th>
                  <th className="py-3 px-4 w-20">Banner</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-line">
                {filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-fog/60 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-medium text-ink">
                      #{s.sort_order ?? 0}
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative h-11 w-16 bg-stone-fog rounded-sm overflow-hidden border border-stone-line">
                        {s.hero_image ? (
                          <Image
                            src={s.hero_image}
                            alt={s.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized={s.hero_image.startsWith("/uploads/")}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400">
                            No Img
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink text-sm">{s.title}</div>
                      <div className="text-[11px] text-ink-soft font-mono mt-0.5">/services/{s.slug}</div>
                      {s.summary && (
                        <p className="text-xs text-ink-soft mt-1 line-clamp-1 max-w-xl">
                          {s.summary}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.is_published !== false ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-fog text-ink-soft border border-stone-line">
                          <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleStartEdit(s)}
                        className="px-2.5 py-1 text-xs border border-stone-line bg-stone-paper hover:bg-stone-fog text-ink font-medium rounded-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="px-2.5 py-1 text-xs border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-sm transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={isSubmitting ? undefined : () => setIsEditing(false)}
          />

          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-stone-line bg-stone-paper p-6 shadow-2xl rounded-sm">
            <div className="flex items-center justify-between border-b border-stone-line pb-4 mb-5">
              <div>
                <h2 className="font-display text-lg text-ink font-semibold">
                  {form.id ? "Edit Service" : "New Service"}
                </h2>
                <p className="text-xs text-ink-soft mt-0.5">
                  {form.id ? "Modify service details and publication status." : "Create a new corporate service offering."}
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsEditing(false)}
                className="text-stone-400 hover:text-ink p-1 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Service Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Civil Construction"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={`w-full border px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm ${
                      formErrors.title ? "border-red-500" : "border-stone-line focus:border-ink"
                    }`}
                  />
                  {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Custom Slug <span className="text-ink-soft font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="leave blank to auto-generate"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full border border-stone-line px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm focus:border-ink font-mono"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Summary / Short Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief overview of the service shown on cards and service overview."
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className={`w-full border px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm ${
                    formErrors.summary ? "border-red-500" : "border-stone-line focus:border-ink"
                  }`}
                />
                {formErrors.summary && <p className="text-xs text-red-600 mt-1">{formErrors.summary}</p>}
              </div>

              {/* Full Body / Markdown */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Detailed Service Content / Capabilities
                </label>
                <textarea
                  rows={6}
                  placeholder="Full service description. Bullet points can be formatted with '•' or 'Key capabilities:' headers."
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full border border-stone-line px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm focus:border-ink"
                />
                <p className="text-[11px] text-ink-soft mt-1">
                  Separate paragraphs with double enter. Bullet points starting with &apos;•&apos; are automatically rendered as capabilities.
                </p>
              </div>

              {/* Hero Image Upload */}
              <SingleImageUploader
                label="Hero Banner Image"
                value={form.hero_image}
                onChange={(url) => setForm({ ...form, hero_image: url })}
                helpText="Upload a high quality hero image for the service header."
                folder="services"
              />

              {/* Sort Order & Publication Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-line pt-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full border border-stone-line px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm focus:border-ink font-mono"
                  />
                  <p className="text-[11px] text-ink-soft mt-1">Lower numbers appear first on the public website.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Publication Status
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="service_status"
                        checked={form.is_published}
                        onChange={() => setForm({ ...form, is_published: true })}
                        className="text-ink focus:ring-ink"
                      />
                      <span className="text-xs font-medium text-ink">Published</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="service_status"
                        checked={!form.is_published}
                        onChange={() => setForm({ ...form, is_published: false })}
                        className="text-ink focus:ring-ink"
                      />
                      <span className="text-xs font-medium text-ink-soft">Draft</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-ink-soft mt-1">
                    Draft services are hidden from visitors on public pages.
                  </p>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-stone-line pt-4 mt-6">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-stone-line text-xs font-medium text-ink hover:bg-stone-fog transition-colors rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary inline-flex items-center gap-2 text-xs px-5 py-2"
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-3.5 w-3.5 text-stone-paper" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {form.id ? "Save Changes" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Service"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Service"
        isLoading={isDeleting}
        isDanger={true}
      />
    </div>
  );
}
