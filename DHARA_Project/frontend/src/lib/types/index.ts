export interface User {
  id: string
  name: string
  email: string
  role_id: string
}

export interface Location {
  id: string
  name: string // City name
  district: string
  province: string
}

export interface Amenity {
  id: string
  name: string
  icon: string
  applies_to: ('LAND' | 'HOUSE' | 'COMMERCIAL')[]
}

export interface Property {
  id: string
  reference_code: string
  title: string
  slug: string
  category: 'LAND' | 'HOUSE' | 'COMMERCIAL'
  listing_type: 'SALE' | 'RENT'
  status: 'DRAFT' | 'PUBLISHED' | 'RESERVED' | 'SOLD' | 'RENTED' | 'ARCHIVED'
  is_featured: boolean
  short_description: string
  description: string

  // Pricing
  price_lkr?: number | null
  price_on_request: boolean
  price_unit?: 'TOTAL' | 'PER_PERCH' | 'PER_MONTH' | 'PER_YEAR' | null
  is_negotiable?: boolean

  // Rent-specific
  rent_period?: 'MONTHLY' | 'ANNUAL' | null
  minimum_lease_months?: number | null
  advance_months?: number | null
  deposit_lkr?: number | null

  // Location
  province_id: string
  district_id: string
  city_id: string
  address_line?: string
  show_exact_location: boolean
  latitude: number
  longitude: number

  // Land Attributes
  land_extent_perches?: number | null
  land_shape?: string
  road_access_ft?: number | null
  road_surface?: 'CARPETED' | 'CONCRETE' | 'GRAVEL' | 'NONE' | null
  frontage_ft?: number | null
  land_type?: 'RESIDENTIAL' | 'AGRICULTURAL' | 'COMMERCIAL' | 'BEACHFRONT' | 'HILLSIDE' | 'SUBDIVISION_PLOT' | null

  // Building Attributes
  built_area_sqft?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  floors?: number | null
  parking_spaces?: number | null
  year_built?: number | null
  furnishing?: 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED' | null
  condition?: 'NEW' | 'USED' | 'SEMI_FINISHED' | 'UNDER_CONSTRUCTION' | null

  // Utilities & Title
  has_electricity?: boolean
  water_source?: 'MAINS' | 'WELL' | 'BOTH' | 'NONE' | null
  deed_type?: 'CLEAR_DEED' | 'BIM_SAVIYA' | 'LEASEHOLD' | 'OTHER' | null
  deed_note?: string
  has_boundary_wall?: boolean
  has_solar?: boolean
  ac_ready?: boolean

  // Media
  cover_image_id: string
  video_url?: string

  // SEO
  meta_title?: string
  meta_description?: string

  // Audit
  published_at?: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  view_count: number
}

export interface Lead {
  id: string
  lead_type: 'PROPERTY_INQUIRY' | 'SITE_INSPECTION' | 'GENERAL_CONTACT' | 'SERVICE_CONSULTATION' | 'DOCUMENT_DOWNLOAD' | 'NEWSLETTER'
  property_id?: string | null
  name: string
  email: string
  phone: string
  whatsapp_same_as_phone: boolean
  message: string
  offer_amount_lkr?: number | null
  preferred_inspection_date?: string | null
  preferred_inspection_slot?: 'MORNING' | 'AFTERNOON' | 'EVENING' | null
  status: 'NEW' | 'CONTACTED' | 'SITE_VISIT_SCHEDULED' | 'NEGOTIATING' | 'CLOSED_WON' | 'CLOSED_LOST'
  assigned_to?: string | null
  internal_notes: string
  source_url: string
  created_at: string
}

export interface ServiceProcessStep {
  step: number
  title: string
  description: string
}

export interface Service {
  id: string
  slug: string
  title: string
  summary: string
  body: string
  icon: string
  hero_image: string
  sort_order: number
  deliverables?: string[]
  process_steps?: ServiceProcessStep[]
  sectors?: string[]
}

export interface Project {
  id: string
  slug: string
  title: string
  client_name: string
  sector: 'Residential' | 'Commercial' | 'Industrial' | 'Hospitality' | 'Infrastructure' | string
  location: string
  year_completed: number
  scope: string
  challenge: string
  solution: string
  body: string
  cover_image: string
  gallery: string[]
  boq_metrics: Record<string, string | number>
  is_featured: boolean
  before_image?: string
  after_image?: string
  services_used?: string[]
  district_id?: string
}

export interface Testimonial {
  id: string
  author_name: string
  author_location: string
  related_service_or_property: string
  quote: string
  rating: number
  is_published: boolean
  sort_order: number
}
