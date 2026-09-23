"use client"

import * as React from "react"
import { useAdminStore } from "@/lib/store/adminStore"
import { Service } from "@/lib/types"
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
  HardHat,
  CheckCircle2,
  Layers,
  AlertTriangle,
  Building2,
} from "lucide-react"

export function ServicesManager() {
  const { services, addService, updateService, deleteService } = useAdminStore()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [viewingService, setViewingService] = React.useState<Service | null>(null)
  const [editingService, setEditingService] = React.useState<Service | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [deletingServiceId, setDeletingServiceId] = React.useState<string | null>(null)
  const [feedback, setFeedback] = React.useState<string | null>(null)

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3500)
  }

  const filteredServices = React.useMemo(() => {
    return services.filter((s) => {
      return (
        searchQuery === "" ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [services, searchQuery])

  const handleDeleteConfirm = () => {
    if (deletingServiceId) {
      const srv = services.find((s) => s.id === deletingServiceId)
      deleteService(deletingServiceId)
      setDeletingServiceId(null)
      showFeedback(`Service "${srv?.title || deletingServiceId}" deleted successfully.`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-montserrat font-bold text-foreground">
              Services Management
            </h2>
            <Badge variant="secondary" className="font-mono text-xs">
              {services.length} Total Services
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Manage engineering disciplines, scope descriptions, technical deliverables, and workflows.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="font-semibold shadow-md shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Service
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md bg-card rounded-xl border border-border">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          placeholder="Search services by title or summary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      {/* Services Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="py-3.5 px-4">Order & Service Title</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4">Sectors</th>
                <th className="py-3.5 px-4">Deliverables</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredServices.length > 0 ? (
                filteredServices.map((service, index) => (
                  <tr key={service.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-text-muted/60 bg-muted px-2 py-1 rounded">
                          0{service.sort_order ?? index + 1}
                        </span>
                        <div>
                          <div className="font-bold text-foreground text-sm">
                            {service.title}
                          </div>
                          <div className="text-xs text-text-muted line-clamp-1 max-w-xs mt-0.5">
                            {service.summary}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-text-muted">
                      /services/{service.slug}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {service.sectors?.map((sec) => (
                          <Badge key={sec} variant="secondary" className="text-[10px]">
                            {sec}
                          </Badge>
                        )) || <span className="text-xs text-text-muted">-</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-foreground">
                      {service.deliverables?.length || 0} items
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingService(service)}
                          className="h-8 w-8 p-0"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingService(service)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingServiceId(service.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted">
                    <Layers className="w-10 h-10 mx-auto text-text-muted/40 mb-2" />
                    <p className="font-semibold text-foreground">No services found</p>
                    <p className="text-xs mt-1">Add a new service offering to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. VIEW SERVICE MODAL */}
      {viewingService && (
        <Modal
          isOpen={!!viewingService}
          onClose={() => setViewingService(null)}
          title={viewingService.title}
          description={`Slug: /services/${viewingService.slug} • Order: 0${viewingService.sort_order}`}
          className="max-w-2xl"
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-2">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Summary</span>
              <p className="text-sm font-medium text-foreground">{viewingService.summary}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Full Engineering Scope</span>
              <p className="text-text-muted leading-relaxed p-3 rounded-lg border border-border bg-card">
                {viewingService.body}
              </p>
            </div>

            {viewingService.deliverables && viewingService.deliverables.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-text-muted uppercase font-semibold">Key Technical Deliverables</span>
                <ul className="space-y-1.5">
                  {viewingService.deliverables.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <Button onClick={() => setViewingService(null)}>Close Window</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. ADD SERVICE MODAL */}
      {isAddModalOpen && (
        <ServiceFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New Engineering Service"
          onSubmit={(data) => {
            const created = addService(data)
            setIsAddModalOpen(false)
            showFeedback(`Service "${created.title}" created successfully!`)
          }}
        />
      )}

      {/* 3. EDIT SERVICE MODAL */}
      {editingService && (
        <ServiceFormModal
          isOpen={!!editingService}
          initialData={editingService}
          onClose={() => setEditingService(null)}
          title={`Edit Service: ${editingService.title}`}
          onSubmit={(data) => {
            updateService(editingService.id, data)
            setEditingService(null)
            showFeedback(`Service "${editingService.title}" updated successfully!`)
          }}
        />
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {deletingServiceId && (
        <Modal
          isOpen={!!deletingServiceId}
          onClose={() => setDeletingServiceId(null)}
          title="Confirm Service Deletion"
          description="Are you sure you want to permanently delete this engineering service? This will remove its public page and catalogue tile."
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Deleting this service will remove it from the services listing.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletingServiceId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete Service
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Service Form Modal for Add & Edit
interface ServiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  initialData?: Service
  onSubmit: (data: Partial<Service>) => void
}

function ServiceFormModal({ isOpen, onClose, title, initialData, onSubmit }: ServiceFormModalProps) {
  const [formData, setFormData] = React.useState<Partial<Service>>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    summary: initialData?.summary || "",
    body: initialData?.body || "",
    icon: initialData?.icon || "Building2",
    sort_order: initialData?.sort_order || 1,
    sectors: initialData?.sectors || ["Commercial", "Residential"],
    deliverables: initialData?.deliverables || [
      "Comprehensive site investigation",
      "CIDA compliant engineering execution",
    ],
  })

  const [deliverablesText, setDeliverablesText] = React.useState(
    formData.deliverables?.join("\n") || ""
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedDeliverables = deliverablesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    onSubmit({
      ...formData,
      slug: formData.slug || formData.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      deliverables: parsedDeliverables,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="font-semibold text-foreground block mb-1">Service Title *</label>
            <Input
              required
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Geotechnical & Piling Substructures"
            />
          </div>
          <div>
            <label className="font-semibold text-foreground block mb-1">Sort Order Index</label>
            <Input
              type="number"
              value={formData.sort_order ?? 1}
              onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-foreground block mb-1">Brief Summary *</label>
          <Input
            required
            value={formData.summary || ""}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="e.g. Deep foundation engineering and bored pile shoring..."
          />
        </div>

        <div>
          <label className="font-semibold text-foreground block mb-1">Detailed Technical Body *</label>
          <textarea
            required
            rows={4}
            value={formData.body || ""}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Comprehensive description of engineering capabilities, plant machinery, and CIDA compliance..."
          />
        </div>

        <div>
          <label className="font-semibold text-foreground block mb-1">
            Key Deliverables <span className="text-text-muted font-normal">(one per line)</span>
          </label>
          <textarea
            rows={3}
            value={deliverablesText}
            onChange={(e) => setDeliverablesText(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-sans"
            placeholder="Turnkey structural shell construction&#10;Reinforced concrete framing & post-tensioned slabs"
          />
        </div>

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm pt-3 pb-1 border-t border-border flex justify-end gap-2 mt-4 -mx-1 px-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save Service
          </Button>
        </div>
      </form>
    </Modal>
  )
}
