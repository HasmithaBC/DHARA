import { Property, Service, Project, Lead } from "../types"

// This is a skeleton API client wrapper matching the API spec in SRS section 6
const API_BASE = "/api/v1"

export async function fetchProperties(params?: Record<string, string>): Promise<{ data: Property[], meta: any }> {
  // TODO: Replace with real fetch call when backend is ready
  console.log("Mock fetch properties", params)
  return { data: [], meta: { page: 1, per_page: 12, total: 0, total_pages: 0 } }
}

export async function fetchProperty(slug: string): Promise<{ data: Property | null }> {
  console.log("Mock fetch property", slug)
  return { data: null }
}

export async function submitLead(leadData: Partial<Lead>): Promise<{ success: boolean }> {
  console.log("Mock submit lead", leadData)
  return { success: true }
}

export async function fetchServices(): Promise<{ data: Service[] }> {
  console.log("Mock fetch services")
  return { data: [] }
}

export async function fetchProjects(): Promise<{ data: Project[] }> {
  console.log("Mock fetch projects")
  return { data: [] }
}
