"use client"

import * as React from "react"
import { Property, Service, Project } from "@/lib/types"
import { MOCK_PROPERTIES, MOCK_SERVICES, MOCK_PROJECTS } from "@/lib/mocks"

interface AdminStoreContextType {
  properties: Property[]
  services: Service[]
  projects: Project[]
  isInitialized: boolean
  
  // Properties CRUD
  addProperty: (propertyData: Partial<Property>) => Property
  updateProperty: (id: string, propertyData: Partial<Property>) => boolean
  deleteProperty: (id: string) => boolean
  getProperty: (id: string) => Property | undefined
  
  // Services CRUD
  addService: (serviceData: Partial<Service>) => Service
  updateService: (id: string, serviceData: Partial<Service>) => boolean
  deleteService: (id: string) => boolean
  getService: (id: string) => Service | undefined
  
  // Projects CRUD
  addProject: (projectData: Partial<Project>) => Project
  updateProject: (id: string, projectData: Partial<Project>) => boolean
  deleteProject: (id: string) => boolean
  getProject: (id: string) => Project | undefined

  // Utilities
  resetToDefaults: () => void
}

const AdminStoreContext = React.createContext<AdminStoreContextType | undefined>(undefined)

const STORAGE_KEY_PROPERTIES = "dhara_admin_properties_v1"
const STORAGE_KEY_SERVICES = "dhara_admin_services_v1"
const STORAGE_KEY_PROJECTS = "dhara_admin_projects_v1"

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = React.useState<Property[]>(MOCK_PROPERTIES)
  const [services, setServices] = React.useState<Service[]>(MOCK_SERVICES)
  const [projects, setProjects] = React.useState<Project[]>(MOCK_PROJECTS)
  const [isInitialized, setIsInitialized] = React.useState(false)

  // Load from localStorage on client mount
  React.useEffect(() => {
    try {
      const savedProps = localStorage.getItem(STORAGE_KEY_PROPERTIES)
      if (savedProps) {
        setProperties(JSON.parse(savedProps))
      }
      const savedSrvs = localStorage.getItem(STORAGE_KEY_SERVICES)
      if (savedSrvs) {
        setServices(JSON.parse(savedSrvs))
      }
      const savedProjs = localStorage.getItem(STORAGE_KEY_PROJECTS)
      if (savedProjs) {
        setProjects(JSON.parse(savedProjs))
      }
    } catch (e) {
      console.warn("Failed to load admin store from localStorage:", e)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Sync to localStorage
  const saveProperties = (updated: Property[]) => {
    setProperties(updated)
    try {
      localStorage.setItem(STORAGE_KEY_PROPERTIES, JSON.stringify(updated))
    } catch (e) {
      console.warn("Failed to save properties:", e)
    }
  }

  const saveServices = (updated: Service[]) => {
    setServices(updated)
    try {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated))
    } catch (e) {
      console.warn("Failed to save services:", e)
    }
  }

  const saveProjects = (updated: Project[]) => {
    setProjects(updated)
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated))
    } catch (e) {
      console.warn("Failed to save projects:", e)
    }
  }

  // --- Properties CRUD ---
  const addProperty = (data: Partial<Property>): Property => {
    const newId = `prop-${Date.now()}`
    const newSlug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `prop-${Date.now()}`
    const newProperty: Property = {
      id: newId,
      reference_code: data.reference_code || `DHR-PRP-${Math.floor(100 + Math.random() * 900)}`,
      title: data.title || "Untitled Property",
      slug: newSlug,
      category: data.category || "LAND",
      listing_type: data.listing_type || "SALE",
      status: data.status || "PUBLISHED",
      is_featured: !!data.is_featured,
      short_description: data.short_description || "",
      description: data.description || "",
      price_lkr: data.price_lkr ?? 0,
      price_on_request: !!data.price_on_request,
      price_unit: data.price_unit || (data.category === "LAND" ? "PER_PERCH" : "TOTAL"),
      is_negotiable: data.is_negotiable ?? true,
      province_id: data.province_id || "Western",
      district_id: data.district_id || "Colombo",
      city_id: data.city_id || "Colombo",
      address_line: data.address_line || "",
      show_exact_location: data.show_exact_location ?? true,
      latitude: data.latitude || 6.9271,
      longitude: data.longitude || 79.8612,
      land_extent_perches: data.land_extent_perches || null,
      land_shape: data.land_shape || "Rectangular",
      road_access_ft: data.road_access_ft || 20,
      road_surface: data.road_surface || "CARPETED",
      built_area_sqft: data.built_area_sqft || null,
      bedrooms: data.bedrooms || null,
      bathrooms: data.bathrooms || null,
      floors: data.floors || null,
      parking_spaces: data.parking_spaces || null,
      furnishing: data.furnishing || "UNFURNISHED",
      condition: data.condition || "NEW",
      has_electricity: data.has_electricity ?? true,
      water_source: data.water_source || "MAINS",
      deed_type: data.deed_type || "CLEAR_DEED",
      cover_image_id: data.cover_image_id || "/images/brand/bg_pattern.png",
      view_count: 0,
      created_by: "Admin",
      updated_by: "Admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const updated = [newProperty, ...properties]
    saveProperties(updated)
    return newProperty
  }

  const updateProperty = (id: string, data: Partial<Property>): boolean => {
    let found = false
    const updated = properties.map((p) => {
      if (p.id === id) {
        found = true
        return {
          ...p,
          ...data,
          updated_at: new Date().toISOString(),
          updated_by: "Admin",
        }
      }
      return p
    })
    if (found) {
      saveProperties(updated)
    }
    return found
  }

  const deleteProperty = (id: string): boolean => {
    const initialLen = properties.length
    const updated = properties.filter((p) => p.id !== id)
    if (updated.length !== initialLen) {
      saveProperties(updated)
      return true
    }
    return false
  }

  const getProperty = (id: string): Property | undefined => {
    return properties.find((p) => p.id === id)
  }

  // --- Services CRUD ---
  const addService = (data: Partial<Service>): Service => {
    const newId = `srv-${Date.now()}`
    const newSlug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `srv-${Date.now()}`
    const newService: Service = {
      id: newId,
      slug: newSlug,
      title: data.title || "New Engineering Service",
      summary: data.summary || "",
      body: data.body || "",
      icon: data.icon || "Building2",
      hero_image: data.hero_image || "/images/brand/bg_pattern.png",
      sort_order: data.sort_order ?? properties.length + 1,
      sectors: data.sectors || ["Commercial", "Residential"],
      deliverables: data.deliverables || [
        "Comprehensive site inspection & technical drawings",
        "CIDA compliant engineering execution",
      ],
      process_steps: data.process_steps || [
        { step: 1, title: "Initial Site Assessment", description: "Soil profile and preliminary engineering scope." },
        { step: 2, title: "Execution & Handover", description: "Turnkey project construction and quality sign-off." },
      ],
    }
    const updated = [...services, newService]
    saveServices(updated)
    return newService
  }

  const updateService = (id: string, data: Partial<Service>): boolean => {
    let found = false
    const updated = services.map((s) => {
      if (s.id === id) {
        found = true
        return {
          ...s,
          ...data,
        }
      }
      return s
    })
    if (found) {
      saveServices(updated)
    }
    return found
  }

  const deleteService = (id: string): boolean => {
    const initialLen = services.length
    const updated = services.filter((s) => s.id !== id)
    if (updated.length !== initialLen) {
      saveServices(updated)
      return true
    }
    return false
  }

  const getService = (id: string): Service | undefined => {
    return services.find((s) => s.id === id)
  }

  // --- Projects CRUD ---
  const addProject = (data: Partial<Project>): Project => {
    const newId = `prj-${Date.now()}`
    const newSlug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `prj-${Date.now()}`
    const newProject: Project = {
      id: newId,
      slug: newSlug,
      title: data.title || "New Construction Project",
      client_name: data.client_name || "Private Client",
      sector: data.sector || "Commercial",
      location: data.location || "Colombo, Sri Lanka",
      district_id: data.district_id || "Colombo",
      year_completed: data.year_completed || new Date().getFullYear(),
      scope: data.scope || "",
      challenge: data.challenge || "",
      solution: data.solution || "",
      body: data.body || "",
      cover_image: data.cover_image || "/images/brand/bg_pattern.png",
      gallery: data.gallery || ["/images/brand/bg_pattern.png"],
      boq_metrics: data.boq_metrics || {
        "Total Built Area": "15,000 sqft",
        "Completion Timeline": "12 Months",
      },
      is_featured: !!data.is_featured,
      services_used: data.services_used || ["civil-construction"],
    }
    const updated = [newProject, ...projects]
    saveProjects(updated)
    return newProject
  }

  const updateProject = (id: string, data: Partial<Project>): boolean => {
    let found = false
    const updated = projects.map((p) => {
      if (p.id === id) {
        found = true
        return {
          ...p,
          ...data,
        }
      }
      return p
    })
    if (found) {
      saveProjects(updated)
    }
    return found
  }

  const deleteProject = (id: string): boolean => {
    const initialLen = projects.length
    const updated = projects.filter((p) => p.id !== id)
    if (updated.length !== initialLen) {
      saveProjects(updated)
      return true
    }
    return false
  }

  const getProject = (id: string): Project | undefined => {
    return projects.find((p) => p.id === id)
  }

  // Reset to original mock data
  const resetToDefaults = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_PROPERTIES)
      localStorage.removeItem(STORAGE_KEY_SERVICES)
      localStorage.removeItem(STORAGE_KEY_PROJECTS)
    } catch (e) {
      console.warn("Reset error:", e)
    }
    setProperties(MOCK_PROPERTIES)
    setServices(MOCK_SERVICES)
    setProjects(MOCK_PROJECTS)
  }

  return (
    <AdminStoreContext.Provider
      value={{
        properties,
        services,
        projects,
        isInitialized,
        addProperty,
        updateProperty,
        deleteProperty,
        getProperty,
        addService,
        updateService,
        deleteService,
        getService,
        addProject,
        updateProject,
        deleteProject,
        getProject,
        resetToDefaults,
      }}
    >
      {children}
    </AdminStoreContext.Provider>
  )
}

export function useAdminStore() {
  const context = React.useContext(AdminStoreContext)
  if (!context) {
    throw new Error("useAdminStore must be used within an AdminStoreProvider")
  }
  return context
}
