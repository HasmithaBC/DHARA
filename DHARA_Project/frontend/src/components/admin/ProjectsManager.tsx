"use client"

import * as React from "react"
import { useAdminStore } from "@/lib/store/adminStore"
import { Project } from "@/lib/types"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { Modal } from "@/components/ui/Modal"
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Building,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  HardHat,
} from "lucide-react"

export function ProjectsManager() {
  const { projects, addProject, updateProject, deleteProject } = useAdminStore()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [sectorFilter, setSectorFilter] = React.useState("ALL")

  const [viewingProject, setViewingProject] = React.useState<Project | null>(null)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [deletingProjectId, setDeletingProjectId] = React.useState<string | null>(null)
  const [feedback, setFeedback] = React.useState<string | null>(null)

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3500)
  }

  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSector =
        sectorFilter === "ALL" || p.sector.toLowerCase() === sectorFilter.toLowerCase()

      return matchesSearch && matchesSector
    })
  }, [projects, searchQuery, sectorFilter])

  const handleDeleteConfirm = () => {
    if (deletingProjectId) {
      const prj = projects.find((p) => p.id === deletingProjectId)
      deleteProject(deletingProjectId)
      setDeletingProjectId(null)
      showFeedback(`Project "${prj?.title || deletingProjectId}" deleted successfully.`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-montserrat font-bold text-foreground">
              Projects Management
            </h2>
            <Badge variant="secondary" className="font-mono text-xs">
              {projects.length} Total Case Studies
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Create, update, and manage engineering case studies, BOQ metrics, and site transformation stories.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="font-semibold shadow-md shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Project
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl bg-card p-4 rounded-xl border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search projects by title, client, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="text-xs"
        >
          <option value="ALL">All Sectors</option>
          <option value="Commercial">Commercial</option>
          <option value="Residential">Residential</option>
          <option value="Industrial">Industrial</option>
          <option value="Hospitality">Hospitality</option>
          <option value="Infrastructure">Infrastructure</option>
        </Select>
      </div>

      {/* Projects Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="py-3.5 px-4">Project Title & Client</th>
                <th className="py-3.5 px-4">Sector</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Year</th>
                <th className="py-3.5 px-4">Key Scale Metric</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground text-sm">
                        {project.title}
                      </div>
                      <div className="text-xs text-primary font-medium mt-0.5">
                        Client: {project.client_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        {project.sector}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-muted">
                      <div className="flex items-center gap-1 text-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{project.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-foreground font-semibold">
                      {project.year_completed}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-text-muted">
                      {project.boq_metrics ? Object.values(project.boq_metrics)[0] : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingProject(project)}
                          className="h-8 w-8 p-0"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProject(project)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingProjectId(project.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    <Building className="w-10 h-10 mx-auto text-text-muted/40 mb-2" />
                    <p className="font-semibold text-foreground">No projects found</p>
                    <p className="text-xs mt-1">Add a new project case study.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. VIEW PROJECT DETAILS MODAL */}
      {viewingProject && (
        <Modal
          isOpen={!!viewingProject}
          onClose={() => setViewingProject(null)}
          title={viewingProject.title}
          description={`Sector: ${viewingProject.sector} • Completed: ${viewingProject.year_completed}`}
          className="max-w-2xl"
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/60 border border-border">
              <div>
                <span className="text-[10px] text-text-muted uppercase font-semibold">Client</span>
                <p className="font-bold text-foreground text-sm">{viewingProject.client_name}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase font-semibold">Location</span>
                <p className="font-bold text-foreground text-sm">{viewingProject.location}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase font-semibold">Year</span>
                <p className="font-mono font-bold text-primary text-sm">{viewingProject.year_completed}</p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Scope of Work</span>
              <p className="text-text-muted leading-relaxed p-3 rounded-lg border border-border bg-card">
                {viewingProject.scope}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">Challenge</span>
                <p className="leading-relaxed">{viewingProject.challenge}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">Dhara Solution</span>
                <p className="leading-relaxed">{viewingProject.solution}</p>
              </div>
            </div>

            {viewingProject.boq_metrics && (
              <div className="space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-semibold">BOQ & Scale Metrics</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(viewingProject.boq_metrics).map(([k, v]) => (
                    <div key={k} className="p-2 rounded bg-muted/40 border border-border">
                      <span className="text-[10px] text-text-muted block truncate">{k}</span>
                      <span className="font-bold font-mono text-foreground text-xs">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <Button onClick={() => setViewingProject(null)}>Close Window</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. ADD PROJECT MODAL */}
      {isAddModalOpen && (
        <ProjectFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New Project Case Study"
          onSubmit={(data) => {
            const created = addProject(data)
            setIsAddModalOpen(false)
            showFeedback(`Project "${created.title}" created successfully!`)
          }}
        />
      )}

      {/* 3. EDIT PROJECT MODAL */}
      {editingProject && (
        <ProjectFormModal
          isOpen={!!editingProject}
          initialData={editingProject}
          onClose={() => setEditingProject(null)}
          title={`Edit Project: ${editingProject.title}`}
          onSubmit={(data) => {
            updateProject(editingProject.id, data)
            setEditingProject(null)
            showFeedback(`Project "${editingProject.title}" updated successfully!`)
          }}
        />
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {deletingProjectId && (
        <Modal
          isOpen={!!deletingProjectId}
          onClose={() => setDeletingProjectId(null)}
          title="Confirm Project Deletion"
          description="Are you sure you want to permanently delete this project case study? This will remove its portfolio page and cards."
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Deleting this project will remove it from the portfolio.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletingProjectId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Project Form Modal for Add & Edit
interface ProjectFormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  initialData?: Project
  onSubmit: (data: Partial<Project>) => void
}

function ProjectFormModal({ isOpen, onClose, title, initialData, onSubmit }: ProjectFormModalProps) {
  const [formData, setFormData] = React.useState<Partial<Project>>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    client_name: initialData?.client_name || "",
    sector: initialData?.sector || "Commercial",
    location: initialData?.location || "",
    district_id: initialData?.district_id || "Colombo",
    year_completed: initialData?.year_completed || new Date().getFullYear(),
    scope: initialData?.scope || "",
    challenge: initialData?.challenge || "",
    solution: initialData?.solution || "",
    body: initialData?.body || "",
    is_featured: initialData?.is_featured ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      slug: formData.slug || formData.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-foreground block mb-1">Project Title *</label>
            <Input
              required
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Apex Horizon Commercial Complex"
            />
          </div>
          <div>
            <label className="font-semibold text-foreground block mb-1">Client Name *</label>
            <Input
              required
              value={formData.client_name || ""}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="e.g. Apex Holdings PLC"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-foreground block mb-1">Sector</label>
            <Select
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
            >
              <option value="Commercial">Commercial</option>
              <option value="Residential">Residential</option>
              <option value="Industrial">Industrial</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Infrastructure">Infrastructure</option>
            </Select>
          </div>
          <div>
            <label className="font-semibold text-foreground block mb-1">Location *</label>
            <Input
              required
              value={formData.location || ""}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Colombo 07"
            />
          </div>
          <div>
            <label className="font-semibold text-foreground block mb-1">Completion Year</label>
            <Input
              type="number"
              value={formData.year_completed || 2024}
              onChange={(e) => setFormData({ ...formData, year_completed: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-foreground block mb-1">Scope of Work *</label>
          <Input
            required
            value={formData.scope || ""}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
            placeholder="e.g. Turnkey structural engineering, piling, and 7-storey framing..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-foreground block mb-1">Engineering Challenge</label>
            <textarea
              rows={3}
              value={formData.challenge || ""}
              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. High groundwater table and vibration-free contiguous pile requirements..."
            />
          </div>
          <div>
            <label className="font-semibold text-foreground block mb-1">Dhara Solution</label>
            <textarea
              rows={3}
              value={formData.solution || ""}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Secant pile wall shoring system with deep well dewatering..."
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-foreground block mb-1">Case Study Narrative (Body)</label>
          <textarea
            rows={3}
            value={formData.body || ""}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Comprehensive description of the building project, milestones, and client outcomes..."
          />
        </div>

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm pt-3 pb-1 border-t border-border flex justify-end gap-2 mt-4 -mx-1 px-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save Project
          </Button>
        </div>
      </form>
    </Modal>
  )
}
