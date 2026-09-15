-- Seed data per Appendix B (locations) plus sample content for local development / staging.

-- ---------- Provinces ----------
INSERT INTO provinces (name) VALUES
 ('Western'),('Central'),('Southern'),('Northern'),('Eastern'),
 ('North Western'),('North Central'),('Uva'),('Sabaragamuwa');

-- ---------- Districts ----------
INSERT INTO districts (province_id, name)
SELECT p.id, d.name FROM (VALUES
 ('Western','Colombo'),('Western','Gampaha'),('Western','Kalutara'),
 ('Central','Kandy'),('Central','Matale'),('Central','Nuwara Eliya'),
 ('Southern','Galle'),('Southern','Matara'),('Southern','Hambantota'),
 ('Northern','Jaffna'),('Northern','Kilinochchi'),('Northern','Mannar'),('Northern','Vavuniya'),('Northern','Mullaitivu'),
 ('Eastern','Batticaloa'),('Eastern','Ampara'),('Eastern','Trincomalee'),
 ('North Western','Kurunegala'),('North Western','Puttalam'),
 ('North Central','Anuradhapura'),('North Central','Polonnaruwa'),
 ('Uva','Badulla'),('Uva','Monaragala'),
 ('Sabaragamuwa','Ratnapura'),('Sabaragamuwa','Kegalle')
) AS d(province, name) JOIN provinces p ON p.name = d.province;

-- ---------- Cities (priority coverage per Appendix B) ----------
INSERT INTO cities (district_id, name)
SELECT d.id, c.name FROM (VALUES
 ('Colombo','Colombo 03'),('Colombo','Colombo 05'),('Colombo','Nugegoda'),('Colombo','Battaramulla'),('Colombo','Rajagiriya'),
 ('Gampaha','Negombo'),('Gampaha','Ja-Ela'),('Gampaha','Wattala'),('Gampaha','Gampaha'),
 ('Kalutara','Kalutara'),('Kalutara','Panadura'),('Kalutara','Beruwala'),
 ('Kandy','Kandy'),('Kandy','Peradeniya'),
 ('Galle','Galle'),('Galle','Unawatuna'),('Galle','Hikkaduwa'),
 ('Matara','Matara'),('Matara','Mirissa'),
 ('Hambantota','Hambantota'),('Hambantota','Tangalle')
) AS c(district, name) JOIN districts d ON d.name = c.district;

-- ---------- Admin user ----------
-- password: ChangeMe123!  (bcrypt cost 12) — rotate before go-live per NFR-SEC-006
INSERT INTO users (name, email, password_hash, role) VALUES
 ('System Administrator', 'admin@dharact.com',
  '$2b$12$IXWk3wqu.GpH7LdGTjd47.zkDa76HE53G2Kv1OLjBnH3xDzYwqc/6', 'ADMINISTRATOR')
ON CONFLICT DO NOTHING;

-- ---------- Settings ----------
INSERT INTO settings (key, value) VALUES
 ('contact', '{"phone":"+94763774551","email":"kosala@dharact.com","address":"No. 535/1B, Kakunagahalanda Waththa, Heiyanthuduwa, Sri Lanka"}'),
 ('social', '{"facebook":"","linkedin":"","instagram":"","pinterest":""}'),
 ('usd_rate', '{"rate": 300.00, "updated_manually": true}'),
 ('homepage_stats', '{"years_experience": 15, "completed_projects": 120, "trusted_clients": 300}'),
 ('notifications', '{"sales_inbox": "sales@dharact.com"}')
ON CONFLICT DO NOTHING;

-- ---------- Amenities ----------
INSERT INTO amenities (name, icon, applies_to) VALUES
 ('Swimming Pool','pool','{HOUSE,COMMERCIAL}'),
 ('Garden','garden','{HOUSE,LAND}'),
 ('Backup Generator','generator','{HOUSE,COMMERCIAL}'),
 ('CCTV','cctv','{HOUSE,COMMERCIAL}'),
 ('Servant Quarters','room','{HOUSE}'),
 ('Elevator','elevator','{COMMERCIAL}'),
 ('Parking','parking','{HOUSE,COMMERCIAL}'),
 ('Gym','gym','{COMMERCIAL,HOUSE}');

-- ---------- Services (matches §5.5 list) ----------
INSERT INTO services (slug, title, summary, body, icon, hero_image, sort_order) VALUES
 ('civil-construction','Civil Construction','Residential, commercial and industrial construction from foundation to finish.','Full civil construction service body...', 'construction', '/images/services/banner_image.webp', 1),
 ('tower-foundations','Tower Foundations & Substructures','Specialist foundation and substructure engineering for telecom and utility towers.','Body...', 'tower', '/images/services/RoadSafety.webp', 2),
 ('architectural-design','Architectural & Structural Design','Concept-to-construction architectural and structural design.','Body...', 'design', '/images/services/ArchitecturalDesign.webp', 3),
 ('mep','MEP Systems','Mechanical, electrical and plumbing engineering.','Body...', 'mep', '/images/services/homenetworking.webp', 4),
 ('interiors','Interior Design & Fit-Outs','Interior design and turnkey fit-outs.','Body...', 'interior', '/images/services/flooring.webp', 5),
 ('boq-estimation','BOQ & Cost Auditing','Bill of quantities preparation and independent cost auditing.','Body...', 'boq', '/images/services/BOQ.webp', 6),
 ('3d-visualization','3D Visualisation & Walkthroughs','Photoreal 3D visualisation and walkthroughs.','Body...', '3d', '/images/services/3Ddesign.webp', 7);

-- ---------- Projects ----------
INSERT INTO projects (slug, title, client_name, sector, location, year_completed, scope, cover_image, is_featured) VALUES
 ('serenity-villa','Serenity Villa','Private Client','Residential','Kandy',2024,'Full design & build','/images/projects/SerenityVilla.webp', true),
 ('skyline-residencies','Skyline Residencies','Skyline Developers','Residential','Colombo',2023,'Multi-unit residential complex','/images/projects/skylineResidencies.webp', true),
 ('ocean-view-residencies','Ocean View Residencies','Private Client','Residential','Galle',2023,'Beachfront residence','/images/projects/OceanViewResidencies.webp', true),
 ('riverside','Riverside','Private Client','Residential','Kalutara',2022,'Riverside villa','/images/projects/Riverside.webp', false),
 ('horizon-mall','Horizon Mall','Horizon Group','Commercial','Colombo',2022,'Retail complex','/images/projects/HorizonMall.webp', true),
 ('business-hub','Business Hub','Private Client','Commercial','Colombo',2021,'Office tower fit-out','/images/projects/busineesHub.webp', false);

-- ---------- Testimonials ----------
INSERT INTO testimonials (author_name, author_location, quote, rating, is_published, sort_order) VALUES
 ('K. Perera','Colombo','Dhara delivered our home exactly on schedule and on budget. Outstanding attention to detail.',5,true,1),
 ('S. Fernando','Galle','Professional team from the survey stage right through to handover.',5,true,2),
 ('N. Wickramasinghe','Kandy','Clear communication and honest advice throughout our land purchase.',4,true,3);

-- ---------- Sample properties ----------
-- Land for sale
INSERT INTO properties (
  reference_code, title, slug, category, listing_type, status, is_featured,
  short_description, description, price_lkr, price_unit, is_negotiable,
  province_id, district_id, city_id, show_exact_location, latitude, longitude,
  land_extent_perches, land_shape, road_access_ft, road_surface, land_type, deed_type,
  meta_title, meta_description, created_by, updated_by, published_at
) SELECT
  'DHR-L-0001','Prime Residential Land in Gampaha','prime-residential-land-gampaha','LAND','SALE','PUBLISHED', true,
  'A well-located 20-perch residential block with clear deed and full road access.',
  'Full description of the residential land parcel, suitable for a new home build...',
  8500000,'TOTAL', true,
  p.id, d.id, c.id, false, 7.0917, 79.9990,
  20.00,'Rectangular',20,'CARPETED','RESIDENTIAL','CLEAR_DEED',
  'Prime Residential Land in Gampaha | Dhara','20-perch clear-deed residential land in Gampaha, ready to build.',
  u.id, u.id, now()
FROM provinces p, districts d, cities c, users u
WHERE p.name='Western' AND d.name='Gampaha' AND c.name='Gampaha' AND u.email='admin@dharact.com'
LIMIT 1;

-- House for sale
INSERT INTO properties (
  reference_code, title, slug, category, listing_type, status, is_featured,
  short_description, description, price_lkr, price_unit, is_negotiable,
  province_id, district_id, city_id, show_exact_location, latitude, longitude,
  built_area_sqft, bedrooms, bathrooms, floors, parking_spaces, year_built, furnishing, condition,
  deed_type, meta_title, meta_description, created_by, updated_by, published_at
) SELECT
  'DHR-H-0001','Modern Two-Storey House in Kandy','modern-two-storey-house-kandy','HOUSE','SALE','PUBLISHED', true,
  'A modern 4-bedroom two-storey house with mountain views and secure parking.',
  'Full description of the house...',
  42000000,'TOTAL', false,
  p.id, d.id, c.id, true, 7.2906, 80.6337,
  2800, 4, 3, 2, 2, 2023, 'SEMI_FURNISHED','NEW',
  'CLEAR_DEED','Modern Two-Storey House in Kandy | Dhara','4-bed modern house for sale in Kandy with mountain views.',
  u.id, u.id, now()
FROM provinces p, districts d, cities c, users u
WHERE p.name='Central' AND d.name='Kandy' AND c.name='Kandy' AND u.email='admin@dharact.com'
LIMIT 1;

-- House for rent
INSERT INTO properties (
  reference_code, title, slug, category, listing_type, status, is_featured,
  short_description, description, price_lkr, price_unit, is_negotiable,
  rent_period, minimum_lease_months, advance_months, deposit_lkr,
  province_id, district_id, city_id, show_exact_location, latitude, longitude,
  built_area_sqft, bedrooms, bathrooms, floors, parking_spaces, furnishing, condition,
  meta_title, meta_description, created_by, updated_by, published_at
) SELECT
  'DHR-H-0002-R','Furnished House for Rent in Colombo 05','furnished-house-rent-colombo-05','HOUSE','RENT','PUBLISHED', false,
  'Fully furnished 3-bedroom house for rent, close to schools and amenities.',
  'Full description...',
  185000,'PER_MONTH', false,
  'MONTHLY', 12, 3, 555000,
  p.id, d.id, c.id, false, 6.8845, 79.8675,
  2200, 3, 2, 1, 1, 'FULLY_FURNISHED','USED',
  'House for Rent in Colombo 05 | Dhara','Furnished 3-bed house for rent in Colombo 05.',
  u.id, u.id, now()
FROM provinces p, districts d, cities c, users u
WHERE p.name='Western' AND d.name='Colombo' AND c.name='Colombo 05' AND u.email='admin@dharact.com'
LIMIT 1;

-- Commercial for rent
INSERT INTO properties (
  reference_code, title, slug, category, listing_type, status, is_featured,
  short_description, description, price_lkr, price_unit, is_negotiable,
  rent_period, minimum_lease_months, advance_months, deposit_lkr,
  province_id, district_id, city_id, show_exact_location, latitude, longitude,
  built_area_sqft, floors, parking_spaces, furnishing, condition,
  meta_title, meta_description, created_by, updated_by, published_at
) SELECT
  'DHR-C-0001-R','Commercial Space for Rent in Colombo 03','commercial-space-rent-colombo-03','COMMERCIAL','RENT','PUBLISHED', true,
  'Ground-floor commercial unit suited to retail or a showroom, prime frontage.',
  'Full description...',
  450000,'PER_MONTH', true,
  'MONTHLY', 24, 6, 2700000,
  p.id, d.id, c.id, true, 6.9147, 79.8467,
  3200, 1, 4, 'UNFURNISHED','USED',
  'Commercial Space for Rent in Colombo 03 | Dhara','3,200 sqft commercial unit for rent in Colombo 03.',
  u.id, u.id, now()
FROM provinces p, districts d, cities c, users u
WHERE p.name='Western' AND d.name='Colombo' AND c.name='Colombo 03' AND u.email='admin@dharact.com'
LIMIT 1;

-- Cover images for the seeded properties (required before publish per FR-ADM-004)
INSERT INTO property_images (property_id, url, alt_text, sort_order, is_cover)
SELECT id, '/images/projects/goldenVilla.webp', title, 0, true FROM properties WHERE reference_code='DHR-L-0001';
INSERT INTO property_images (property_id, url, alt_text, sort_order, is_cover)
SELECT id, '/images/projects/SerenityVilla.webp', title, 0, true FROM properties WHERE reference_code='DHR-H-0001';
INSERT INTO property_images (property_id, url, alt_text, sort_order, is_cover)
SELECT id, '/images/projects/Riverside.webp', title, 0, true FROM properties WHERE reference_code='DHR-H-0002-R';
INSERT INTO property_images (property_id, url, alt_text, sort_order, is_cover)
SELECT id, '/images/projects/HorizonMall.webp', title, 0, true FROM properties WHERE reference_code='DHR-C-0001-R';

UPDATE properties p SET cover_image_id = pi.id
FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = true;
