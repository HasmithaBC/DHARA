import { Property, Service, Project, Lead, Testimonial } from "../types"
import { MOCK_PROPERTIES, MOCK_SERVICES, MOCK_PROJECTS, MOCK_TESTIMONIALS } from "../mocks"

export async function fetchProperties(params?: Record<string, string>): Promise<{ data: Property[]; meta: { page: number; per_page: number; total: number; total_pages: number } }> {
  let filtered = [...MOCK_PROPERTIES]
  if (params?.category) {
    filtered = filtered.filter((p) => p.category.toLowerCase() === params.category.toLowerCase())
  }
  if (params?.listing_type) {
    filtered = filtered.filter((p) => p.listing_type.toLowerCase() === params.listing_type.toLowerCase())
  }
  return {
    data: filtered,
    meta: { page: 1, per_page: 12, total: filtered.length, total_pages: Math.ceil(filtered.length / 12) },
  }
}

export async function fetchProperty(slug: string): Promise<{ data: Property | null }> {
  const property = MOCK_PROPERTIES.find((p) => p.slug === slug) || null
  return { data: property }
}

export async function submitLead(leadData: Partial<Lead>): Promise<{ success: boolean; message?: string }> {
  // Simulates network latency
  await new Promise((resolve) => setTimeout(resolve, 600))
  console.log("Lead captured:", leadData)
  return { success: true, message: "Thank you! Our engineering team will contact you within 2 business hours." }
}

export async function fetchServices(): Promise<{ data: Service[] }> {
  return { data: MOCK_SERVICES }
}

export async function fetchService(slug: string): Promise<{ data: Service | null }> {
  const service = MOCK_SERVICES.find((s) => s.slug === slug) || null
  return { data: service }
}

export async function fetchProjects(): Promise<{ data: Project[] }> {
  return { data: MOCK_PROJECTS }
}

export async function fetchProject(slug: string): Promise<{ data: Project | null }> {
  const project = MOCK_PROJECTS.find((p) => p.slug === slug) || null
  return { data: project }
}

export async function fetchTestimonials(): Promise<{ data: Testimonial[] }> {
  return { data: MOCK_TESTIMONIALS }
}

