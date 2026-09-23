"use client"

import * as React from "react"
import { useAdminStore } from "@/lib/store/adminStore"
import { Property } from "@/lib/types"
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
  Building2,
  MapPin,
  Tag,
  AlertTriangle,
  Home,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function PropertiesManager() {
  const { properties, addProperty, updateProperty, deleteProperty } = useAdminStore()

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [listingTypeFilter, setListingTypeFilter] = React.useState<string>("ALL")

  // Modals state
  const [viewingProperty, setViewingProperty] = React.useState<Property | null>(null)
  const [editingProperty, setEditingProperty] = React.useState<Property | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [deletingPropertyId, setDeletingPropertyId] = React.useState<string | null>(null)

  // Feedback banner
  const [feedback, setFeedback] = React.useState<string | null>(null)

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3500)
  }

  // Filtered properties
  const filteredProperties = React.useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reference_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.district_id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        categoryFilter === "ALL" || p.category === categoryFilter

      const matchesStatus =
        statusFilter === "ALL" || p.status === statusFilter

      const matchesListingType =
        listingTypeFilter === "ALL" || p.listing_type === listingTypeFilter

      return matchesSearch && matchesCategory && matchesStatus && matchesListingType
    })
  }, [properties, searchQuery, categoryFilter, statusFilter, listingTypeFilter])

  // Delete Handler
  const handleDeleteConfirm = () => {
    if (deletingPropertyId) {
      const prop = properties.find((p) => p.id === deletingPropertyId)
      deleteProperty(deletingPropertyId)
      setDeletingPropertyId(null)
      showFeedback(`Property "${prop?.reference_code || deletingPropertyId}" deleted successfully.`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-montserrat font-bold text-foreground">
              Properties Management
            </h2>
            <Badge variant="secondary" className="font-mono text-xs">
              {properties.length} Total Listings
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Create, update, view specifications, and manage real estate inventory.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="font-semibold shadow-md shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Property
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-4 rounded-xl border border-border">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search by ref, title, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Category */}
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs"
        >
          <option value="ALL">All Categories</option>
          <option value="LAND">Land Plots</option>
          <option value="HOUSE">Houses & Villas</option>
          <option value="COMMERCIAL">Commercial</option>
        </Select>

        {/* Listing Type */}
        <Select
          value={listingTypeFilter}
          onChange={(e) => setListingTypeFilter(e.target.value)}
          className="text-xs"
        >
          <option value="ALL">All Listing Types</option>
          <option value="SALE">For Sale</option>
          <option value="RENT">For Rent</option>
        </Select>

        {/* Status */}
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
          <option value="RENTED">Rented</option>
        </Select>
      </div>

      {/* Properties Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="py-3.5 px-4">Ref & Title</th>
                <th className="py-3.5 px-4">Category / Type</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Price (LKR)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-bold text-primary flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        {property.reference_code}
                      </div>
                      <div className="font-medium text-foreground text-sm line-clamp-1 mt-0.5 max-w-xs">
                        {property.title}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[11px] font-semibold">
                          {property.category}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            property.listing_type === "SALE" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                          )}
                        >
                          {property.listing_type}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-muted">
                      <div className="flex items-center gap-1 text-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{property.city_id}</span>
                      </div>
                      <span className="text-[11px] text-text-muted">{property.district_id}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-foreground">
                      {property.price_on_request ? (
                        <span className="text-amber-600 font-sans">On Request</span>
                      ) : (
                        <>
                          LKR {property.price_lkr?.toLocaleString()}
                          {property.price_unit === "PER_PERCH" && <span className="text-[10px] font-normal text-text-muted"> / perch</span>}
                          {property.price_unit === "PER_MONTH" && <span className="text-[10px] font-normal text-text-muted"> / mo</span>}
                        </>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block",
                          property.status === "PUBLISHED" && "bg-emerald-500/10 text-emerald-600",
                          property.status === "DRAFT" && "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
                          property.status === "RESERVED" && "bg-amber-500/10 text-amber-600",
                          property.status === "SOLD" && "bg-rose-500/10 text-rose-600",
                          property.status === "RENTED" && "bg-blue-500/10 text-blue-600"
                        )}
                      >
                        {property.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingProperty(property)}
                          className="h-8 w-8 p-0"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProperty(property)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          title="Edit Property"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingPropertyId(property.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete Property"
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
                    <Building2 className="w-10 h-10 mx-auto text-text-muted/40 mb-2" />
                    <p className="font-semibold text-foreground">No properties found</p>
                    <p className="text-xs mt-1">Try adjusting your search criteria or add a new listing.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. VIEW PROPERTY DETAILS MODAL */}
      {viewingProperty && (
        <Modal
          isOpen={!!viewingProperty}
          onClose={() => setViewingProperty(null)}
          title={`Property: ${viewingProperty.reference_code}`}
          description={viewingProperty.title}
          className="max-w-2xl"
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/60 border border-border">
              <div>
                <span className="text-[10px] text-text-muted uppercase font-semibold">Category</span>
                <p className="font-bold text-foreground text-sm">{viewingProperty.category}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase font-semibold">Listing Type</span>
                <p className="font-bold text-foreground text-sm">{viewingProperty.listing_type}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase font-semibold">Status</span>
                <p className="font-bold text-primary text-sm">{viewingProperty.status}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase font-semibold">Price</span>
                <p className="font-mono font-bold text-foreground text-sm">
                  {viewingProperty.price_on_request ? "On Request" : `LKR ${viewingProperty.price_lkr?.toLocaleString()}`}
                </p>
              </div>
            </div>

            {/* Location & Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-border space-y-2">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Location Details
                </span>
                <div className="space-y-1 text-text-muted">
                  <p><strong className="text-foreground">City:</strong> {viewingProperty.city_id}</p>
                  <p><strong className="text-foreground">District:</strong> {viewingProperty.district_id}</p>
                  <p><strong className="text-foreground">Province:</strong> {viewingProperty.province_id}</p>
                  <p><strong className="text-foreground">Address:</strong> {viewingProperty.address_line || "Not specified"}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border space-y-2">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-primary" /> Key Attributes
                </span>
                <div className="space-y-1 text-text-muted">
                  {viewingProperty.land_extent_perches && (
                    <p><strong className="text-foreground">Land Extent:</strong> {viewingProperty.land_extent_perches} Perches</p>
                  )}
                  {viewingProperty.built_area_sqft && (
                    <p><strong className="text-foreground">Built Area:</strong> {viewingProperty.built_area_sqft} sqft</p>
                  )}
                  {viewingProperty.bedrooms && (
                    <p><strong className="text-foreground">Bedrooms / Baths:</strong> {viewingProperty.bedrooms} Beds / {viewingProperty.bathrooms} Baths</p>
                  )}
                  {viewingProperty.deed_type && (
                    <p><strong className="text-foreground">Title/Deed:</strong> {viewingProperty.deed_type}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Description</span>
              <p className="text-text-muted leading-relaxed p-3 rounded-lg bg-muted/40 border border-border">
                {viewingProperty.description || viewingProperty.short_description || "No detailed description provided."}
              </p>
            </div>

            <div className="flex justify-end pt-3">
              <Button onClick={() => setViewingProperty(null)}>Close Window</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. ADD PROPERTY MODAL */}
      {isAddModalOpen && (
        <PropertyFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New Property Listing"
          onSubmit={(data) => {
            const created = addProperty(data)
            setIsAddModalOpen(false)
            showFeedback(`Property "${created.reference_code}" created successfully!`)
          }}
        />
      )}

      {/* 3. EDIT PROPERTY MODAL */}
      {editingProperty && (
        <PropertyFormModal
          isOpen={!!editingProperty}
          initialData={editingProperty}
          onClose={() => setEditingProperty(null)}
          title={`Edit Property: ${editingProperty.reference_code}`}
          onSubmit={(data) => {
            updateProperty(editingProperty.id, data)
            setEditingProperty(null)
            showFeedback(`Property "${editingProperty.reference_code}" updated successfully!`)
          }}
        />
      )}

      {/* 4. DELETE CONFIRMATION DIALOG */}
      {deletingPropertyId && (
        <Modal
          isOpen={!!deletingPropertyId}
          onClose={() => setDeletingPropertyId(null)}
          title="Confirm Property Deletion"
          description="Are you sure you want to permanently remove this property listing? This action cannot be undone."
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Deleting this property will remove it from the catalogue and admin tables.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletingPropertyId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete Property
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Reusable Form Component for Add & Edit Property
interface PropertyFormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  initialData?: Property
  onSubmit: (data: Partial<Property>) => void
}

function PropertyFormModal({ isOpen, onClose, title, initialData, onSubmit }: PropertyFormModalProps) {
  const [formData, setFormData] = React.useState<Partial<Property>>({
    reference_code: initialData?.reference_code || `DHR-PRP-${Math.floor(100 + Math.random() * 900)}`,
    title: initialData?.title || "",
    category: initialData?.category || "LAND",
    listing_type: initialData?.listing_type || "SALE",
    status: initialData?.status || "PUBLISHED",
    price_lkr: initialData?.price_lkr || 0,
    price_on_request: initialData?.price_on_request || false,
    price_unit: initialData?.price_unit || "TOTAL",
    province_id: initialData?.province_id || "Western",
    district_id: initialData?.district_id || "Colombo",
    city_id: initialData?.city_id || "Colombo",
    address_line: initialData?.address_line || "",
    land_extent_perches: initialData?.land_extent_perches || undefined,
    built_area_sqft: initialData?.built_area_sqft || undefined,
    bedrooms: initialData?.bedrooms || undefined,
    bathrooms: initialData?.bathrooms || undefined,
    description: initialData?.description || "",
    short_description: initialData?.short_description || "",
  })

  const handleChange = (key: keyof Property, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
        {/* Row 1: Ref & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-foreground block mb-1">Ref Code *</label>
            <Input
              required
              value={formData.reference_code || ""}
              onChange={(e) => handleChange("reference_code", e.target.value)}
              placeholder="e.g. DHR-LND-005"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold text-foreground block mb-1">Listing Title *</label>
            <Input
              required
              value={formData.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. 15 Perch Prime Plot in Pelawatte"
            />
          </div>
        </div>

        {/* Row 2: Category, Listing Type, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-foreground block mb-1">Category</label>
            <Select
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
            >
              <option value="LAND">Land Plot</option>
              <option value="HOUSE">House / Villa</option>
              <option value="COMMERCIAL">Commercial</option>
            </Select>
          </div>
          <div>
            <label className="font-semibold text-foreground block mb-1">Listing Type</label>
            <Select
              value={formData.listing_type}
              onChange={(e) => handleChange("listing_type", e.target.value)}
            >
              <option value="SALE">For Sale</option>
              <option value="RENT">For Rent</option>
            </Select>
          </div>
          <div>
            <label className="font-semibold text-foreground block mb-1">Status</label>
            <Select
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="RENTED">Rented</option>
            </Select>
          </div>
        </div>

        {/* Row 3: Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="font-semibold text-foreground block mb-1">Price (LKR)</label>
            <Input
              type="number"
              value={formData.price_lkr || ""}
              disabled={formData.price_on_request}
              onChange={(e) => handleChange("price_lkr", Number(e.target.value))}
              placeholder="e.g. 45000000"
            />
          </div>
          <div>
            <label className="font-semibold text-foreground block mb-1">Price Unit</label>
            <Select
              value={formData.price_unit || "TOTAL"}
              onChange={(e) => handleChange("price_unit", e.target.value)}
            >
              <option value="TOTAL">Total Amount</option>
              <option value="PER_PERCH">Per Perch</option>
              <option value="PER_MONTH">Per Month</option>
              <option value="PER_YEAR">Per Year</option>
            </Select>
          </div>
        </div>

        {/* Row 4: Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-foreground block mb-1">City / Town</label>
            <Input
              value={formData.city_id || ""}
              onChange={(e) => handleChange("city_id", e.target.value)}
              placeholder="e.g. Battaramulla"
            />
          </div>
          <div>
            <label className="font-semibold text-foreground block mb-1">District</label>
            <Input
              value={formData.district_id || ""}
              onChange={(e) => handleChange("district_id", e.target.value)}
              placeholder="e.g. Colombo"
            />
          </div>
          <div>
            <label className="font-semibold text-foreground block mb-1">Address / Landmark</label>
            <Input
              value={formData.address_line || ""}
              onChange={(e) => handleChange("address_line", e.target.value)}
              placeholder="e.g. Pelawatte Road"
            />
          </div>
        </div>

        {/* Dynamic Category Specifications */}
        {formData.category === "LAND" ? (
          <div className="p-3 rounded-lg bg-muted/40 border border-border">
            <label className="font-semibold text-foreground block mb-1">Land Extent (Perches)</label>
            <Input
              type="number"
              step="0.1"
              value={formData.land_extent_perches || ""}
              onChange={(e) => handleChange("land_extent_perches", Number(e.target.value))}
              placeholder="e.g. 15.5"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            <div>
              <label className="font-semibold text-foreground block mb-1">Built Area (sqft)</label>
              <Input
                type="number"
                value={formData.built_area_sqft || ""}
                onChange={(e) => handleChange("built_area_sqft", Number(e.target.value))}
                placeholder="e.g. 3500"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Bedrooms</label>
              <Input
                type="number"
                value={formData.bedrooms || ""}
                onChange={(e) => handleChange("bedrooms", Number(e.target.value))}
                placeholder="e.g. 4"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Bathrooms</label>
              <Input
                type="number"
                value={formData.bathrooms || ""}
                onChange={(e) => handleChange("bathrooms", Number(e.target.value))}
                placeholder="e.g. 3"
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="font-semibold text-foreground block mb-1">Property Description</label>
          <textarea
            rows={3}
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Comprehensive description of deeds, access roads, utility availability..."
          />
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm pt-3 pb-1 border-t border-border flex justify-end gap-2 mt-4 -mx-1 px-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save Property
          </Button>
        </div>
      </form>
    </Modal>
  )
}
