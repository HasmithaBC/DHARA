-- Dhara Construction & Technology platform — schema v4.0
-- Maps to SRS §4 Data Model. Run against PostgreSQL 15+.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------- Enums ----------
CREATE TYPE property_category   AS ENUM ('LAND','HOUSE','COMMERCIAL');
CREATE TYPE listing_type        AS ENUM ('SALE','RENT');
CREATE TYPE property_status     AS ENUM ('DRAFT','PUBLISHED','RESERVED','SOLD','RENTED','ARCHIVED');
CREATE TYPE price_unit          AS ENUM ('TOTAL','PER_PERCH','PER_MONTH','PER_YEAR');
CREATE TYPE rent_period         AS ENUM ('MONTHLY','ANNUAL');
CREATE TYPE road_surface        AS ENUM ('CARPETED','CONCRETE','GRAVEL','NONE');
CREATE TYPE land_type           AS ENUM ('RESIDENTIAL','AGRICULTURAL','COMMERCIAL','BEACHFRONT','HILLSIDE','SUBDIVISION_PLOT');
CREATE TYPE furnishing_type     AS ENUM ('UNFURNISHED','SEMI_FURNISHED','FULLY_FURNISHED');
CREATE TYPE condition_type      AS ENUM ('NEW','USED','SEMI_FINISHED','UNDER_CONSTRUCTION');
CREATE TYPE water_source_type   AS ENUM ('MAINS','WELL','BOTH','NONE');
CREATE TYPE deed_type           AS ENUM ('CLEAR_DEED','BIM_SAVIYA','LEASEHOLD','OTHER');
CREATE TYPE document_type       AS ENUM ('SURVEY_PLAN','FLOOR_PLAN','BROCHURE','APPROVAL','OTHER');
CREATE TYPE document_access     AS ENUM ('PUBLIC','GATED','INTERNAL');
CREATE TYPE lead_type           AS ENUM ('PROPERTY_INQUIRY','SITE_INSPECTION','GENERAL_CONTACT','SERVICE_CONSULTATION','DOCUMENT_DOWNLOAD','NEWSLETTER');
CREATE TYPE lead_status         AS ENUM ('NEW','CONTACTED','SITE_VISIT_SCHEDULED','NEGOTIATING','CLOSED_WON','CLOSED_LOST');
CREATE TYPE inspection_slot     AS ENUM ('MORNING','AFTERNOON','EVENING');
CREATE TYPE user_role           AS ENUM ('SALES_MANAGER','CONTENT_EDITOR','ADMINISTRATOR');

-- ---------- Location ----------
CREATE TABLE provinces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE districts (
  id SERIAL PRIMARY KEY,
  province_id INT NOT NULL REFERENCES provinces(id),
  name VARCHAR(60) NOT NULL,
  UNIQUE(province_id, name)
);

CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  district_id INT NOT NULL REFERENCES districts(id),
  name VARCHAR(80) NOT NULL,
  UNIQUE(district_id, name)
);

-- ---------- Users / RBAC ----------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Amenities ----------
CREATE TABLE amenities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  icon VARCHAR(80),
  applies_to property_category[] NOT NULL DEFAULT '{}'
);

-- ---------- Property (core entity, SRS §4.2) ----------
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code VARCHAR(24) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  category property_category NOT NULL,
  listing_type listing_type NOT NULL,
  status property_status NOT NULL DEFAULT 'DRAFT',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  short_description VARCHAR(300) NOT NULL,
  description TEXT NOT NULL DEFAULT '',

  price_lkr NUMERIC(15,2),
  price_on_request BOOLEAN NOT NULL DEFAULT false,
  price_unit price_unit,
  is_negotiable BOOLEAN NOT NULL DEFAULT false,

  rent_period rent_period,
  minimum_lease_months INT,
  advance_months INT,
  deposit_lkr NUMERIC(15,2),

  province_id INT NOT NULL REFERENCES provinces(id),
  district_id INT NOT NULL REFERENCES districts(id),
  city_id INT NOT NULL REFERENCES cities(id),
  address_line VARCHAR(255),
  show_exact_location BOOLEAN NOT NULL DEFAULT false,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,

  land_extent_perches NUMERIC(10,2),
  land_shape VARCHAR(40),
  road_access_ft INT,
  road_surface road_surface,
  frontage_ft INT,
  land_type land_type,

  built_area_sqft INT,
  bedrooms INT,
  bathrooms INT,
  floors INT,
  parking_spaces INT,
  year_built INT,
  furnishing furnishing_type,
  condition condition_type,

  has_electricity BOOLEAN,
  water_source water_source_type,
  deed_type deed_type,
  deed_note VARCHAR(255),
  has_boundary_wall BOOLEAN,
  has_solar BOOLEAN,
  ac_ready BOOLEAN,

  cover_image_id UUID,
  video_url VARCHAR(255),
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),

  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  view_count INT NOT NULL DEFAULT 0,

  CONSTRAINT chk_land_extent CHECK (category <> 'LAND' OR land_extent_perches IS NOT NULL),
  CONSTRAINT chk_built_area CHECK (category = 'LAND' OR built_area_sqft IS NOT NULL),
  CONSTRAINT chk_rent_period CHECK (listing_type <> 'RENT' OR rent_period IS NOT NULL),
  CONSTRAINT chk_price CHECK (price_on_request = true OR price_lkr IS NOT NULL),
  CONSTRAINT chk_latlng CHECK (latitude BETWEEN 5.9 AND 9.9 AND longitude BETWEEN 79.5 AND 81.9)
);

CREATE INDEX idx_properties_search ON properties (status, category, listing_type);
CREATE INDEX idx_properties_location ON properties (district_id, city_id);
CREATE INDEX idx_properties_price ON properties (price_lkr);
CREATE INDEX idx_properties_extent ON properties (land_extent_perches);
CREATE INDEX idx_properties_beds ON properties (bedrooms);
CREATE INDEX idx_properties_title_trgm ON properties USING GIN (title gin_trgm_ops);

CREATE TABLE property_amenities (
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id INT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, amenity_id)
);

CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(200) NOT NULL,
  caption VARCHAR(200),
  sort_order INT NOT NULL DEFAULT 0,
  width INT, height INT,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE properties ADD CONSTRAINT fk_cover_image FOREIGN KEY (cover_image_id) REFERENCES property_images(id);

CREATE TABLE property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  title VARCHAR(160) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT,
  access document_access NOT NULL DEFAULT 'PUBLIC',
  is_watermarked BOOLEAN NOT NULL DEFAULT false,
  download_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Leads (§4.6) ----------
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_type lead_type NOT NULL,
  property_id UUID REFERENCES properties(id),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  whatsapp_same_as_phone BOOLEAN NOT NULL DEFAULT true,
  message TEXT,
  offer_amount_lkr NUMERIC(15,2),
  preferred_inspection_date DATE,
  preferred_inspection_slot inspection_slot,
  status lead_status NOT NULL DEFAULT 'NEW',
  assigned_to UUID REFERENCES users(id),
  internal_notes TEXT,
  source_url VARCHAR(500),
  utm_source VARCHAR(120), utm_medium VARCHAR(120), utm_campaign VARCHAR(120),
  ip_address VARCHAR(64),
  user_agent VARCHAR(255),
  consent_given_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_property ON leads(property_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_type ON leads(lead_type);
CREATE INDEX idx_leads_created ON leads(created_at);

-- ---------- Corporate content ----------
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  summary VARCHAR(300),
  body TEXT,
  icon VARCHAR(80),
  hero_image VARCHAR(500),
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  meta_title VARCHAR(60), meta_description VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(160) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  client_name VARCHAR(160),
  sector VARCHAR(60),
  location VARCHAR(160),
  year_completed INT,
  scope TEXT, challenge TEXT, solution TEXT, body TEXT,
  cover_image VARCHAR(500),
  gallery JSONB NOT NULL DEFAULT '[]',
  boq_metrics JSONB NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  meta_title VARCHAR(60), meta_description VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_name VARCHAR(120) NOT NULL,
  author_location VARCHAR(120),
  related_service_id UUID REFERENCES services(id),
  related_property_id UUID REFERENCES properties(id),
  quote TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE settings (
  key VARCHAR(80) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(160) NOT NULL UNIQUE,
  token VARCHAR(64) NOT NULL,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(60) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  diff JSONB,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
