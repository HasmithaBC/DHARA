"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { adminJSON } from "@/lib/admin-api";
import { useRoleGuard, AccessDenied } from "@/lib/admin-guard";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { SingleImageUploader, MultiGalleryUploader } from "@/components/admin/ImageUploader";
import { Project } from "@/lib/types";

interface ProjectFormState {
  id?: string;
  title: string;
  slug: string;
  client_name: string;
  sector: string;
  location: string;
  year_completed: number;
  scope: string;
  challenge: string;
  solution: string;
  body: string;
  cover_image: string;
  gallery: string[];
  is_featured: boolean;
  is_published: boolean;
}

const SECTORS = ["Residential", "Commercial", "Industrial", "Hospitality", "Infrastructure"];

const initialFormState: ProjectFormState = {
  title: "",
  slug: "",
  client_name: "",
  sector: "Residential",
  location: "",
  year_completed: new Date().getFullYear(),
  scope: "",
  challenge: "",
  solution: "",
  body: "",
  cover_image: "",
  gallery: [],
  is_featured: false,
  is_published: true,
};

export default function ProjectsAdminPage() {
  const guard = useRoleGuard(["CONTENT_EDITOR", "ADMINISTRATOR"]);
  const toast = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create / Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProjectFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadProjects() {
    setIsLoading(true);
    try {
      const data = await adminJSON<Project[]>("/projects");
      setProjects(data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "PUBLISHED"
          ? p.is_published !== false
          : p.is_published === false;

      const matchesSector = sectorFilter === "ALL" ? true : p.sector === sectorFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.client_name && p.client_name.toLowerCase().includes(q));

      return matchesStatus && matchesSector && matchesSearch;
    });
  }, [projects, statusFilter, sectorFilter, searchQuery]);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Project title is required.";
    if (!form.sector.trim()) errors.sector = "Sector is required.";
    if (!form.location.trim()) errors.location = "Location is required.";
    if (!form.year_completed || form.year_completed < 1900 || form.year_completed > 2100) {
      errors.year_completed = "A valid year (e.g. 2024) is required.";
    }
    if (!form.cover_image.trim()) {
      errors.cover_image = "Main cover image is required.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleStartCreate() {
    setForm(initialFormState);
    setFormErrors({});
    setIsEditing(true);
  }

  async function handleStartEdit(project: Project) {
    try {
      // Fetch full project data from admin GET /api/v1/admin/projects/{id}
      const full = await adminJSON<Project>(`/projects/${project.id}`);
      const galleryList = Array.isArray(full.gallery)
        ? full.gallery
        : Array.isArray(full.gallery_images)
        ? full.gallery_images
        : [];

      setForm({
        id: full.id,
        title: full.title,
        slug: full.slug,
        client_name: full.client_name || "",
        sector: full.sector || "Residential",
        location: full.location || "",
        year_completed: full.year_completed || new Date().getFullYear(),
        scope: full.scope || "",
        challenge: full.challenge || "",
        solution: full.solution || "",
        body: full.body || "",
        cover_image: full.cover_image || "",
        gallery: galleryList,
        is_featured: full.is_featured ?? false,
        is_published: full.is_published !== false,
      });
      setFormErrors({});
      setIsEditing(true);
    } catch (err: any) {
      toast.error("Failed to fetch project details.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        client_name: form.client_name.trim(),
        sector: form.sector,
        location: form.location.trim(),
        year_completed: Number(form.year_completed),
        scope: form.scope.trim(),
        challenge: form.challenge.trim(),
        solution: form.solution.trim(),
        body: form.body.trim(),
        cover_image: form.cover_image,
        gallery: form.gallery,
        is_featured: form.is_featured,
        is_published: form.is_published,
      };

      if (form.id) {
        // Edit project
        await adminJSON(`/projects/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Project updated successfully.");
      } else {
        // Create project
        await adminJSON("/projects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Project created successfully.");
      }

      setIsEditing(false);
      setForm(initialFormState);
      loadProjects();
    } catch (err: any) {
      const msg = err.message || (form.id ? "Failed to update project." : "Failed to create project.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminJSON(`/projects/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Project deleted successfully.");
      setDeleteTarget(null);
      loadProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project.");
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
          <h1 className="font-display text-2xl text-ink">Projects Portfolio</h1>
          <p className="text-xs text-ink-soft mt-1">
            Manage construction portfolio projects, cover banners, multi-image galleries, and featured statuses.
          </p>
        </div>
        <button
          onClick={handleStartCreate}
          className="btn-primary self-start sm:self-auto inline-flex items-center gap-2 text-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-stone-paper border border-stone-line p-3 rounded-sm text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
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
                {st === "ALL" ? "All" : st === "PUBLISHED" ? "Published" : "Drafts"}
              </button>
            ))}
          </div>

          {/* Sector Dropdown */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="border border-stone-line px-2.5 py-1.5 rounded-sm bg-stone-paper text-ink font-medium"
          >
            <option value="ALL">All Sectors</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search projects by title, client, or location…"
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

      {/* Projects Table */}
      <div className="border border-stone-line bg-stone-paper rounded-sm overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-ink-soft flex flex-col items-center justify-center gap-2">
            <svg className="animate-spin h-6 w-6 text-brass" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-xs">Loading projects…</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-ink-soft text-sm">
            {searchQuery || statusFilter !== "ALL" || sectorFilter !== "ALL"
              ? "No projects match your filters."
              : "No projects added yet. Click 'New Project' to create one."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-line bg-stone-fog text-ink font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-20">Cover</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4 w-32">Sector / Year</th>
                  <th className="py-3 px-4 w-24 text-center">Gallery</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-line">
                {filteredProjects.map((p) => {
                  const galleryCount = Array.isArray(p.gallery)
                    ? p.gallery.length
                    : Array.isArray(p.gallery_images)
                    ? p.gallery_images.length
                    : 0;

                  return (
                    <tr key={p.id} className="hover:bg-stone-fog/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="relative h-12 w-16 bg-stone-fog rounded-sm overflow-hidden border border-stone-line">
                          {p.cover_image ? (
                            <Image
                              src={p.cover_image}
                              alt={p.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                              unoptimized={p.cover_image.startsWith("/uploads/")}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400">
                              No Cover
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink text-sm">{p.title}</span>
                          {p.is_featured && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-soft mt-0.5">
                          {p.location} {p.client_name ? `· Client: ${p.client_name}` : ""}
                        </div>
                        <div className="text-[10px] text-ink-soft/80 font-mono mt-0.5">/projects/{p.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-ink">{p.sector}</div>
                        <div className="text-ink-soft text-[11px]">{p.year_completed}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-sm bg-stone-fog border border-stone-line text-ink">
                          <svg className="h-3 w-3 text-ink-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {galleryCount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.is_published !== false ? (
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
                          onClick={() => handleStartEdit(p)}
                          className="px-2.5 py-1 text-xs border border-stone-line bg-stone-paper hover:bg-stone-fog text-ink font-medium rounded-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="px-2.5 py-1 text-xs border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-sm transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Project Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={isSubmitting ? undefined : () => setIsEditing(false)}
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-stone-line bg-stone-paper p-6 shadow-2xl rounded-sm">
            <div className="flex items-center justify-between border-b border-stone-line pb-4 mb-5">
              <div>
                <h2 className="font-display text-lg text-ink font-semibold">
                  {form.id ? "Edit Project" : "New Project"}
                </h2>
                <p className="text-xs text-ink-soft mt-0.5">
                  {form.id ? "Update project information, cover banner, and photo gallery." : "Add a new construction portfolio project."}
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
              {/* Title & Custom Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Project Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Layered Edge Residence"
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

              {/* Sector, Location, Year, Client */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Sector <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    className="w-full border border-stone-line px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm focus:border-ink font-medium"
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Location <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Colombo 07"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className={`w-full border px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm ${
                      formErrors.location ? "border-red-500" : "border-stone-line focus:border-ink"
                    }`}
                  />
                  {formErrors.location && <p className="text-xs text-red-600 mt-1">{formErrors.location}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Year Completed <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1950"
                    max="2100"
                    value={form.year_completed}
                    onChange={(e) => setForm({ ...form, year_completed: parseInt(e.target.value) || 0 })}
                    className={`w-full border px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm font-mono ${
                      formErrors.year_completed ? "border-red-500" : "border-stone-line focus:border-ink"
                    }`}
                  />
                  {formErrors.year_completed && <p className="text-xs text-red-600 mt-1">{formErrors.year_completed}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Private Client"
                    value={form.client_name}
                    onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                    className="w-full border border-stone-line px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm focus:border-ink"
                  />
                </div>
              </div>

              {/* Scope & Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Scope of Works
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Complete architectural design, structural engineering, civil construction, and interior fit-out."
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value })}
                  className="w-full border border-stone-line px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Full Project Description / Body
                </label>
                <textarea
                  rows={4}
                  placeholder="Detailed project description and case study narrative."
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full border border-stone-line px-3 py-2 rounded-sm bg-stone-paper text-ink text-sm focus:border-ink"
                />
              </div>

              {/* Cover Image Upload */}
              <div className="border-t border-stone-line pt-4">
                <SingleImageUploader
                  label="Main Cover Image"
                  value={form.cover_image}
                  required
                  onChange={(url) => setForm({ ...form, cover_image: url })}
                  helpText="Hero cover image displayed on project cards and detail page banner."
                  folder="projects"
                />
                {formErrors.cover_image && <p className="text-xs text-red-600 mt-1">{formErrors.cover_image}</p>}
              </div>

              {/* Project Gallery Upload */}
              <div className="border-t border-stone-line pt-4">
                <MultiGalleryUploader
                  label="Project Gallery Photos"
                  images={form.gallery}
                  onChange={(imgs) => setForm({ ...form, gallery: imgs })}
                  folder="projects"
                />
              </div>

              {/* Featured & Publication Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-line pt-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Featured Project
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      className="rounded border-stone-line text-ink focus:ring-ink h-4 w-4"
                    />
                    <span className="text-xs text-ink font-medium">Display in Featured Showcase on Homepage</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Publication Status
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="project_status"
                        checked={form.is_published}
                        onChange={() => setForm({ ...form, is_published: true })}
                        className="text-ink focus:ring-ink"
                      />
                      <span className="text-xs font-medium text-ink">Published</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="project_status"
                        checked={!form.is_published}
                        onChange={() => setForm({ ...form, is_published: false })}
                        className="text-ink focus:ring-ink"
                      />
                      <span className="text-xs font-medium text-ink-soft">Draft</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-ink-soft mt-1">
                    Draft projects are hidden from visitors on public pages.
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
                  {form.id ? "Save Changes" : "Create Project"}
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
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Project"
        isLoading={isDeleting}
        isDanger={true}
      />
    </div>
  );
}
