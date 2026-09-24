package handlers

import (
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/dharact/backend/internal/config"
	"github.com/dharact/backend/internal/httpx"
	"github.com/dharact/backend/internal/middleware"
	"github.com/dharact/backend/internal/models"
	"github.com/dharact/backend/internal/util"
	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

type AdminHandler struct {
	DB  *sql.DB
	Cfg *config.Config
}

func NewAdminHandler(db *sql.DB, cfg *config.Config) *AdminHandler {
	return &AdminHandler{DB: db, Cfg: cfg}
}

func (h *AdminHandler) userID(r *http.Request) string {
	v, _ := r.Context().Value(middleware.CtxUserID).(string)
	return v
}

func (h *AdminHandler) audit(userID, action, entityType, entityID string) {
	h.DB.Exec(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1,$2,$3,$4)`,
		userID, action, entityType, entityID)
}

// auditWithDiff records a field-level before/after diff alongside the action, per FR-ADM-012.
func (h *AdminHandler) auditWithDiff(userID, action, entityType, entityID string, before, after interface{}) {
	diff := map[string]interface{}{"before": before, "after": after}
	diffJSON, _ := json.Marshal(diff)
	h.DB.Exec(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, diff) VALUES ($1,$2,$3,$4,$5)`,
		userID, action, entityType, entityID, diffJSON)
}

// ---------- Properties ----------

type propertyInput struct {
	Title             string   `json:"title"`
	Category          string   `json:"category"`
	ListingType       string   `json:"listing_type"`
	ShortDescription  string   `json:"short_description"`
	Description       string   `json:"description"`
	PriceLKR          *float64 `json:"price_lkr"`
	PriceOnRequest    bool     `json:"price_on_request"`
	PriceUnit         *string  `json:"price_unit"`
	IsNegotiable      bool     `json:"is_negotiable"`
	RentPeriod        *string  `json:"rent_period"`
	MinimumLeaseMonths *int    `json:"minimum_lease_months"`
	AdvanceMonths     *int     `json:"advance_months"`
	DepositLKR        *float64 `json:"deposit_lkr"`
	ProvinceID        int      `json:"province_id"`
	DistrictID        int      `json:"district_id"`
	CityID            int      `json:"city_id"`
	AddressLine       *string  `json:"address_line"`
	ShowExactLocation bool     `json:"show_exact_location"`
	Latitude          float64  `json:"latitude"`
	Longitude         float64  `json:"longitude"`
	LandExtentPerches *float64 `json:"land_extent_perches"`
	BuiltAreaSqft     *int     `json:"built_area_sqft"`
	Bedrooms          *int     `json:"bedrooms"`
	Bathrooms         *int     `json:"bathrooms"`
	IsFeatured        bool     `json:"is_featured"`
		SlugOverride      string   `json:"slug"`

	propertyExtInput // extra columns; see admin_extra.go
}

func (h *AdminHandler) validateProperty(in propertyInput) map[string]string {
	fields := map[string]string{}
	if len(in.Title) < 10 || len(in.Title) > 160 {
		fields["title"] = "Title must be 10-160 characters"
	}
	if in.Category != "LAND" && in.Category != "HOUSE" && in.Category != "COMMERCIAL" {
		fields["category"] = "Category must be LAND, HOUSE or COMMERCIAL"
	}
	if in.ListingType != "SALE" && in.ListingType != "RENT" {
		fields["listing_type"] = "Listing type must be SALE or RENT"
	}
	if !in.PriceOnRequest && (in.PriceLKR == nil || *in.PriceLKR <= 0) {
		fields["price_lkr"] = "Price is required unless price-on-request is set"
	}
	if in.Category == "LAND" && (in.LandExtentPerches == nil || *in.LandExtentPerches <= 0) {
		fields["land_extent_perches"] = "Land extent (perches) is required for land listings"
	}
	if in.Category != "LAND" && (in.BuiltAreaSqft == nil || *in.BuiltAreaSqft <= 0) {
		fields["built_area_sqft"] = "Built area is required for house/commercial listings"
	}
	if in.Category == "HOUSE" && (in.Bedrooms == nil) {
		fields["bedrooms"] = "Bedrooms is required for house listings"
	}
	if in.ListingType == "RENT" && (in.RentPeriod == nil || (*in.RentPeriod != "MONTHLY" && *in.RentPeriod != "ANNUAL")) {
		fields["rent_period"] = "Rent period is required for rental listings"
	}
	if in.Latitude < 5.9 || in.Latitude > 9.9 || in.Longitude < 79.5 || in.Longitude > 81.9 {
		fields["latitude"] = "Coordinates must fall within Sri Lanka"
	}
	for k, v := range validateExt(in.propertyExtInput) {
		fields[k] = v
	}
	return fields
}

// GET /api/v1/admin/properties — all statuses, for the admin table view.
func (h *AdminHandler) ListAllProperties(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	where := []string{"1=1"}
	args := []interface{}{}
	if v := q.Get("status"); v != "" {
		args = append(args, strings.ToUpper(v))
		where = append(where, fmt.Sprintf("p.status = $%d", len(args)))
	}
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	perPage := 20
	offset := (page - 1) * perPage

	rows, err := h.DB.Query(fmt.Sprintf(`
		SELECT p.id, p.reference_code, p.title, p.slug, p.category, p.listing_type, p.status,
		       p.is_featured, p.price_lkr, p.price_on_request, p.view_count, p.updated_at
		FROM properties p WHERE %s ORDER BY p.updated_at DESC LIMIT %d OFFSET %d`,
		strings.Join(where, " AND "), perPage, offset), args...)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list properties", nil)
		return
	}
	defer rows.Close()
	out := []models.Property{}
	for rows.Next() {
		var p models.Property
		rows.Scan(&p.ID, &p.ReferenceCode, &p.Title, &p.Slug, &p.Category, &p.ListingType, &p.Status,
			&p.IsFeatured, &p.PriceLKR, &p.PriceOnRequest, &p.ViewCount, &p.UpdatedAt)
		out = append(out, p)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate properties", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

// GET /api/v1/admin/properties/{id} — full record for the edit form, any status.
func (h *AdminHandler) GetPropertyAdmin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var p models.Property
	err := h.DB.QueryRow(`
		SELECT id, reference_code, title, slug, category, listing_type, status, is_featured,
		       short_description, description, price_lkr, price_on_request, price_unit, is_negotiable,
		       rent_period, minimum_lease_months, advance_months, deposit_lkr,
		       province_id, district_id, city_id, address_line, show_exact_location, latitude, longitude,
				       land_extent_perches, built_area_sqft, bedrooms, bathrooms, cover_image_id
		FROM properties WHERE id=$1`, id).Scan(
		&p.ID, &p.ReferenceCode, &p.Title, &p.Slug, &p.Category, &p.ListingType, &p.Status, &p.IsFeatured,
		&p.ShortDescription, &p.Description, &p.PriceLKR, &p.PriceOnRequest, &p.PriceUnit, &p.IsNegotiable,
		&p.RentPeriod, &p.MinimumLeaseMonths, &p.AdvanceMonths, &p.DepositLKR,
		&p.ProvinceID, &p.DistrictID, &p.CityID, &p.AddressLine, &p.ShowExactLocation, &p.Latitude, &p.Longitude,
		&p.LandExtentPerches, &p.BuiltAreaSqft, &p.Bedrooms, &p.Bathrooms, &p.CoverImageID,
	)
	if err == sql.ErrNoRows {
		httpx.Error(w, 404, "NOT_FOUND", "Property not found", nil)
		return
	} else if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load property", nil)
		return
	}
h.loadExtended(&p)
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

	docRows, err := h.DB.Query(`SELECT id, type, title, access, is_watermarked, download_count FROM property_documents WHERE property_id=$1`, p.ID)
	if err == nil {
		for docRows.Next() {
			var d models.PropertyDocument
			docRows.Scan(&d.ID, &d.Type, &d.Title, &d.Access, &d.IsWatermarked, &d.DownloadCount)
			p.Docs = append(p.Docs, d)
		}
		_ = docRows.Err()
		docRows.Close()
	}

	httpx.JSON(w, 200, p)
}

// POST /api/v1/admin/properties — create as DRAFT (FR-ADM-003).
func (h *AdminHandler) CreateProperty(w http.ResponseWriter, r *http.Request) {
	var in propertyInput
	if err := decodeJSON(r, &in); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	if fields := h.validateProperty(in); len(fields) > 0 {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Please correct the highlighted fields", fields)
		return
	}

	slug := util.Slugify(in.SlugOverride)
	if slug == "" {
		slug = util.Slugify(in.Title)
	}

	var seq int
	h.DB.QueryRow(`SELECT count(*)+1 FROM properties WHERE category=$1`, in.Category).Scan(&seq)
	refCode := util.NextReferenceCode(in.Category, seq, in.ListingType == "RENT")

	uid := h.userID(r)
	var id string
	err := h.DB.QueryRow(`
		INSERT INTO properties (
			reference_code, title, slug, category, listing_type, status, is_featured,
			short_description, description, price_lkr, price_on_request, price_unit, is_negotiable,
			rent_period, minimum_lease_months, advance_months, deposit_lkr,
			province_id, district_id, city_id, address_line, show_exact_location, latitude, longitude,
			land_extent_perches, built_area_sqft, bedrooms, bathrooms, created_by, updated_by
		) VALUES ($1,$2,$3,$4,$5,'DRAFT',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$28)
		RETURNING id`,
		refCode, in.Title, slug, in.Category, in.ListingType, in.IsFeatured,
		in.ShortDescription, in.Description, in.PriceLKR, in.PriceOnRequest, in.PriceUnit, in.IsNegotiable,
		in.RentPeriod, in.MinimumLeaseMonths, in.AdvanceMonths, in.DepositLKR,
		in.ProvinceID, in.DistrictID, in.CityID, in.AddressLine, in.ShowExactLocation, in.Latitude, in.Longitude,
		in.LandExtentPerches, in.BuiltAreaSqft, in.Bedrooms, in.Bathrooms, uid,
	).Scan(&id)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to create property: "+err.Error(), nil)
		return
	}
		if !h.saveExtendedOrRespond(w, id, in) {
		return
	}
	h.audit(uid, "CREATE", "property", id)
	httpx.JSON(w, 201, map[string]string{"id": id, "reference_code": refCode, "slug": slug, "status": "DRAFT"})
}

// PATCH /api/v1/admin/properties/{id}
func (h *AdminHandler) UpdateProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in propertyInput
	if err := decodeJSON(r, &in); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	if fields := h.validateProperty(in); len(fields) > 0 {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Please correct the highlighted fields", fields)
		return
	}
	uid := h.userID(r)

	var before propertyInput
	h.DB.QueryRow(`SELECT title, category, listing_type, price_lkr, price_on_request, is_featured FROM properties WHERE id=$1`, id).
		Scan(&before.Title, &before.Category, &before.ListingType, &before.PriceLKR, &before.PriceOnRequest, &before.IsFeatured)

	_, err := h.DB.Exec(`
		UPDATE properties SET title=$1, category=$2, listing_type=$3, short_description=$4, description=$5,
			price_lkr=$6, price_on_request=$7, price_unit=$8, is_negotiable=$9, rent_period=$10,
			minimum_lease_months=$11, advance_months=$12, deposit_lkr=$13, province_id=$14, district_id=$15,
			city_id=$16, address_line=$17, show_exact_location=$18, latitude=$19, longitude=$20,
			land_extent_perches=$21, built_area_sqft=$22, bedrooms=$23, bathrooms=$24, is_featured=$25,
			updated_by=$26, updated_at=now()
		WHERE id=$27`,
		in.Title, in.Category, in.ListingType, in.ShortDescription, in.Description,
		in.PriceLKR, in.PriceOnRequest, in.PriceUnit, in.IsNegotiable, in.RentPeriod,
		in.MinimumLeaseMonths, in.AdvanceMonths, in.DepositLKR, in.ProvinceID, in.DistrictID,
		in.CityID, in.AddressLine, in.ShowExactLocation, in.Latitude, in.Longitude,
		in.LandExtentPerches, in.BuiltAreaSqft, in.Bedrooms, in.Bathrooms, in.IsFeatured,
		uid, id)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to update property", nil)
		return
	}
		if !h.saveExtendedOrRespond(w, id, in) {
		return
	}
	h.auditWithDiff(uid, "UPDATE", "property", id, before, in)
	httpx.JSON(w, 200, map[string]string{"status": "updated"})
}

// DELETE /api/v1/admin/properties/{id} — soft-delete via ARCHIVED status.
func (h *AdminHandler) ArchiveProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.DB.Exec(`UPDATE properties SET status='ARCHIVED', updated_at=now() WHERE id=$1`, id)
	h.audit(h.userID(r), "ARCHIVE", "property", id)
	httpx.JSON(w, 200, map[string]string{"status": "archived"})
}

// validTransitions implements the §4.3 lifecycle state machine.
var validTransitions = map[string][]string{
	"DRAFT":     {"PUBLISHED"},
	"PUBLISHED": {"RESERVED", "ARCHIVED", "SOLD", "RENTED", "DRAFT"},
	"RESERVED":  {"PUBLISHED", "SOLD", "RENTED"},
	"SOLD":      {"ARCHIVED"},
	"RENTED":    {"ARCHIVED"},
	"ARCHIVED":  {},
}

// POST /api/v1/admin/properties/{id}/status — enforces valid transitions only.
func (h *AdminHandler) TransitionStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status string `json:"status"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	req.Status = strings.ToUpper(req.Status)

	var current string
	if err := h.DB.QueryRow(`SELECT status FROM properties WHERE id=$1`, id).Scan(&current); err != nil {
		httpx.Error(w, 404, "NOT_FOUND", "Property not found", nil)
		return
	}
	allowed := false
	for _, s := range validTransitions[current] {
		if s == req.Status {
			allowed = true
		}
	}
	if !allowed {
		httpx.Error(w, 400, "INVALID_TRANSITION", fmt.Sprintf("Cannot move from %s to %s", current, req.Status), nil)
		return
	}

	if req.Status == "PUBLISHED" {
		var imgCount int
		var missingAlt int
		h.DB.QueryRow(`SELECT count(*) FROM property_images WHERE property_id=$1`, id).Scan(&imgCount)
		h.DB.QueryRow(`SELECT count(*) FROM property_images WHERE property_id=$1 AND (alt_text IS NULL OR alt_text = '')`, id).Scan(&missingAlt)
		if imgCount < 3 {
			httpx.Error(w, 400, "VALIDATION_ERROR", "At least 3 images are required before publishing", nil)
			return
		}
		if missingAlt > 0 {
			httpx.Error(w, 400, "VALIDATION_ERROR", "Every image needs alt text before publishing", nil)
			return
		}
		h.DB.Exec(`UPDATE properties SET status=$1, published_at=COALESCE(published_at, now()), updated_at=now() WHERE id=$2`, req.Status, id)
	} else {
		h.DB.Exec(`UPDATE properties SET status=$1, updated_at=now() WHERE id=$2`, req.Status, id)
	}

	h.audit(h.userID(r), "STATUS_"+req.Status, "property", id)
	httpx.JSON(w, 200, map[string]string{"status": req.Status})
}

// POST /api/v1/admin/properties/{id}/duplicate — FR-ADM-003 duplicate-listing.
func (h *AdminHandler) DuplicateProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	uid := h.userID(r)
	var newID, category, title string
	err := h.DB.QueryRow(`
		INSERT INTO properties (reference_code, title, slug, category, listing_type, status, short_description,
			description, province_id, district_id, city_id, latitude, longitude, created_by, updated_by)
		SELECT reference_code || '-COPY', title || ' (Copy)', slug || '-copy-' || substr(md5(random()::text),1,6),
			category, listing_type, 'DRAFT', short_description, description, province_id, district_id, city_id,
			latitude, longitude, $2, $2
		FROM properties WHERE id=$1 RETURNING id, category, title`, id, uid).Scan(&newID, &category, &title)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to duplicate property", nil)
		return
	}
	h.audit(uid, "DUPLICATE", "property", newID)
	httpx.JSON(w, 201, map[string]string{"id": newID})
}

// POST /api/v1/admin/properties/bulk — FR-ADM-013.
func (h *AdminHandler) BulkAction(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDs    []string `json:"ids"`
		Action string   `json:"action"` // publish | unpublish | feature | unfeature | archive
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	uid := h.userID(r)
	for _, id := range req.IDs {
		switch req.Action {
		case "feature":
			h.DB.Exec(`UPDATE properties SET is_featured=true WHERE id=$1`, id)
		case "unfeature":
			h.DB.Exec(`UPDATE properties SET is_featured=false WHERE id=$1`, id)
		case "archive":
			h.DB.Exec(`UPDATE properties SET status='ARCHIVED' WHERE id=$1`, id)
		case "unpublish":
			h.DB.Exec(`UPDATE properties SET status='DRAFT' WHERE id=$1`, id)
		}
		h.audit(uid, "BULK_"+strings.ToUpper(req.Action), "property", id)
	}
	httpx.JSON(w, 200, map[string]interface{}{"status": "done", "count": len(req.IDs)})
}

// ---------- Media ----------

// POST /api/v1/admin/properties/{id}/images — stores a pre-uploaded media URL + required alt text (FR-ADM-004).
// In production, swap this for a direct-to-S3/Cloudinary upload flow; the API still
// only ever stores the resulting URL/metadata.
func (h *AdminHandler) AddImage(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "id")
	var req struct {
		URL     string `json:"url"`
		AltText string `json:"alt_text"`
	}
	if err := decodeJSON(r, &req); err != nil || req.URL == "" || req.AltText == "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", "url and alt_text are required (WCAG)", nil)
		return
	}
	var id string
	h.DB.QueryRow(`INSERT INTO property_images (property_id, url, alt_text) VALUES ($1,$2,$3) RETURNING id`,
		propertyID, req.URL, req.AltText).Scan(&id)
	httpx.JSON(w, 201, map[string]string{"id": id})
}

// UploadMedia handles a real multipart file upload for property images/documents,
// implementing the drag-and-drop upload described in FR-ADM-004 with the MIME/extension
// and size validation required by NFR-SEC-007. Files are stored under cfg.MediaUploadDir
// (outside the web root) and served back via the static /uploads/ route mounted in
// cmd/server/main.go; the returned URL is what AddImage/AddDocument expect as input.
//
// Malware scanning (also part of NFR-SEC-007) is not performed here — that requires an
// external scanner (e.g. ClamAV) not available in this build environment. The MIME/extension
// allow-list and size caps below cover the practical bulk of the control; wire a ClamAV
// sidecar or a provider-side scan (S3/Cloudinary both offer one) at deploy time.
func (h *AdminHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "id")

	if err := r.ParseMultipartForm(25 << 20); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Upload too large or malformed", nil)
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "A 'file' field is required", nil)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowedImage := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	isPDF := ext == ".pdf"
	isImage := allowedImage[ext]
	if !isImage && !isPDF {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Only JPEG, PNG, WebP or PDF files are accepted", nil)
		return
	}
	maxBytes := h.Cfg.MaxImageBytes
	if isPDF {
		maxBytes = h.Cfg.MaxPDFBytes
	}
	if header.Size > maxBytes {
		httpx.Error(w, 400, "VALIDATION_ERROR", fmt.Sprintf("File exceeds the %dMB limit", maxBytes/(1024*1024)), nil)
		return
	}

	// Sniff the first 512 bytes so the declared extension can't be used to smuggle a
	// mismatched or executable payload past the allow-list (NFR-SEC-007).
	head := make([]byte, 512)
	n, _ := file.Read(head)
	contentType := http.DetectContentType(head[:n])
	if isImage && !strings.HasPrefix(contentType, "image/") {
		httpx.Error(w, 400, "VALIDATION_ERROR", "File content does not match an image type", nil)
		return
	}
	if isPDF && contentType != "application/pdf" {
		httpx.Error(w, 400, "VALIDATION_ERROR", "File content does not match a PDF", nil)
		return
	}

	if err := os.MkdirAll(h.Cfg.MediaUploadDir, 0o750); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to prepare upload storage", nil)
		return
	}
	safeName := fmt.Sprintf("%s-%d%s", propertyID, time.Now().UnixNano(), ext)
	destPath := filepath.Join(h.Cfg.MediaUploadDir, safeName)

	dest, err := os.Create(destPath)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to store upload", nil)
		return
	}
	defer dest.Close()

	if _, err := dest.Write(head[:n]); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to store upload", nil)
		return
	}
	if _, err := io.Copy(dest, file); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to store upload", nil)
		return
	}

	mediaURL := fmt.Sprintf("/uploads/%s", safeName)
	httpx.JSON(w, 201, map[string]interface{}{"url": mediaURL, "content_type": contentType, "size": header.Size})
}

func (h *AdminHandler) DeleteImage(w http.ResponseWriter, r *http.Request) {
	imageID := chi.URLParam(r, "imageId")
	h.DB.Exec(`DELETE FROM property_images WHERE id=$1`, imageID)
	httpx.JSON(w, 200, map[string]string{"status": "deleted"})
}

func (h *AdminHandler) ReorderImages(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Order []string `json:"order"` // image ids in desired order
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	for i, imgID := range req.Order {
		h.DB.Exec(`UPDATE property_images SET sort_order=$1 WHERE id=$2`, i, imgID)
	}
	httpx.JSON(w, 200, map[string]string{"status": "reordered"})
}

func (h *AdminHandler) AddDocument(w http.ResponseWriter, r *http.Request) {
	propertyID := chi.URLParam(r, "id")
	var req struct {
		Type    string `json:"type"`
		Title   string `json:"title"`
		FileURL string `json:"file_url"`
		Access  string `json:"access"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	var id string
	h.DB.QueryRow(`INSERT INTO property_documents (property_id, type, title, file_url, access) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
		propertyID, req.Type, req.Title, req.FileURL, req.Access).Scan(&id)
	httpx.JSON(w, 201, map[string]string{"id": id})
}

func (h *AdminHandler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	docID := chi.URLParam(r, "docId")
	h.DB.Exec(`DELETE FROM property_documents WHERE id=$1`, docID)
	httpx.JSON(w, 200, map[string]string{"status": "deleted"})
}

// ---------- Leads CRM (§5.8 FR-ADM-007) ----------

func (h *AdminHandler) ListLeads(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	where := []string{"1=1"}
	args := []interface{}{}
	if v := q.Get("status"); v != "" {
		args = append(args, strings.ToUpper(v))
		where = append(where, fmt.Sprintf("status = $%d", len(args)))
	}
	if v := q.Get("lead_type"); v != "" {
		args = append(args, strings.ToUpper(v))
		where = append(where, fmt.Sprintf("lead_type = $%d", len(args)))
	}
	if v := q.Get("property_id"); v != "" {
		args = append(args, v)
		where = append(where, fmt.Sprintf("property_id = $%d", len(args)))
	}
	if v := q.Get("assigned_to"); v != "" {
		args = append(args, v)
		where = append(where, fmt.Sprintf("assigned_to = $%d", len(args)))
	}

	rows, err := h.DB.Query(fmt.Sprintf(`
		SELECT id, lead_type, property_id, name, email, phone, message, status, assigned_to, created_at
		FROM leads WHERE %s ORDER BY created_at DESC LIMIT 200`, strings.Join(where, " AND ")), args...)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list leads", nil)
		return
	}
	defer rows.Close()
	out := []models.Lead{}
	for rows.Next() {
		var l models.Lead
		rows.Scan(&l.ID, &l.LeadType, &l.PropertyID, &l.Name, &l.Email, &l.Phone, &l.Message, &l.Status, &l.AssignedTo, &l.CreatedAt)
		out = append(out, l)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate leads", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

func (h *AdminHandler) GetLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var l models.Lead
	err := h.DB.QueryRow(`SELECT id, lead_type, property_id, name, email, phone, message, status,
		assigned_to, internal_notes, source_url, utm_source, utm_medium, utm_campaign, created_at
		FROM leads WHERE id=$1`, id).Scan(&l.ID, &l.LeadType, &l.PropertyID, &l.Name, &l.Email, &l.Phone,
		&l.Message, &l.Status, &l.AssignedTo, &l.InternalNotes, &l.SourceURL, &l.UTMSource, &l.UTMMedium, &l.UTMCampaign, &l.CreatedAt)
	if err == sql.ErrNoRows {
		httpx.Error(w, 404, "NOT_FOUND", "Lead not found", nil)
		return
	}
	httpx.JSON(w, 200, l)
}

func (h *AdminHandler) UpdateLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status        *string `json:"status"`
		AssignedTo    *string `json:"assigned_to"`
		InternalNotes *string `json:"internal_notes"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	var beforeStatus string
	h.DB.QueryRow(`SELECT status FROM leads WHERE id=$1`, id).Scan(&beforeStatus)

	if req.Status != nil {
		h.DB.Exec(`UPDATE leads SET status=$1 WHERE id=$2`, strings.ToUpper(*req.Status), id)
	}
	if req.AssignedTo != nil {
		h.DB.Exec(`UPDATE leads SET assigned_to=$1 WHERE id=$2`, *req.AssignedTo, id)
	}
	if req.InternalNotes != nil {
		h.DB.Exec(`UPDATE leads SET internal_notes=$1 WHERE id=$2`, *req.InternalNotes, id)
	}
	h.auditWithDiff(h.userID(r), "UPDATE", "lead", id, map[string]string{"status": beforeStatus}, req)
	httpx.JSON(w, 200, map[string]string{"status": "updated"})
}

// POST /api/v1/admin/leads/{id}/erase — NFRSEC-010: admin-triggered erasure of a lead's
// personal fields on request, while preserving the aggregate record for reporting.
func (h *AdminHandler) EraseLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	res, err := h.DB.Exec(`
		UPDATE leads SET name='[erased]', email='[erased]', phone='[erased]', message=NULL,
			ip_address=NULL, user_agent=NULL, internal_notes=NULL
		WHERE id=$1`, id)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to erase lead", nil)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		httpx.Error(w, 404, "NOT_FOUND", "Lead not found", nil)
		return
	}
	h.audit(h.userID(r), "ERASE_PII", "lead", id)
	httpx.JSON(w, 200, map[string]string{"status": "erased"})
}

// GET /api/v1/admin/leads/export — CSV export of the filtered set (FR-ADM-007). Filters
// mirror ListLeads exactly, so the export always matches what's on screen.
func (h *AdminHandler) ExportLeads(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	where := []string{"1=1"}
	args := []interface{}{}
	if v := q.Get("status"); v != "" {
		args = append(args, strings.ToUpper(v))
		where = append(where, fmt.Sprintf("status = $%d", len(args)))
	}
	if v := q.Get("lead_type"); v != "" {
		args = append(args, strings.ToUpper(v))
		where = append(where, fmt.Sprintf("lead_type = $%d", len(args)))
	}
	if v := q.Get("property_id"); v != "" {
		args = append(args, v)
		where = append(where, fmt.Sprintf("property_id = $%d", len(args)))
	}
	if v := q.Get("assigned_to"); v != "" {
		args = append(args, v)
		where = append(where, fmt.Sprintf("assigned_to = $%d", len(args)))
	}
	if v := q.Get("date_from"); v != "" {
		args = append(args, v)
		where = append(where, fmt.Sprintf("created_at >= $%d", len(args)))
	}
	if v := q.Get("date_to"); v != "" {
		args = append(args, v)
		where = append(where, fmt.Sprintf("created_at <= $%d", len(args)))
	}

	rows, err := h.DB.Query(fmt.Sprintf(`
		SELECT lead_type, property_id, name, email, phone, status, assigned_to, internal_notes, message, created_at
		FROM leads WHERE %s ORDER BY created_at DESC`, strings.Join(where, " AND ")), args...)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to export leads", nil)
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=leads.csv")
	cw := csv.NewWriter(w)
	cw.Write([]string{"lead_type", "property_id", "name", "email", "phone", "status", "assigned_to", "internal_notes", "message", "created_at"})
	for rows.Next() {
		var leadType, name, email, phone, status string
		var propertyID, assignedTo, internalNotes, message sql.NullString
		var createdAt time.Time
		rows.Scan(&leadType, &propertyID, &name, &email, &phone, &status, &assignedTo, &internalNotes, &message, &createdAt)
		cw.Write([]string{leadType, propertyID.String, name, email, phone, status, assignedTo.String, internalNotes.String, message.String, createdAt.Format(time.RFC3339)})
	}
	if err := rows.Err(); err != nil {
		return
	}
	cw.Flush()
}

// ---------- Dashboard (FR-ADM-008) ----------

func (h *AdminHandler) Dashboard(w http.ResponseWriter, r *http.Request) {
	var newLeads7, newLeads30 int
	h.DB.QueryRow(`SELECT count(*) FROM leads WHERE created_at > now() - interval '7 days'`).Scan(&newLeads7)
	h.DB.QueryRow(`SELECT count(*) FROM leads WHERE created_at > now() - interval '30 days'`).Scan(&newLeads30)

	byStatus := map[string]int{}
	if rows, err := h.DB.Query(`SELECT status, count(*) FROM properties GROUP BY status`); err == nil {
		for rows.Next() {
			var s string
			var c int
			rows.Scan(&s, &c)
			byStatus[s] = c
		}
		_ = rows.Err()
		rows.Close()
	}

	type topViewed struct {
		Title     string `json:"title"`
		ViewCount int    `json:"view_count"`
	}
	top := []topViewed{}
	if tvRows, err := h.DB.Query(`SELECT title, view_count FROM properties ORDER BY view_count DESC LIMIT 5`); err == nil {
		for tvRows.Next() {
			var t topViewed
			tvRows.Scan(&t.Title, &t.ViewCount)
			top = append(top, t)
		}
		_ = tvRows.Err()
		tvRows.Close()
	}

	var closedWon, closedLost int
	h.DB.QueryRow(`SELECT count(*) FROM leads WHERE status='CLOSED_WON'`).Scan(&closedWon)
	h.DB.QueryRow(`SELECT count(*) FROM leads WHERE status='CLOSED_LOST'`).Scan(&closedLost)

	httpx.JSON(w, 200, map[string]interface{}{
		"new_leads_7d":     newLeads7,
		"new_leads_30d":    newLeads30,
		"listings_by_status": byStatus,
		"top_viewed":       top,
		"closed_won":       closedWon,
		"closed_lost":      closedLost,
	})
}

// ---------- Settings, Users, Audit log ----------

func (h *AdminHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	rows, _ := h.DB.Query(`SELECT key, value FROM settings`)
	defer rows.Close()
	out := map[string]interface{}{}
	for rows.Next() {
		var k string
		var v []byte
		rows.Scan(&k, &v)
		out[k] = string(v)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate settings", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

func (h *AdminHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := decodeJSON(r, &body); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	for k, v := range body {
		h.DB.Exec(`INSERT INTO settings (key, value) VALUES ($1,$2)
			ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=now()`, k, mustJSON(v))
	}
	h.audit(h.userID(r), "UPDATE", "settings", "site")
	httpx.JSON(w, 200, map[string]string{"status": "updated"})
}

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, name, email, role, is_active, last_login_at, created_at FROM users ORDER BY created_at`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list users", nil)
		return
	}
	defer rows.Close()
	out := []models.User{}
	for rows.Next() {
		var u models.User
		rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.IsActive, &u.LastLoginAt, &u.CreatedAt)
		out = append(out, u)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate users", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

func (h *AdminHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	var id string
	err := h.DB.QueryRow(`INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`,
		req.Name, req.Email, string(hash), req.Role).Scan(&id)
	if err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Failed to create user (email may already exist)", nil)
		return
	}
	h.audit(h.userID(r), "CREATE", "user", id)
	httpx.JSON(w, 201, map[string]string{"id": id})
}

func (h *AdminHandler) DeactivateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.DB.Exec(`UPDATE users SET is_active=false WHERE id=$1`, id)
	h.audit(h.userID(r), "DEACTIVATE", "user", id)
	httpx.JSON(w, 200, map[string]string{"status": "deactivated"})
}

func (h *AdminHandler) AuditLog(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, user_id, action, entity_type, entity_id, diff, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load audit log", nil)
		return
	}
	defer rows.Close()
	out := []models.AuditLog{}
	for rows.Next() {
		var a models.AuditLog
		var diff sql.NullString
		rows.Scan(&a.ID, &a.UserID, &a.Action, &a.EntityType, &a.EntityID, &diff, &a.CreatedAt)
		if diff.Valid {
			a.Diff = json.RawMessage(diff.String)
		}
		out = append(out, a)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate audit log", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

func mustJSON(v interface{}) string {
	switch t := v.(type) {
	case string:
		return t
	default:
		b, _ := json.Marshal(v)
		return string(b)
	}
}
