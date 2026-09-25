export interface PropertySummary {
  id: string;
  reference_code: string;
  title: string;
  slug: string;
  category: "LAND" | "HOUSE" | "COMMERCIAL" | "OTHER";
  listing_type: "SALE" | "RENT";
  status: string;
  is_featured: boolean;
  short_description: string;
  price_lkr: number | null;
  price_on_request: boolean;
  price_unit?: string | null;
  land_extent_perches?: number | null;
  built_area_sqft?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  city_name?: string;
  district_name?: string;
  cover_url?: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt_text: string;
  is_cover: boolean;
}

export interface PropertyDocument {
  id: string;
  type: string;
  title: string;
  access: "PUBLIC" | "GATED" | "INTERNAL";
  is_watermarked: boolean;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
}

export interface PropertyDetail extends PropertySummary {
  description: string;
  is_negotiable: boolean;
  rent_period?: string | null;
  minimum_lease_months?: number | null;
  advance_months?: number | null;
  deposit_lkr?: number | null;
  address_line?: string | null;
  show_exact_location: boolean;
  latitude: number;
  longitude: number;
  land_shape?: string | null;
  road_access_ft?: number | null;
  road_surface?: string | null;
  frontage_ft?: number | null;
  land_type?: string | null;
  floors?: number | null;
  parking_spaces?: number | null;
  year_built?: number | null;
  furnishing?: string | null;
  condition?: string | null;
  has_electricity?: boolean | null;
  water_source?: string | null;
  deed_type?: string | null;
  deed_note?: string | null;
  has_boundary_wall?: boolean | null;
  has_solar?: boolean | null;
  ac_ready?: boolean | null;
  video_url?: string | null;
  view_count: number;
  province_name?: string;
  district_name?: string;
  city_name?: string;
  images?: PropertyImage[];
  documents?: PropertyDocument[];
  amenities?: Amenity[];
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body?: string;
  icon: string;
  hero_image: string;
  sort_order: number;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  client_name?: string;
  sector: string;
  location: string;
  year_completed: number;
  scope?: string;
  body?: string;
  description?: string;
  cover_image: string;
  gallery_images?: string[];
  is_featured: boolean;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_location: string;
  quote: string;
  rating: number;
}

export interface LocationNode {
  id: number;
  name: string;
  districts?: LocationNode[];
  cities?: { id: number; name: string }[];
}
