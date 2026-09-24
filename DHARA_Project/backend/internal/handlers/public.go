package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/dharact/backend/internal/config"
	"github.com/dharact/backend/internal/httpx"
	"github.com/dharact/backend/internal/models"
	"github.com/dharact/backend/internal/util"
	"github.com/go-chi/chi/v5"
)

type PublicHandler struct {
	DB  *sql.DB
	Cfg *config.Config
}

func NewPublicHandler(db *sql.DB, cfg *config.Config) *PublicHandler {
	return &PublicHandler{DB: db, Cfg: cfg}
}

// GET /api/v1/properties — FR-LST-001..010: segmented, filtered, sorted, paginated search.
func (h *PublicHandler) ListProperties(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	where := []string{"p.status = 'PUBLISHED'"}
	args := []interface{}{}
	add := func(cond string, val interface{}) {
		args = append(args, val)
		where = append(where, fmt.Sprintf(cond, len(args)))
	}

	if v := q.Get("category"); v != "" {
		add("p.category = $%d", strings.ToUpper(v))
	}
	if v := q.Get("type"); v != "" {
		add("p.listing_type = $%d", strings.ToUpper(v))
	}
	if v := q.Get("province"); v != "" {
		add("pr.name = $%d", v)
	}
	if v := q.Get("district"); v != "" {
		add("d.name = $%d", v)
	}
	if v := q.Get("city"); v != "" {
		add("c.name = $%d", v)
	}
	if v := q.Get("price_min"); v != "" {
		add("p.price_lkr >= $%d", v)
	}
	if v := q.Get("price_max"); v != "" {
		add("p.price_lkr <= $%d", v)
	}
	if v := q.Get("perches_min"); v != "" {
		add("p.land_extent_perches >= $%d", v)
	}
	if v := q.Get("perches_max"); v != "" {
		add("p.land_extent_perches <= $%d", v)
	}
	if v := q.Get("sqft_min"); v != "" {
		add("p.built_area_sqft >= $%d", v)
	}
	if v := q.Get("sqft_max"); v != "" {
		add("p.built_area_sqft <= $%d", v)
	}
	if v := q.Get("beds"); v != "" {
		if v == "5" {
			add("p.bedrooms >= $%d", 5)
		} else {
			add("p.bedrooms = $%d", v)
		}
	}
	if v := q.Get("baths"); v != "" {
		add("p.bathrooms = $%d", v)
	}
	if v := q.Get("furnishing"); v != "" {
		add("p.furnishing = $%d", strings.ToUpper(v))
	}
	if q.Get("featured") == "true" {
		where = append(where, "p.is_featured = true")
	}
	if v := q.Get("q"); v != "" {
		args = append(args, v, "%"+v+"%")
		where = append(where, fmt.Sprintf(
			"(p.reference_code = $%d OR p.title ILIKE $%d OR p.short_description ILIKE $%d OR c.name ILIKE $%d OR d.name ILIKE $%d)",
			len(args)-1, len(args), len(args), len(args), len(args)))
	}

	sortCol := "p.created_at DESC"
	switch q.Get("sort") {
	case "price_asc":
		sortCol = "p.price_on_request ASC, p.price_lkr ASC"
	case "price_desc":
		sortCol = "p.price_on_request ASC, p.price_lkr DESC"
	case "extent":
		sortCol = "p.land_extent_perches DESC NULLS LAST"
	case "built_area":
		sortCol = "p.built_area_sqft DESC NULLS LAST"
	}

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(q.Get("per_page"))
	if perPage < 1 || perPage > 50 {
		perPage = 12
	}
	offset := (page - 1) * perPage

	whereSQL := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf(`
		SELECT count(*) FROM properties p
		JOIN provinces pr ON pr.id = p.province_id
		JOIN districts d ON d.id = p.district_id
		JOIN cities c ON c.id = p.city_id
		WHERE %s`, whereSQL)
	if err := h.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to count properties", nil)
		return
	}

	args = append(args, perPage, offset)
	listQuery := fmt.Sprintf(`
		SELECT p.id, p.reference_code, p.title, p.slug, p.category, p.listing_type, p.status,
		       p.is_featured, p.short_description, p.price_lkr, p.price_on_request, p.price_unit,
		       p.land_extent_perches, p.built_area_sqft, p.bedrooms, p.bathrooms,
		       c.name, d.name,
		       COALESCE((SELECT url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover LIMIT 1), '')
		FROM properties p
		JOIN provinces pr ON pr.id = p.province_id
		JOIN districts d ON d.id = p.district_id
		JOIN cities c ON c.id = p.city_id
		WHERE %s
		ORDER BY %s
		LIMIT $%d OFFSET $%d`, whereSQL, sortCol, len(args)-1, len(args))

	rows, err := h.DB.Query(listQuery, args...)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to search properties", nil)
		return
	}
	defer rows.Close()

	results := []models.Property{}
	for rows.Next() {
		var p models.Property
		if err := rows.Scan(&p.ID, &p.ReferenceCode, &p.Title, &p.Slug, &p.Category, &p.ListingType,
			&p.Status, &p.IsFeatured, &p.ShortDescription, &p.PriceLKR, &p.PriceOnRequest, &p.PriceUnit,
			&p.LandExtentPerches, &p.BuiltAreaSqft, &p.Bedrooms, &p.Bathrooms, &p.City, &p.District, &p.CoverURL); err != nil {
			continue
		}
		results = append(results, p)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate properties", nil)
		return
	}

	totalPages := (total + perPage - 1) / perPage
	httpx.JSONList(w, 200, results, httpx.Meta{Page: page, PerPage: perPage, Total: total, TotalPages: totalPages})
}

// GET /api/v1/properties/{slug} — FR-PRP: full detail with images/documents/amenities.
func (h *PublicHandler) GetProperty(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	var p models.Property
	err := h.DB.QueryRow(`
		SELECT p.id, p.reference_code, p.title, p.slug, p.category, p.listing_type, p.status,
		       p.is_featured, p.short_description, p.description,
		       p.price_lkr, p.price_on_request, p.price_unit, p.is_negotiable,
		       p.rent_period, p.minimum_lease_months, p.advance_months, p.deposit_lkr,
		       p.address_line, p.show_exact_location,
		       CASE WHEN p.show_exact_location THEN p.latitude ELSE round(p.latitude::numeric,2) END,
		       CASE WHEN p.show_exact_location THEN p.longitude ELSE round(p.longitude::numeric,2) END,
		       p.land_extent_perches, p.land_shape, p.road_access_ft, p.road_surface, p.frontage_ft, p.land_type,
		       p.built_area_sqft, p.bedrooms, p.bathrooms, p.floors, p.parking_spaces, p.year_built,
		       p.furnishing, p.condition, p.has_electricity, p.water_source, p.deed_type, p.deed_note,
		       p.has_boundary_wall, p.has_solar, p.ac_ready, p.video_url, p.meta_title, p.meta_description,
		       p.view_count, pr.name, d.name, c.name
		FROM properties p
		JOIN provinces pr ON pr.id = p.province_id
		JOIN districts d ON d.id = p.district_id
		JOIN cities c ON c.id = p.city_id
		WHERE p.slug = $1 AND p.status <> 'DRAFT' AND p.status <> 'ARCHIVED'`, slug).Scan(
		&p.ID, &p.ReferenceCode, &p.Title, &p.Slug, &p.Category, &p.ListingType, &p.Status,
		&p.IsFeatured, &p.ShortDescription, &p.Description,
		&p.PriceLKR, &p.PriceOnRequest, &p.PriceUnit, &p.IsNegotiable,
		&p.RentPeriod, &p.MinimumLeaseMonths, &p.AdvanceMonths, &p.DepositLKR,
		&p.AddressLine, &p.ShowExactLocation, &p.Latitude, &p.Longitude,
		&p.LandExtentPerches, &p.LandShape, &p.RoadAccessFt, &p.RoadSurface, &p.FrontageFt, &p.LandType,
		&p.BuiltAreaSqft, &p.Bedrooms, &p.Bathrooms, &p.Floors, &p.ParkingSpaces, &p.YearBuilt,
		&p.Furnishing, &p.Condition, &p.HasElectricity, &p.WaterSource, &p.DeedType, &p.DeedNote,
		&p.HasBoundaryWall, &p.HasSolar, &p.ACReady, &p.VideoURL, &p.MetaTitle, &p.MetaDescription,
		&p.ViewCount, &p.Province, &p.District, &p.City,
	)
	if err == sql.ErrNoRows {
		// ARCHIVED listings return 410 Gone per §4.3 / NFR-SEO-008
		var archived bool
		h.DB.QueryRow(`SELECT true FROM properties WHERE slug=$1 AND status='ARCHIVED'`, slug).Scan(&archived)
		if archived {
			httpx.Error(w, 410, "GONE", "This listing is no longer available", nil)
			return
		}
		httpx.Error(w, 404, "NOT_FOUND", "Property not found", nil)
		return
	} else if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load property", nil)
		return
	}

	imgRows, err := h.DB.Query(`SELECT id, url, alt_text, sort_order, is_cover FROM property_images WHERE property_id=$1 ORDER BY sort_order`, p.ID)
	if err == nil {
		for imgRows.Next() {
			var img models.PropertyImage
			imgRows.Scan(&img.ID, &img.URL, &img.AltText, &img.SortOrder, &img.IsCover)
			p.Images = append(p.Images, img)
		}
		_ = imgRows.Err()
		imgRows.Close()
	}

	docRows, err := h.DB.Query(`SELECT id, type, title, access, is_watermarked FROM property_documents WHERE property_id=$1 AND access <> 'INTERNAL'`, p.ID)
	if err == nil {
		for docRows.Next() {
			var d models.PropertyDocument
			docRows.Scan(&d.ID, &d.Type, &d.Title, &d.Access, &d.IsWatermarked)
			p.Docs = append(p.Docs, d)
		}
		_ = docRows.Err()
		docRows.Close()
	}

	amRows, err := h.DB.Query(`
		SELECT a.id, a.name, a.icon FROM amenities a
		JOIN property_amenities pa ON pa.amenity_id = a.id WHERE pa.property_id=$1`, p.ID)
	if err == nil {
		for amRows.Next() {
			var a models.Amenity
			amRows.Scan(&a.ID, &a.Name, &a.Icon)
			p.Amenities = append(p.Amenities, a)
		}
		_ = amRows.Err()
		amRows.Close()
	}

	if p.LandExtentPerches != nil {
		p.MetaDescription = strPtr(util.LandExtentDisplay(*p.LandExtentPerches))
	}

	httpx.JSON(w, 200, p)
}

// POST /api/v1/properties/{id}/view — FR-PUB view counter (debounce is handled client-side, 1/session).
func (h *PublicHandler) IncrementView(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.DB.Exec(`UPDATE properties SET view_count = view_count + 1 WHERE id = $1`, id)
	if err != nil {
		httpx.Error(w, 404, "NOT_FOUND", "Property not found", nil)
		return
	}
	httpx.JSON(w, 200, map[string]bool{"ok": true})
}

// GET /api/v1/properties/{id}/similar — FR-PRP-010.
func (h *PublicHandler) SimilarProperties(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	limit := 4
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil {
			limit = n
		}
	}
	rows, err := h.DB.Query(`
		SELECT p2.id, p2.reference_code, p2.title, p2.slug, p2.category, p2.listing_type,
		       p2.short_description, p2.price_lkr, p2.price_on_request, c.name, d.name,
		       COALESCE((SELECT url FROM property_images pi WHERE pi.property_id=p2.id AND pi.is_cover LIMIT 1),'')
		FROM properties p1
		JOIN properties p2 ON p2.category = p1.category AND p2.district_id = p1.district_id AND p2.id <> p1.id
		JOIN cities c ON c.id = p2.city_id
		JOIN districts d ON d.id = p2.district_id
		WHERE p1.id = $1 AND p2.status = 'PUBLISHED'
		  AND (p1.price_lkr IS NULL OR p2.price_lkr IS NULL OR
		       p2.price_lkr BETWEEN p1.price_lkr * 0.7 AND p1.price_lkr * 1.3)
		LIMIT $2`, id, limit)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load similar properties", nil)
		return
	}
	defer rows.Close()
	results := []models.Property{}
	for rows.Next() {
		var p models.Property
		rows.Scan(&p.ID, &p.ReferenceCode, &p.Title, &p.Slug, &p.Category, &p.ListingType,
			&p.ShortDescription, &p.PriceLKR, &p.PriceOnRequest, &p.City, &p.District, &p.CoverURL)
		results = append(results, p)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate similar properties", nil)
		return
	}
	httpx.JSON(w, 200, results)
}

// GET /api/v1/locations — Province → District → City tree (Appendix B).
func (h *PublicHandler) Locations(w http.ResponseWriter, r *http.Request) {
	type cityJSON struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	}
	type districtJSON struct {
		ID     int        `json:"id"`
		Name   string     `json:"name"`
		Cities []cityJSON `json:"cities"`
	}
	type provinceJSON struct {
		ID        int            `json:"id"`
		Name      string         `json:"name"`
		Districts []districtJSON `json:"districts"`
	}

	provinces := []provinceJSON{}
	pRows, err := h.DB.Query(`SELECT id, name FROM provinces ORDER BY name`)
	if err == nil {
		for pRows.Next() {
			var pv provinceJSON
			pRows.Scan(&pv.ID, &pv.Name)
			dRows, err := h.DB.Query(`SELECT id, name FROM districts WHERE province_id=$1 ORDER BY name`, pv.ID)
			if err == nil {
				for dRows.Next() {
					var d districtJSON
					dRows.Scan(&d.ID, &d.Name)
					cRows, err := h.DB.Query(`SELECT id, name FROM cities WHERE district_id=$1 ORDER BY name`, d.ID)
					if err == nil {
						for cRows.Next() {
							var c cityJSON
							cRows.Scan(&c.ID, &c.Name)
							d.Cities = append(d.Cities, c)
						}
						_ = cRows.Err()
						cRows.Close()
					}
					pv.Districts = append(pv.Districts, d)
				}
				_ = dRows.Err()
				dRows.Close()
			}
			provinces = append(provinces, pv)
		}
		_ = pRows.Err()
		pRows.Close()
	}
	httpx.JSON(w, 200, provinces)
}

func (h *PublicHandler) Amenities(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, name, icon FROM amenities ORDER BY name`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load amenities", nil)
		return
	}
	defer rows.Close()
	out := []models.Amenity{}
	for rows.Next() {
		var a models.Amenity
		rows.Scan(&a.ID, &a.Name, &a.Icon)
		out = append(out, a)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate amenities", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

func (h *PublicHandler) ListServices(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, slug, title, summary, icon, hero_image, sort_order FROM services WHERE is_published ORDER BY sort_order`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load services", nil)
		return
	}
	defer rows.Close()
	out := []models.Service{}
	for rows.Next() {
		var s models.Service
		rows.Scan(&s.ID, &s.Slug, &s.Title, &s.Summary, &s.Icon, &s.HeroImage, &s.SortOrder)
		out = append(out, s)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate services", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

func (h *PublicHandler) GetService(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	var s models.Service
	err := h.DB.QueryRow(`SELECT id, slug, title, summary, body, icon, hero_image, sort_order FROM services WHERE slug=$1 AND is_published`, slug).
		Scan(&s.ID, &s.Slug, &s.Title, &s.Summary, &s.Body, &s.Icon, &s.HeroImage, &s.SortOrder)
	if err == sql.ErrNoRows {
		httpx.Error(w, 404, "NOT_FOUND", "Service not found", nil)
		return
	}
	httpx.JSON(w, 200, s)
}

func (h *PublicHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	where := []string{"is_published = true"}
	args := []interface{}{}
	if v := r.URL.Query().Get("sector"); v != "" {
		args = append(args, v)
		where = append(where, fmt.Sprintf("sector = $%d", len(args)))
	}
	rows, err := h.DB.Query(fmt.Sprintf(`SELECT id, slug, title, sector, location, year_completed, cover_image, is_featured
		FROM projects WHERE %s ORDER BY year_completed DESC`, strings.Join(where, " AND ")), args...)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load projects", nil)
		return
	}
	defer rows.Close()
	out := []models.Project{}
	for rows.Next() {
		var p models.Project
		rows.Scan(&p.ID, &p.Slug, &p.Title, &p.Sector, &p.Location, &p.YearCompleted, &p.CoverImage, &p.IsFeatured)
		out = append(out, p)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate projects", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

func (h *PublicHandler) GetProject(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	var p models.Project
	err := h.DB.QueryRow(`SELECT id, slug, title, client_name, sector, location, year_completed, scope, body, cover_image, is_featured
		FROM projects WHERE slug=$1 AND is_published`, slug).
		Scan(&p.ID, &p.Slug, &p.Title, &p.ClientName, &p.Sector, &p.Location, &p.YearCompleted, &p.Scope, &p.Body, &p.CoverImage, &p.IsFeatured)
	if err == sql.ErrNoRows {
		httpx.Error(w, 404, "NOT_FOUND", "Project not found", nil)
		return
	}
	httpx.JSON(w, 200, p)
}

func (h *PublicHandler) Testimonials(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, author_name, author_location, quote, rating FROM testimonials WHERE is_published ORDER BY sort_order`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load testimonials", nil)
		return
	}
	defer rows.Close()
	out := []models.Testimonial{}
	for rows.Next() {
		var t models.Testimonial
		rows.Scan(&t.ID, &t.AuthorName, &t.AuthorLocation, &t.Quote, &t.Rating)
		out = append(out, t)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate testimonials", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

// publicSettingsAllowlist restricts /settings/public to keys that are safe to expose to
// visitors (contact details, socials, display currency rate, homepage stats). Internal
// operational settings such as the sales notification inbox must stay admin-only.
var publicSettingsAllowlist = map[string]bool{
	"contact":        true,
	"social":         true,
	"usd_rate":       true,
	"homepage_stats": true,
	"footer":         true,
	"why_dhara":      true,
}

func (h *PublicHandler) PublicSettings(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT key, value FROM settings`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load settings", nil)
		return
	}
	defer rows.Close()
	out := map[string]interface{}{}
	for rows.Next() {
		var key string
		var raw []byte
		rows.Scan(&key, &raw)
		if publicSettingsAllowlist[key] {
			out[key] = string(raw)
		}
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate settings", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

// --- Leads (§4.6, §5.4, §6.1) ---

type leadRequest struct {
	LeadType                string   `json:"lead_type"`
	PropertyID              *string  `json:"property_id"`
	Name                    string   `json:"name"`
	Email                   string   `json:"email"`
	Phone                   string   `json:"phone"`
	Message                 string   `json:"message"`
	OfferAmountLKR          *float64 `json:"offer_amount_lkr"`
	PreferredInspectionDate *string  `json:"preferred_inspection_date"`
	PreferredInspectionSlot *string  `json:"preferred_inspection_slot"`
	SourceURL               string   `json:"source_url"`
	UTMSource               string   `json:"utm_source"`
	UTMMedium               string   `json:"utm_medium"`
	UTMCampaign             string   `json:"utm_campaign"`
	Consent                 bool     `json:"consent"`
	TurnstileToken          string   `json:"turnstile_token"`
	Honeypot                string   `json:"website"` // honeypot field, must stay empty (NFR-SEC-002)
}

// POST /api/v1/leads — FR-INQ-001/002/004/006/007/008/009.
func (h *PublicHandler) CreateLead(w http.ResponseWriter, r *http.Request) {
	var req leadRequest
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}

	fields := map[string]string{}
	if req.Honeypot != "" {
		// Silently accept-but-drop bot submissions rather than revealing the honeypot.
		httpx.JSON(w, 201, map[string]string{"status": "received"})
		return
	}
	if len(req.Name) < 2 || len(req.Name) > 100 {
		fields["name"] = "Name must be 2-100 characters"
	}
	if !strings.Contains(req.Email, "@") {
		fields["email"] = "A valid email is required"
	}
	phone, err := util.NormalizePhone(req.Phone)
	if err != nil {
		fields["phone"] = "A valid Sri Lankan phone number is required"
	}
	if !req.Consent {
		fields["consent"] = "Consent to the Privacy Policy is required"
	}
	if req.PreferredInspectionDate != nil {
		d, derr := time.Parse("2006-01-02", *req.PreferredInspectionDate)
		if derr != nil || d.Before(time.Now().Truncate(24*time.Hour).Add(24*time.Hour)) || d.After(time.Now().AddDate(0, 0, 90)) {
			fields["preferred_inspection_date"] = "Date must be between tomorrow and 90 days from now"
		}
	}
	if len(fields) > 0 {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Please correct the highlighted fields", fields)
		return
	}

	// NFRSEC-002 / FR-INQ-008: verify the invisible CAPTCHA token whenever Turnstile is
	// configured. In local/dev environments without a Turnstile secret, verification is
	// skipped so the form remains usable — this matches how Cloudflare recommends staging
	// Turnstile behind an env flag.
	if h.Cfg.TurnstileSecret != "" && !verifyTurnstile(h.Cfg.TurnstileSecret, req.TurnstileToken, clientIPFromRequest(r)) {
		httpx.Error(w, 403, "FORBIDDEN", "Bot verification failed, please try again", nil)
		return
	}

	now := time.Now()
	var id string
	err = h.DB.QueryRow(`
		INSERT INTO leads (lead_type, property_id, name, email, phone, message, offer_amount_lkr,
			preferred_inspection_date, preferred_inspection_slot, source_url, utm_source, utm_medium,
			utm_campaign, ip_address, user_agent, consent_given_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
		req.LeadType, req.PropertyID, req.Name, req.Email, phone, req.Message, req.OfferAmountLKR,
		req.PreferredInspectionDate, req.PreferredInspectionSlot, req.SourceURL, req.UTMSource, req.UTMMedium,
		req.UTMCampaign, clientIPFromRequest(r), r.UserAgent(), now).Scan(&id)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to save your inquiry", nil)
		return
	}

	// FR-NOT-001/002: notify sales inbox + acknowledge inquirer (real SendGrid send once
	// SENDGRID_API_KEY is configured; logs otherwise — see internal/handlers/mailer.go).
	var propertyTitle, propertyRef string
	if req.PropertyID != nil {
		h.DB.QueryRow(`SELECT title, reference_code FROM properties WHERE id=$1`, *req.PropertyID).Scan(&propertyTitle, &propertyRef)
	}
	notification := leadNotification{
		LeadID: id, LeadType: req.LeadType, Name: req.Name, Email: req.Email, Phone: phone,
		Message: req.Message, PropertyTitle: propertyTitle, PropertyRefCode: propertyRef, OfferAmountLKR: req.OfferAmountLKR,
	}
	go NotifyNewLead(h.Cfg, notification)

	// FR-NOT-005 (P2): optional WhatsApp Business API ping for high-intent leads.
	if isHighIntent(h.Cfg, req.LeadType, req.OfferAmountLKR) {
		go notifyWhatsAppHighIntent(h.Cfg, fmt.Sprintf("High-intent lead: %s (%s) — %s %s", req.Name, phone, friendlyLeadType(req.LeadType), refAndTitleSuffix(propertyRef, propertyTitle)))
	}

	httpx.JSON(w, 201, map[string]string{"status": "received", "id": id})
}

type documentRequestBody struct {
	Name           string `json:"name"`
	Phone          string `json:"phone"`
	Email          string `json:"email"`
	TurnstileToken string `json:"turnstile_token"`
}

// POST /api/v1/documents/{id}/request — FR-PRP-007 / FR-INQ-005: gated document mini-form.
func (h *PublicHandler) RequestDocument(w http.ResponseWriter, r *http.Request) {
	docID := chi.URLParam(r, "id")
	var req documentRequestBody
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	phone, err := util.NormalizePhone(req.Phone)
	if err != nil || req.Name == "" || !strings.Contains(req.Email, "@") {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Name, phone and email are required", nil)
		return
	}

	var propertyID, fileURL, title, access string
	err = h.DB.QueryRow(`SELECT property_id, file_url, title, access FROM property_documents WHERE id=$1`, docID).
		Scan(&propertyID, &fileURL, &title, &access)
	if err == sql.ErrNoRows {
		httpx.Error(w, 404, "NOT_FOUND", "Document not found", nil)
		return
	}
	if access == "INTERNAL" {
		httpx.Error(w, 403, "FORBIDDEN", "This document is not available for download", nil)
		return
	}

	token, expiresAt := util.SignDownloadURL(h.Cfg.SignedURLSecret, docID, 15*time.Minute)
	signedURL := fmt.Sprintf("%s/api/v1/documents/%s/download?token=%s", h.Cfg.SiteBaseURL, docID, token)

	h.DB.Exec(`
		INSERT INTO leads (lead_type, property_id, name, email, phone, message, consent_given_at)
		VALUES ('DOCUMENT_DOWNLOAD',$1,$2,$3,$4,$5, now())`,
		propertyID, req.Name, req.Email, phone, "Requested document: "+title)
	h.DB.Exec(`UPDATE property_documents SET download_count = download_count + 1 WHERE id=$1`, docID)

	httpx.JSON(w, 200, map[string]interface{}{"download_url": signedURL, "expires_at": expiresAt})
}

// GET /api/v1/documents/{id}/download — FR-PRP-007: PUBLIC documents download directly with
// no token required; GATED documents require the signed, time-limited token issued by
// RequestDocument; INTERNAL documents are never reachable via this route.
func (h *PublicHandler) DownloadDocument(w http.ResponseWriter, r *http.Request) {
	docID := chi.URLParam(r, "id")
	token := r.URL.Query().Get("token")

	var fileURL, access string
	if err := h.DB.QueryRow(`SELECT file_url, access FROM property_documents WHERE id=$1`, docID).Scan(&fileURL, &access); err != nil {
		httpx.Error(w, 404, "NOT_FOUND", "Document not found", nil)
		return
	}
	if access == "INTERNAL" {
		httpx.Error(w, 403, "FORBIDDEN", "This document is not available for download", nil)
		return
	}
	if access == "GATED" && !util.VerifyDownloadToken(h.Cfg.SignedURLSecret, docID, token) {
		httpx.Error(w, 403, "FORBIDDEN", "This download link has expired", nil)
		return
	}
	h.DB.Exec(`UPDATE property_documents SET download_count = download_count + 1 WHERE id=$1`, docID)
	http.Redirect(w, r, fileURL, http.StatusFound)
}

// POST /api/v1/newsletter/subscribe — FR-INQ-010: double opt-in.
func (h *PublicHandler) NewsletterSubscribe(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := decodeJSON(r, &req); err != nil || !strings.Contains(req.Email, "@") {
		httpx.Error(w, 400, "VALIDATION_ERROR", "A valid email is required", nil)
		return
	}
	token := randomToken()
	_, err := h.DB.Exec(`INSERT INTO newsletter_subscribers (email, token) VALUES ($1,$2)
		ON CONFLICT (email) DO UPDATE SET token = EXCLUDED.token`, req.Email, token)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to subscribe", nil)
		return
	}
	// FR-INQ-010: double opt-in confirmation email.
	go sendNewsletterConfirmation(h.Cfg, req.Email, token)
	httpx.JSON(w, 201, map[string]string{"status": "confirmation_sent"})
}

func (h *PublicHandler) NewsletterConfirm(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	res, _ := h.DB.Exec(`UPDATE newsletter_subscribers SET confirmed_at = now() WHERE token=$1 AND confirmed_at IS NULL`, token)
	n, _ := res.RowsAffected()
	if n == 0 {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid or already-used confirmation link", nil)
		return
	}
	httpx.JSON(w, 200, map[string]string{"status": "confirmed"})
}

func (h *PublicHandler) NewsletterUnsubscribe(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	h.DB.Exec(`UPDATE newsletter_subscribers SET unsubscribed_at = now() WHERE token=$1`, token)
	httpx.JSON(w, 200, map[string]string{"status": "unsubscribed"})
}

func strPtr(s string) *string { return &s }
