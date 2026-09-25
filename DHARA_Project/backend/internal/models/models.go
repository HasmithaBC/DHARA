package models

import (
	"encoding/json"
	"time"
)

type Province struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type District struct {
	ID         int    `json:"id"`
	ProvinceID int    `json:"province_id"`
	Name       string `json:"name"`
}

type City struct {
	ID         int    `json:"id"`
	DistrictID int    `json:"district_id"`
	Name       string `json:"name"`
}

type User struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	Role         string     `json:"role"` // SALES_MANAGER | CONTENT_EDITOR | ADMINISTRATOR
	IsActive     bool       `json:"is_active"`
	MFAEnabled   bool       `json:"mfa_enabled"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

type Amenity struct {
	ID        int      `json:"id"`
	Name      string   `json:"name"`
	Icon      string   `json:"icon"`
	AppliesTo []string `json:"applies_to"`
}

type PropertyImage struct {
	ID         string `json:"id"`
	PropertyID string `json:"property_id"`
	URL        string `json:"url"`
	AltText    string `json:"alt_text"`
	Caption    *string `json:"caption,omitempty"`
	SortOrder  int    `json:"sort_order"`
	IsCover    bool   `json:"is_cover"`
}

type PropertyDocument struct {
	ID             string `json:"id"`
	PropertyID     string `json:"property_id"`
	Type           string `json:"type"`
	Title          string `json:"title"`
	FileURL        string `json:"file_url,omitempty"`
	Access         string `json:"access"`
	IsWatermarked  bool   `json:"is_watermarked"`
	DownloadCount  int    `json:"download_count"`
}

// Property mirrors SRS §4.2. Pointer fields are nullable columns.
type Property struct {
	ID                string     `json:"id"`
	ReferenceCode     string     `json:"reference_code"`
	Title             string     `json:"title"`
	Slug              string     `json:"slug"`
	Category          string     `json:"category"`
	ListingType       string     `json:"listing_type"`
	Status            string     `json:"status"`
	IsFeatured        bool       `json:"is_featured"`
	ShortDescription  string     `json:"short_description"`
	Description       string     `json:"description"`

	PriceLKR        *float64 `json:"price_lkr,omitempty"`
	PriceOnRequest  bool     `json:"price_on_request"`
	PriceUnit       *string  `json:"price_unit,omitempty"`
	IsNegotiable    bool     `json:"is_negotiable"`

	RentPeriod         *string  `json:"rent_period,omitempty"`
	MinimumLeaseMonths *int     `json:"minimum_lease_months,omitempty"`
	AdvanceMonths      *int     `json:"advance_months,omitempty"`
	DepositLKR         *float64 `json:"deposit_lkr,omitempty"`

	ProvinceID        int     `json:"province_id"`
	DistrictID        int     `json:"district_id"`
	City              *string `json:"city,omitempty"`
	AddressLine       *string `json:"address_line,omitempty"`
	MapURL            *string `json:"map_url,omitempty"`
	ShowExactLocation bool    `json:"show_exact_location"`
	Latitude          float64 `json:"latitude"`
	Longitude         float64 `json:"longitude"`

	LandAreaUnit      *string  `json:"land_area_unit,omitempty"`
	LandAreaCount     *float64 `json:"land_area_count,omitempty"`
	LandShape         *string  `json:"land_shape,omitempty"`
	RoadWidthFt       *int     `json:"road_width_ft,omitempty"`
	RoadAccess        *bool    `json:"road_access,omitempty"`
	RoadSurface       *string  `json:"road_surface,omitempty"`
	FrontageFt        *int     `json:"frontage_ft,omitempty"`
	LandType          *string  `json:"land_type,omitempty"`

	BuiltAreaSqft *int    `json:"built_area_sqft,omitempty"`
	Bedrooms      *int    `json:"bedrooms,omitempty"`
	Bathrooms     *int    `json:"bathrooms,omitempty"`
	FloorCount    *int    `json:"floor_count,omitempty"`
	ParkingSpaces *int    `json:"parking_spaces,omitempty"`
	YearBuilt     *int    `json:"year_built,omitempty"`
	Furnishing    *string `json:"furnishing,omitempty"`
	Condition     *string `json:"condition,omitempty"`

	HasElectricity  *string `json:"has_electricity,omitempty"`
	WaterSource     *string `json:"water_source,omitempty"`
	DeedType        *string `json:"deed_type,omitempty"`
	DeedNote        *string `json:"deed_note,omitempty"`
	HasBoundaryWall            *bool   `json:"has_boundary_wall,omitempty"`
	HasSolar                   *bool   `json:"has_solar,omitempty"`
	ACReady                    *bool   `json:"ac_ready,omitempty"`
	BeachfrontSeaView          *bool   `json:"beachfront_sea_view,omitempty"`
	WaterfrontRiverside        *bool   `json:"waterfront_riverside,omitempty"`
	Hillside                   *bool   `json:"hillside,omitempty"`
	PaddyFront                 *bool   `json:"paddy_front,omitempty"`
	LakeFront                  *bool   `json:"lake_front,omitempty"`
	IndoorGarden               *bool   `json:"indoor_garden,omitempty"`
	Garage                     *bool   `json:"garage,omitempty"`
	SwimmingPool               *bool   `json:"swimming_pool,omitempty"`
	GatedCommunity             *bool   `json:"gated_community,omitempty"`
	RoofTopGarden              *bool   `json:"roof_top_garden,omitempty"`
	LawnGarden                 *bool   `json:"lawn_garden,omitempty"`
	LuxurySpecification        *bool   `json:"luxury_specification,omitempty"`
	Security24Hours            *bool   `json:"security_24_hours,omitempty"`
	ColonialArchitecture       *bool   `json:"colonial_architecture,omitempty"`
	MaidsRoom                  *bool   `json:"maids_room,omitempty"`
	InfinityPool               *bool   `json:"infinity_pool,omitempty"`
	HomeSecuritySystem         *bool   `json:"home_security_system,omitempty"`
	MaidsToilet                *bool   `json:"maids_toilet,omitempty"`
	HotWater                   *bool   `json:"hot_water,omitempty"`
	OverheadWaterTank          *bool   `json:"overhead_water_tank,omitempty"`
	AttachedToilets            *bool   `json:"attached_toilets,omitempty"`
	PermitsForGemMining        *bool   `json:"permits_for_gem_mining,omitempty"`
	SoilTestPassed             *bool   `json:"soil_test_passed,omitempty"`
	HillyLandscape             *bool   `json:"hilly_landscape,omitempty"`
	IdealForCommercialUse      *bool   `json:"ideal_for_commercial_use,omitempty"`
	LakePondInsideLand         *bool   `json:"lake_pond_inside_land,omitempty"`
	BungalowCottageType        *bool   `json:"bungalow_cottage_type,omitempty"`
	StreamRunningThroughLand   *bool   `json:"stream_running_through_land,omitempty"`
	ApprovedSurveyPlan         *bool   `json:"approved_survey_plan,omitempty"`

	VideoURL        *string `json:"video_url,omitempty"`
	GoogleDriveURL  *string `json:"google_drive_url,omitempty"`
	MetaTitle       *string `json:"meta_title,omitempty"`
	MetaDescription *string `json:"meta_description,omitempty"`

	PublishedAt  *time.Time `json:"published_at,omitempty"`
	SoldRentedAt *time.Time `json:"sold_rented_at,omitempty"`
	CreatedBy   string     `json:"created_by"`
	UpdatedBy   string     `json:"updated_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	ViewCount   int        `json:"view_count"`

	// Populated by handlers, not columns:
	Images   []PropertyImage    `json:"images,omitempty"`
	Docs     []PropertyDocument `json:"documents,omitempty"`
	Amenities []Amenity         `json:"amenities,omitempty"`
	CoverURL string             `json:"cover_url,omitempty"`
}

type Lead struct {
	ID                       string     `json:"id"`
	LeadType                 string     `json:"lead_type"`
	PropertyID               *string    `json:"property_id,omitempty"`
	Name                     string     `json:"name"`
	Email                    string     `json:"email"`
	Phone                    string     `json:"phone"`
	WhatsappSameAsPhone      bool       `json:"whatsapp_same_as_phone"`
	Message                  *string    `json:"message,omitempty"`
	OfferAmountLKR           *float64   `json:"offer_amount_lkr,omitempty"`
	PreferredInspectionDate  *string    `json:"preferred_inspection_date,omitempty"`
	PreferredInspectionSlot  *string    `json:"preferred_inspection_slot,omitempty"`
	Status                   string     `json:"status"`
	AssignedTo               *string    `json:"assigned_to,omitempty"`
	InternalNotes            *string    `json:"internal_notes,omitempty"`
	SourceURL                *string    `json:"source_url,omitempty"`
	UTMSource                *string    `json:"utm_source,omitempty"`
	UTMMedium                *string    `json:"utm_medium,omitempty"`
	UTMCampaign              *string    `json:"utm_campaign,omitempty"`
	CreatedAt                time.Time  `json:"created_at"`
}

type Service struct {
	ID        string `json:"id"`
	Slug      string `json:"slug"`
	Title     string `json:"title"`
	Summary   string `json:"summary"`
	Body      string `json:"body,omitempty"`
	Icon      string `json:"icon"`
	HeroImage string `json:"hero_image"`
	SortOrder int    `json:"sort_order"`
}

type Project struct {
	ID            string `json:"id"`
	Slug          string `json:"slug"`
	Title         string `json:"title"`
	ClientName    string `json:"client_name,omitempty"`
	Sector        string `json:"sector"`
	Location      string `json:"location"`
	YearCompleted int    `json:"year_completed"`
	Scope         string `json:"scope,omitempty"`
	Body          string `json:"body,omitempty"`
	CoverImage    string `json:"cover_image"`
	IsFeatured    bool   `json:"is_featured"`
}

type Testimonial struct {
	ID             string `json:"id"`
	AuthorName     string `json:"author_name"`
	AuthorLocation string `json:"author_location"`
	Quote          string `json:"quote"`
	Rating         int    `json:"rating"`
}

type AuditLog struct {
	ID         string          `json:"id"`
	UserID     *string         `json:"user_id,omitempty"`
	Action     string          `json:"action"`
	EntityType string          `json:"entity_type"`
	EntityID   string          `json:"entity_id"`
	Diff       json.RawMessage `json:"diff,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}
