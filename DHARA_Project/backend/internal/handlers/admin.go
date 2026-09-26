package handlers

import (
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
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

func (h *AdminHandler) auditWithDiff(userID, action, entityType, entityID string, before, after interface{}) {
	diff := map[string]interface{}{"before": before, "after": after}
	diffJSON, _ := json.Marshal(diff)
	h.DB.Exec(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, diff) VALUES ($1,$2,$3,$4,$5)`,
		userID, action, entityType, entityID, diffJSON)
}


// ---------- Properties ----------

type propertyInput struct {
	Title             string   `json:"title"`
	Slug              string   `json:"slug"`
	Category          string   `json:"category"`
	ListingType       string   `json:"listing_type"`
	Status            string   `json:"status"`
	IsFeatured        bool     `json:"is_featured"`
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
	ProvinceID int `json:"province_id"`
	DistrictID int `json:"district_id"`
	City              *string  `json:"city"`
	AddressLine       *string  `json:"address_line"`
	MapURL            *string  `json:"map_url"`
	ShowExactLocation bool     `json:"show_exact_location"`
	Latitude          float64  `json:"latitude"`
	Longitude         float64  `json:"longitude"`
	LandAreaUnit      *string  `json:"land_area_unit"`
	LandAreaCount     *float64 `json:"land_area_count"`
	RoadAccess        bool     `json:"road_access"`
	RoadWidthFt *int `json:"road_width_ft"`
	RoadSurface       *string  `json:"road_surface"`
	LandShape         *string  `json:"land_shape"`
	FrontageFt        *int     `json:"frontage_ft"`
	LandType          *string  `json:"land_type"`
	BuiltAreaSqft     *int     `json:"built_area_sqft"`
	Bedrooms          *int     `json:"bedrooms"`
	Bathrooms         *int     `json:"bathrooms"`
	FloorCount        *int     `json:"floor_count"`
	ParkingSpaces     *int     `json:"parking_spaces"`
	YearBuilt         *int     `json:"year_built"`
	Furnishing        *string  `json:"furnishing"`
	Condition         *string  `json:"condition"`
	HasElectricity    *string  `json:"has_electricity"`
	WaterSource       *string  `json:"water_source"`
	DeedType          *string  `json:"deed_type"`
	DeedNote          *string  `json:"deed_note"`

	HasBoundaryWall            *bool   `json:"has_boundary_wall"`
	HasSolar                   *bool   `json:"has_solar"`
	ACReady                    *bool   `json:"ac_ready"`
	BeachfrontSeaView          *bool   `json:"beachfront_sea_view"`
	WaterfrontRiverside        *bool   `json:"waterfront_riverside"`
	Hillside                   *bool   `json:"hillside"`
	PaddyFront                 *bool   `json:"paddy_front"`
	LakeFront                  *bool   `json:"lake_front"`
	IndoorGarden               *bool   `json:"indoor_garden"`
	Garage                     *bool   `json:"garage"`
	SwimmingPool               *bool   `json:"swimming_pool"`
	GatedCommunity             *bool   `json:"gated_community"`
	RoofTopGarden              *bool   `json:"roof_top_garden"`
	LawnGarden                 *bool   `json:"lawn_garden"`
	LuxurySpecification        *bool   `json:"luxury_specification"`
	Security24Hours            *bool   `json:"security_24_hours"`
	ColonialArchitecture       *bool   `json:"colonial_architecture"`
	MaidsRoom                  *bool   `json:"maids_room"`
	InfinityPool               *bool   `json:"infinity_pool"`
	HomeSecuritySystem         *bool   `json:"home_security_system"`
	MaidsToilet                *bool   `json:"maids_toilet"`
	HotWater                   *bool   `json:"hot_water"`
	OverheadWaterTank          *bool   `json:"overhead_water_tank"`
	AttachedToilets            *bool   `json:"attached_toilets"`
	PermitsForGemMining        *bool   `json:"permits_for_gem_mining"`
	SoilTestPassed             *bool   `json:"soil_test_passed"`
	HillyLandscape             *bool   `json:"hilly_landscape"`
	IdealForCommercialUse      *bool   `json:"ideal_for_commercial_use"`
	LakePondInsideLand         *bool   `json:"lake_pond_inside_land"`
	BungalowCottageType        *bool   `json:"bungalow_cottage_type"`
	StreamRunningThroughLand   *bool   `json:"stream_running_through_land"`
	ApprovedSurveyPlan         *bool   `json:"approved_survey_plan"`

	CoverImage        string   `json:"cover_image"`
	VideoURL          *string  `json:"video_url"`
	GoogleDriveURL    *string  `json:"google_drive_url"`
	Gallery           []struct{ URL string `json:"url"`; Caption string `json:"caption"` } `json:"gallery"`
	MetaTitle         *string  `json:"meta_title"`
	MetaDescription   *string  `json:"meta_description"`
	Documents         []models.PropertyDocument `json:"documents"`
}


// GET /api/v1/admin/properties
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
	perPage := 1000
	offset := (page - 1) * perPage

	rows, err := h.DB.Query(fmt.Sprintf(`
		SELECT p.id, p.reference_code, p.title, p.slug, p.category, p.listing_type, p.status,
		       p.is_featured, p.price_lkr, p.price_on_request, p.view_count, p.updated_at, p.sold_rented_at, p.created_at, p.published_at,
			   (SELECT COUNT(*) FROM property_images WHERE property_id = p.id) as image_count,
			   EXISTS(SELECT 1 FROM property_images WHERE property_id = p.id AND is_cover = true) as has_cover,
			   COALESCE(u1.name, 'Unknown') as created_by_name,
			   COALESCE(u2.name, 'Unknown') as updated_by_name,
			   COALESCE(d.name, '') as district_name
		FROM properties p 
		LEFT JOIN users u1 ON p.created_by = u1.id
		LEFT JOIN users u2 ON p.updated_by = u2.id
		LEFT JOIN districts d ON p.district_id = d.id
		WHERE %s ORDER BY p.updated_at DESC LIMIT %d OFFSET %d`,
		strings.Join(where, " AND "), perPage, offset), args...)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list properties", nil)
		return
	}
	defer rows.Close()
	out := []map[string]interface{}{}
	for rows.Next() {
		var p models.Property
		var imageCount int
		var hasCover bool
		var createdByName, updatedByName, districtName string
		rows.Scan(&p.ID, &p.ReferenceCode, &p.Title, &p.Slug, &p.Category, &p.ListingType, &p.Status,
			&p.IsFeatured, &p.PriceLKR, &p.PriceOnRequest, &p.ViewCount, &p.UpdatedAt, &p.SoldRentedAt, &p.CreatedAt, &p.PublishedAt, &imageCount, &hasCover, &createdByName, &updatedByName, &districtName)
		
		out = append(out, map[string]interface{}{
			"id": p.ID, "reference_code": p.ReferenceCode, "title": p.Title, "slug": p.Slug,
			"category": p.Category, "listing_type": p.ListingType, "status": p.Status,
			"is_featured": p.IsFeatured, "price_lkr": p.PriceLKR, "price_on_request": p.PriceOnRequest,
			"view_count": p.ViewCount, "updated_at": p.UpdatedAt, "sold_rented_at": p.SoldRentedAt,
			"created_at": p.CreatedAt, "published_at": p.PublishedAt,
			"image_count": imageCount, "has_cover": hasCover, "created_by": createdByName, "updated_by": updatedByName,
			"district_name": districtName,
		})
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate properties", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

// GET /api/v1/admin/properties/{id}
func (h *AdminHandler) GetPropertyAdmin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var p models.Property
	err := h.DB.QueryRow(`
		SELECT id, reference_code, title, slug, category, listing_type, status, is_featured,
		       short_description, description, price_lkr, price_on_request, price_unit, is_negotiable,
		       rent_period, minimum_lease_months, advance_months, deposit_lkr,

		       province_id, district_id, city, address_line, map_url, show_exact_location, latitude, longitude,
		       land_area_unit, land_area_count, road_access, road_width_ft, road_surface, land_shape, frontage_ft, land_type,
		       built_area_sqft, bedrooms, bathrooms, floor_count, parking_spaces, year_built, furnishing, condition,
		       has_electricity, water_source, deed_type, deed_note,
		       has_boundary_wall, has_solar, ac_ready, beachfront_sea_view, waterfront_riverside, hillside, paddy_front, lake_front, indoor_garden, garage, swimming_pool, gated_community, roof_top_garden, lawn_garden, luxury_specification, security_24_hours, colonial_architecture, maids_room, infinity_pool, home_security_system, maids_toilet, hot_water, overhead_water_tank, attached_toilets, permits_for_gem_mining, soil_test_passed, hilly_landscape, ideal_for_commercial_use, lake_pond_inside_land, bungalow_cottage_type, stream_running_through_land, approved_survey_plan,
		       video_url, google_drive_url, meta_title, meta_description
		FROM properties WHERE id=$1`, id).Scan(
		&p.ID, &p.ReferenceCode, &p.Title, &p.Slug, &p.Category, &p.ListingType, &p.Status, &p.IsFeatured,
		&p.ShortDescription, &p.Description, &p.PriceLKR, &p.PriceOnRequest, &p.PriceUnit, &p.IsNegotiable,
		&p.RentPeriod, &p.MinimumLeaseMonths, &p.AdvanceMonths, &p.DepositLKR,
		&p.ProvinceID, &p.DistrictID, &p.City, &p.AddressLine, &p.MapURL, &p.ShowExactLocation, &p.Latitude, &p.Longitude,
		&p.LandAreaUnit, &p.LandAreaCount, &p.RoadAccess, &p.RoadWidthFt, &p.RoadSurface, &p.LandShape, &p.FrontageFt, &p.LandType,
		&p.BuiltAreaSqft, &p.Bedrooms, &p.Bathrooms, &p.FloorCount, &p.ParkingSpaces, &p.YearBuilt, &p.Furnishing, &p.Condition,
		&p.HasElectricity, &p.WaterSource, &p.DeedType, &p.DeedNote,
		&p.HasBoundaryWall, &p.HasSolar, &p.ACReady, &p.BeachfrontSeaView, &p.WaterfrontRiverside, &p.Hillside, &p.PaddyFront, &p.LakeFront, &p.IndoorGarden, &p.Garage, &p.SwimmingPool, &p.GatedCommunity, &p.RoofTopGarden, &p.LawnGarden, &p.LuxurySpecification, &p.Security24Hours, &p.ColonialArchitecture, &p.MaidsRoom, &p.InfinityPool, &p.HomeSecuritySystem, &p.MaidsToilet, &p.HotWater, &p.OverheadWaterTank, &p.AttachedToilets, &p.PermitsForGemMining, &p.SoilTestPassed, &p.HillyLandscape, &p.IdealForCommercialUse, &p.LakePondInsideLand, &p.BungalowCottageType, &p.StreamRunningThroughLand, &p.ApprovedSurveyPlan,
		&p.VideoURL, &p.GoogleDriveURL, &p.MetaTitle, &p.MetaDescription,
	)
	if err == sql.ErrNoRows {
		httpx.Error(w, 404, "NOT_FOUND", "Property not found", nil)
		return
	} else if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load property", nil)
		return
	}

	imgRows, _ := h.DB.Query(`SELECT id, url, alt_text, caption, sort_order, is_cover FROM property_images WHERE property_id=$1 ORDER BY sort_order`, p.ID)
	for imgRows.Next() {
		var img models.PropertyImage
		imgRows.Scan(&img.ID, &img.URL, &img.AltText, &img.Caption, &img.SortOrder, &img.IsCover)
		p.Images = append(p.Images, img)
		if img.IsCover {
			p.CoverURL = img.URL
		}
	}

	docRows, _ := h.DB.Query(`SELECT id, type, title, file_url, access, is_watermarked, download_count FROM property_documents WHERE property_id=$1`, p.ID)
	for docRows.Next() {
		var d models.PropertyDocument
		docRows.Scan(&d.ID, &d.Type, &d.Title, &d.FileURL, &d.Access, &d.IsWatermarked, &d.DownloadCount)
		p.Docs = append(p.Docs, d)
	}

	httpx.JSON(w, 200, p)
}

func savePropertyImages(db *sql.DB, propertyID string, in propertyInput) {
	db.Exec(`DELETE FROM property_images WHERE property_id=$1`, propertyID)
	
	coverURL := in.CoverImage
	if coverURL != "" {
		_, err := db.Exec(`INSERT INTO property_images (property_id, url, alt_text, is_cover) VALUES ($1,$2,$3,true)`, propertyID, coverURL, "Cover")
		if err != nil {
			log.Println("Error inserting cover image:", err)
		}
	}
	for i, u := range in.Gallery {
		if u.URL != coverURL {
			var capPtr *string
			if u.Caption != "" {
				capPtr = &u.Caption
			}
			_, err := db.Exec(`INSERT INTO property_images (property_id, url, alt_text, caption, sort_order, is_cover) VALUES ($1,$2,$3,$4,$5,false)`, propertyID, u.URL, "Gallery", capPtr, i+1)
			if err != nil {
				log.Println("Error inserting gallery image:", err)
			}
		}
	}
}

func savePropertyDocs(db *sql.DB, propertyID string, in propertyInput) {
	db.Exec(`DELETE FROM property_documents WHERE property_id=$1`, propertyID)
	
	for _, doc := range in.Documents {
		_, err := db.Exec(`INSERT INTO property_documents (property_id, type, title, file_url, access) VALUES ($1,$2::document_type,$3,$4,$5::document_access)`,
			propertyID, doc.Type, doc.Title, doc.FileURL, doc.Access)
		if err != nil {
			log.Println("Error inserting document:", err)
		}
	}
}

// POST /api/v1/admin/properties
func (h *AdminHandler) CreateProperty(w http.ResponseWriter, r *http.Request) {
	var in propertyInput
	if err := decodeJSON(r, &in); err != nil {
		fmt.Printf("CreateProperty decode error: %v\n", err)
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}

	slug := util.Slugify(in.Slug)
	if slug == "" {
		slug = util.Slugify(in.Title)
	}


	if in.MetaTitle == nil || *in.MetaTitle == "" {
		in.MetaTitle = &in.Title
	}
	if in.MetaDescription == nil || *in.MetaDescription == "" {
		in.MetaDescription = &in.ShortDescription
	}


	var seq int
	h.DB.QueryRow(`SELECT COALESCE(MAX(SPLIT_PART(reference_code, '-', 3)::integer), -1) + 1 FROM properties WHERE reference_code LIKE 'DHR-%-%'`).Scan(&seq)
	refCode := util.NextReferenceCode(in.Category, seq, in.ListingType == "RENT")

	uid := h.userID(r)
	var id string
	err := h.DB.QueryRow(`
		INSERT INTO properties (
			reference_code, title, slug, category, listing_type, status, is_featured,
			short_description, description, price_lkr, price_on_request, price_unit, is_negotiable,
			rent_period, minimum_lease_months, advance_months, deposit_lkr,
			province_id, district_id, city, address_line, map_url, show_exact_location, latitude, longitude,
			land_area_unit, land_area_count, road_access, road_width_ft, road_surface, land_shape, frontage_ft, land_type,
			built_area_sqft, bedrooms, bathrooms, floor_count, parking_spaces, year_built, furnishing, condition,
			has_electricity, water_source, deed_type, deed_note,
			has_boundary_wall, has_solar, ac_ready, beachfront_sea_view, waterfront_riverside, hillside, paddy_front, lake_front, indoor_garden, garage, swimming_pool, gated_community, roof_top_garden, lawn_garden, luxury_specification, security_24_hours, colonial_architecture, maids_room, infinity_pool, home_security_system, maids_toilet, hot_water, overhead_water_tank, attached_toilets, permits_for_gem_mining, soil_test_passed, hilly_landscape, ideal_for_commercial_use, lake_pond_inside_land, bungalow_cottage_type, stream_running_through_land, approved_survey_plan,
			video_url, google_drive_url, meta_title, meta_description, created_by, updated_by
		) VALUES (
			$1,$2,$3,$4,$5,'DRAFT',$6,
			$7,$8,$9,$10,$11,$12,
			$13,$14,$15,$16,
			$17,$18,$19,$20,$21,$22,$23,$24,
			$25,$26,$27,$28,$29,$30,$31,$32,
			$33,$34,$35,$36,$37,$38,$39,$40,
			$41,$42,$43,$44,
			$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59,$60,$61,$62,$63,$64,$65,$66,$67,$68,$69,$70,$71,$72,$73,$74,$75,$76,
			$77,$78,$79,$80,$81,$81
		) RETURNING id`,
		refCode, in.Title, slug, in.Category, in.ListingType, in.IsFeatured,
		in.ShortDescription, in.Description, in.PriceLKR, in.PriceOnRequest, in.PriceUnit, in.IsNegotiable,
		in.RentPeriod, in.MinimumLeaseMonths, in.AdvanceMonths, in.DepositLKR,
		in.ProvinceID, in.DistrictID, in.City, in.AddressLine, in.MapURL, in.ShowExactLocation, in.Latitude, in.Longitude,
		in.LandAreaUnit, in.LandAreaCount, in.RoadAccess, in.RoadWidthFt, in.RoadSurface, in.LandShape, in.FrontageFt, in.LandType,
		in.BuiltAreaSqft, in.Bedrooms, in.Bathrooms, in.FloorCount, in.ParkingSpaces, in.YearBuilt, in.Furnishing, in.Condition,
		in.HasElectricity, in.WaterSource, in.DeedType, in.DeedNote,
		in.HasBoundaryWall, in.HasSolar, in.ACReady, in.BeachfrontSeaView, in.WaterfrontRiverside, in.Hillside, in.PaddyFront, in.LakeFront, in.IndoorGarden, in.Garage, in.SwimmingPool, in.GatedCommunity, in.RoofTopGarden, in.LawnGarden, in.LuxurySpecification, in.Security24Hours, in.ColonialArchitecture, in.MaidsRoom, in.InfinityPool, in.HomeSecuritySystem, in.MaidsToilet, in.HotWater, in.OverheadWaterTank, in.AttachedToilets, in.PermitsForGemMining, in.SoilTestPassed, in.HillyLandscape, in.IdealForCommercialUse, in.LakePondInsideLand, in.BungalowCottageType, in.StreamRunningThroughLand, in.ApprovedSurveyPlan,
		in.VideoURL, in.GoogleDriveURL, in.MetaTitle, in.MetaDescription, uid,
	).Scan(&id)

	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to create property: "+err.Error(), nil)
		return
	}
	
	savePropertyImages(h.DB, id, in)
	savePropertyDocs(h.DB, id, in)
	
	h.audit(uid, "CREATE", "property", id)
	httpx.JSON(w, 201, map[string]string{"id": id, "reference_code": refCode, "slug": slug, "status": "DRAFT"})
}

// PATCH /api/v1/admin/properties/{id}
func (h *AdminHandler) UpdateProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	// Read payload dynamically since it might be a partial update (PATCH)
	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}

	if len(payload) == 0 {
		httpx.JSON(w, 200, map[string]string{"status": "no changes"})
		return
	}

	// We'll dynamically construct the SET clause.
	setClauses := []string{}
	args := []interface{}{}
	argID := 1

	for key, value := range payload {
		// Ignore fields we handle separately or ignore
		if key == "id" || key == "reference_code" || key == "status" || key == "cover_image" || key == "gallery" || key == "documents" {
			continue
		}
		
		setClauses = append(setClauses, fmt.Sprintf("%s=$%d", key, argID))
		args = append(args, value)
		argID++
	}

	if payload["category"] != nil || payload["listing_type"] != nil {
		var existingRefCode, curCat, curListType string
		h.DB.QueryRow(`SELECT reference_code, category, listing_type FROM properties WHERE id=$1`, id).Scan(&existingRefCode, &curCat, &curListType)
		
		cat := curCat
		if payload["category"] != nil {
			cat = payload["category"].(string)
		}
		listType := curListType
		if payload["listing_type"] != nil {
			listType = payload["listing_type"].(string)
		}
		
		parts := strings.Split(existingRefCode, "-")
		seqStr := "0"
		if len(parts) >= 3 {
			seqStr = parts[2]
		}
		
		catCode, ok := map[string]string{"LAND": "L", "HOUSE": "H", "COMMERCIAL": "C"}[cat]
		if !ok {
			catCode = "O"
		}
		typeCode := "S"
		if listType == "RENT" {
			typeCode = "R"
		}
		newRefCode := fmt.Sprintf("DHR-%s%s-%s", catCode, typeCode, seqStr)
		
		setClauses = append(setClauses, fmt.Sprintf("reference_code=$%d", argID))
		args = append(args, newRefCode)
		argID++

		if cat == "LAND" && curCat != "LAND" {
			nullFields := []string{"built_area_sqft", "bedrooms", "bathrooms", "floor_count", "parking_spaces", "year_built", "furnishing", "condition"}
			for _, f := range nullFields {
				if _, ok := payload[f]; !ok {
					setClauses = append(setClauses, fmt.Sprintf("%s=NULL", f))
				}
			}
		}

		if listType == "SALE" && curListType != "SALE" {
			nullFields := []string{"rent_period", "minimum_lease_months", "advance_months", "deposit_lkr"}
			for _, f := range nullFields {
				if _, ok := payload[f]; !ok {
					setClauses = append(setClauses, fmt.Sprintf("%s=NULL", f))
				}
			}
		}
	}

	if len(setClauses) > 0 {
		setClauses = append(setClauses, fmt.Sprintf("updated_by=$%d", argID))
		args = append(args, h.userID(r))
		argID++

		setClauses = append(setClauses, "updated_at=now()")

		query := fmt.Sprintf("UPDATE properties SET %s WHERE id=$%d", strings.Join(setClauses, ", "), argID)
		args = append(args, id)

		_, err := h.DB.Exec(query, args...)
		if err != nil {
			httpx.Error(w, 500, "SERVER_ERROR", "Failed to update property: "+err.Error(), nil)
			return
		}
	}

	// Also handle partial updates for docs and images if they were sent
	var in propertyInput
	b, _ := json.Marshal(payload)
	json.Unmarshal(b, &in)
	
	if _, ok := payload["cover_image"]; ok || payload["gallery"] != nil {
		savePropertyImages(h.DB, id, in)
	}
	if _, ok := payload["documents"]; ok {
		savePropertyDocs(h.DB, id, in)
	}

	h.audit(h.userID(r), "UPDATE", "property", id)
	httpx.JSON(w, 200, map[string]string{"status": "updated"})
}

// DELETE /api/v1/admin/properties/{id}
func (h *AdminHandler) ArchiveProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.DB.Exec(`UPDATE properties SET status='ARCHIVED', updated_at=now() WHERE id=$1`, id)
	httpx.JSON(w, 200, map[string]string{"status": "archived"})
}

// POST /api/v1/admin/properties/{id}/status
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

	switch req.Status {
	case "PUBLISHED":
		var imgCount int
		var hasCover bool
		var p models.Property
		var city, priceUnit sql.NullString
		var provinceId, districtId sql.NullInt64
		var priceLKR sql.NullFloat64
		
		h.DB.QueryRow(`
			SELECT p.category, p.listing_type, p.province_id, p.district_id, p.city, p.title, p.slug, p.short_description, p.description, p.price_lkr, p.price_on_request, p.price_unit,
			       (SELECT count(*) FROM property_images WHERE property_id=$1),
			       EXISTS(SELECT 1 FROM property_images WHERE property_id=$1 AND is_cover=true)
			FROM properties p WHERE p.id=$1`, id).Scan(
			&p.Category, &p.ListingType, &provinceId, &districtId, &city, &p.Title, &p.Slug, &p.ShortDescription, &p.Description, &priceLKR, &p.PriceOnRequest, &priceUnit, &imgCount, &hasCover)
		
		if p.Category == "" || p.ListingType == "" || !provinceId.Valid || provinceId.Int64 == 0 || !districtId.Valid || districtId.Int64 == 0 || !city.Valid || city.String == "" || p.Title == "" || p.Slug == "" || p.ShortDescription == "" || p.Description == "" {
			httpx.Error(w, 400, "VALIDATION_ERROR", "Cannot publish: All required fields (Property Type, Listing Type, Province, District, City, Title, Slug, Short Description, Description) must be filled.", nil)
			return
		}
		if !p.PriceOnRequest && (!priceLKR.Valid || priceLKR.Float64 <= 0 || !priceUnit.Valid || priceUnit.String == "") {
			httpx.Error(w, 400, "VALIDATION_ERROR", "Cannot publish: Price and Price Unit must be specified unless Price On Request is checked.", nil)
			return
		}
		if imgCount < 3 || !hasCover {
			httpx.Error(w, 400, "VALIDATION_ERROR", "At least 3 images and a cover photo are required before publishing", nil)
			return
		}
		h.DB.Exec(`UPDATE properties SET status=$1, published_at=COALESCE(published_at, now()), sold_rented_at=NULL, updated_at=now() WHERE id=$2`, req.Status, id)
	case "SOLD", "RENTED":
		h.DB.Exec(`UPDATE properties SET status=$1, sold_rented_at=now(), updated_at=now() WHERE id=$2`, req.Status, id)
	case "RESERVED":
		h.DB.Exec(`UPDATE properties SET status=$1, sold_rented_at=NULL, updated_at=now() WHERE id=$2`, req.Status, id)
	default:
		h.DB.Exec(`UPDATE properties SET status=$1, sold_rented_at=NULL, updated_at=now() WHERE id=$2`, req.Status, id)
	}

	httpx.JSON(w, 200, map[string]string{"status": req.Status})
}

func (h *AdminHandler) DuplicateProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var seq int
	var cat, listingType string
	h.DB.QueryRow(`SELECT category, listing_type FROM properties WHERE id=$1`, id).Scan(&cat, &listingType)
	h.DB.QueryRow(`SELECT COALESCE(MAX(SPLIT_PART(reference_code, '-', 3)::integer), -1) + 1 FROM properties WHERE reference_code LIKE 'DHR-%-%'`).Scan(&seq)
	refCode := util.NextReferenceCode(cat, seq, listingType == "RENT")
	uid := h.userID(r)
	var newId string

	err := h.DB.QueryRow(`
		INSERT INTO properties (
			reference_code, title, slug, category, listing_type, status, is_featured,
			short_description, description, price_lkr, price_on_request, price_unit, is_negotiable,
			rent_period, minimum_lease_months, advance_months, deposit_lkr,
			province_id, district_id, city, address_line, map_url, show_exact_location, latitude, longitude,
			land_area_unit, land_area_count, road_access, road_width_ft, road_surface, land_shape, frontage_ft, land_type,
			built_area_sqft, bedrooms, bathrooms, floor_count, parking_spaces, year_built, furnishing, condition,
			has_electricity, water_source, deed_type, deed_note,
			has_boundary_wall, has_solar, ac_ready, beachfront_sea_view, waterfront_riverside, hillside, paddy_front, lake_front, indoor_garden, garage, swimming_pool, gated_community, roof_top_garden, lawn_garden, luxury_specification, security_24_hours, colonial_architecture, maids_room, infinity_pool, home_security_system, maids_toilet, hot_water, overhead_water_tank, attached_toilets, permits_for_gem_mining, soil_test_passed, hilly_landscape, ideal_for_commercial_use, lake_pond_inside_land, bungalow_cottage_type, stream_running_through_land, approved_survey_plan,
			video_url, meta_title, meta_description, created_by, updated_by
		)
		SELECT 
			$2, title || ' (Copy)', slug || '-copy-' || EXTRACT(EPOCH FROM now())::int, category, listing_type, 'DRAFT', false,
			short_description, description, price_lkr, price_on_request, price_unit, is_negotiable,
			rent_period, minimum_lease_months, advance_months, deposit_lkr,
			province_id, district_id, city, address_line, map_url, show_exact_location, latitude, longitude,
			land_area_unit, land_area_count, road_access, road_width_ft, road_surface, land_shape, frontage_ft, land_type,
			built_area_sqft, bedrooms, bathrooms, floor_count, parking_spaces, year_built, furnishing, condition,
			has_electricity, water_source, deed_type, deed_note,
			has_boundary_wall, has_solar, ac_ready, beachfront_sea_view, waterfront_riverside, hillside, paddy_front, lake_front, indoor_garden, garage, swimming_pool, gated_community, roof_top_garden, lawn_garden, luxury_specification, security_24_hours, colonial_architecture, maids_room, infinity_pool, home_security_system, maids_toilet, hot_water, overhead_water_tank, attached_toilets, permits_for_gem_mining, soil_test_passed, hilly_landscape, ideal_for_commercial_use, lake_pond_inside_land, bungalow_cottage_type, stream_running_through_land, approved_survey_plan,
			video_url, meta_title, meta_description, $3, $3
		FROM properties WHERE id=$1
		RETURNING id`, id, refCode, uid).Scan(&newId)
	
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to duplicate: " + err.Error(), nil)
		return
	}
	
	// Copy images
	h.DB.Exec(`
		INSERT INTO property_images (property_id, url, alt_text, caption, sort_order, is_cover)
		SELECT $1, url, alt_text, caption, sort_order, is_cover FROM property_images WHERE property_id=$2
	`, newId, id)
	
	// Copy documents
	h.DB.Exec(`
		INSERT INTO property_documents (property_id, type, title, file_url, file_size_bytes, access, is_watermarked)
		SELECT $1, type, title, file_url, file_size_bytes, access, is_watermarked FROM property_documents WHERE property_id=$2
	`, newId, id)
	
	httpx.JSON(w, 200, map[string]string{"status": "duplicated", "id": newId})
}

func (h *AdminHandler) ToggleFeature(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		IsFeatured bool `json:"is_featured"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid body", nil)
		return
	}
	h.DB.Exec(`UPDATE properties SET is_featured=$1, updated_at=now() WHERE id=$2`, req.IsFeatured, id)
	httpx.JSON(w, 200, map[string]string{"status": "ok"})
}

func (h *AdminHandler) BulkAction(w http.ResponseWriter, r *http.Request) { httpx.JSON(w, 200, map[string]string{"status": "ok"}) }
func (h *AdminHandler) DeleteImage(w http.ResponseWriter, r *http.Request) { httpx.JSON(w, 200, map[string]string{"status": "ok"}) }
func (h *AdminHandler) ReorderImages(w http.ResponseWriter, r *http.Request) { httpx.JSON(w, 200, map[string]string{"status": "ok"}) }
func (h *AdminHandler) AddDocument(w http.ResponseWriter, r *http.Request) { httpx.JSON(w, 200, map[string]string{"status": "ok"}) }
func (h *AdminHandler) DeleteDocument(w http.ResponseWriter, r *http.Request) { httpx.JSON(w, 200, map[string]string{"status": "ok"}) }

// ---------- Media ----------

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

func mustJSON(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
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
	rows, _ := h.DB.Query(`SELECT id, name, email, role, is_active, last_login_at FROM users ORDER BY created_at DESC`)
	defer rows.Close()
	out := []models.User{}
	for rows.Next() {
		var u models.User
		rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.IsActive, &u.LastLoginAt)
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
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid payload", nil)
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




